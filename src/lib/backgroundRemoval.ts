// Runs fully client-side (WASM), so this is dynamically imported from
// inside the caller (never at module load time) to keep it out of the
// server-render pass entirely.
export async function removeImageBackground(file: File): Promise<File> {
  const { removeBackground } = await import("@imgly/background-removal");
  const blob = await removeBackground(file, {
    model: "isnet_quint8",
    output: { format: "image/png", quality: 0.8 },
  });
  const cleaned = await cleanAlphaMatte(blob, file);
  const name = file.name.replace(/\.[^./\\]+$/, "") + ".png";
  return new File([cleaned], name, { type: "image/png" });
}

// Semi-transparent edge pixels from the matting model still carry the
// original (often light/white) background color, so compositing them onto
// the shelf's dark background shows up as a faint white halo around the
// figure. Snapping near-transparent pixels fully transparent removes that
// bleed. Kept low (rather than the ~50% used previously) so genuinely
// uncertain interior texture -- the kind that produces false "holes" in
// complex, many-toned subjects like a leafy tree -- isn't swept into
// "background" just for being less than fully opaque; only pixels the
// model is already quite confident about get hard-zeroed here.
const FRINGE_ALPHA_THRESHOLD = 20; // ~0.08 * 255

// Cutoff used only to decide hole-fill connectivity (see fillEnclosedHoles).
const HOLE_ALPHA_THRESHOLD = 128;

// Enclosed transparent regions up to this fraction of the image are treated
// as segmentation mistakes and filled back in; larger ones are left alone
// since they're more likely a real gap in the subject (e.g. between an arm
// and the body) that should stay see-through.
const MAX_HOLE_FILL_AREA_RATIO = 0.01;

async function cleanAlphaMatte(resultBlob: Blob, originalFile: File): Promise<Blob> {
  const [resultBitmap, originalBitmap] = await Promise.all([
    createImageBitmap(resultBlob),
    createImageBitmap(originalFile),
  ]);
  const { width, height } = resultBitmap;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    resultBitmap.close();
    originalBitmap.close();
    return resultBlob;
  }
  ctx.drawImage(resultBitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // The original photo's RGB, resampled to the result's dimensions (they're
  // normally identical, but this guards against the model ever returning a
  // slightly different size) -- used to restore real color/detail into any
  // hole that gets filled back in below, rather than just painting it a
  // flat color.
  let originalData: Uint8ClampedArray | null = null;
  const originalCanvas = document.createElement("canvas");
  originalCanvas.width = width;
  originalCanvas.height = height;
  const originalCtx = originalCanvas.getContext("2d");
  if (originalCtx) {
    originalCtx.drawImage(originalBitmap, 0, 0, width, height);
    originalData = originalCtx.getImageData(0, 0, width, height).data;
  }
  resultBitmap.close();
  originalBitmap.close();

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < FRINGE_ALPHA_THRESHOLD) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    }
  }

  fillEnclosedHoles(data, width, height, originalData);

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("アルファチャンネルのクリーンアップに失敗しました"));
    }, "image/png");
  });
}

// Complex, many-toned subjects (e.g. a tree dense with leaves) can trip up
// the matting model into misreading small interior patches as background,
// punching stray transparent "holes" through the middle of the figure.
// A real background always touches the image's outer edge, so flood-filling
// from the border through connected transparent pixels finds the *true*
// background; anything transparent left over afterward must be fully
// enclosed by opaque pixels, which only happens from a segmentation
// mistake. Small enclosed regions get filled back in using the original
// photo's own colors; large ones are left untouched since they're more
// likely a real gap in the subject rather than an error.
function fillEnclosedHoles(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  originalData: Uint8ClampedArray | null
) {
  const total = width * height;
  const isTransparent = (idx: number) => data[idx * 4 + 3] < HOLE_ALPHA_THRESHOLD;

  // 0 = unvisited, 1 = true exterior background (reached from the border),
  // 2 = consumed while walking an enclosed component.
  const state = new Uint8Array(total);
  const queue = new Int32Array(total);
  let qTail = 0;

  const seedExterior = (idx: number) => {
    if (state[idx] === 0 && isTransparent(idx)) {
      state[idx] = 1;
      queue[qTail++] = idx;
    }
  };
  for (let x = 0; x < width; x++) {
    seedExterior(x);
    seedExterior((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    seedExterior(y * width);
    seedExterior(y * width + (width - 1));
  }

  let qHead = 0;
  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) seedExterior(idx - 1);
    if (x < width - 1) seedExterior(idx + 1);
    if (y > 0) seedExterior(idx - width);
    if (y < height - 1) seedExterior(idx + width);
  }

  const maxHoleArea = total * MAX_HOLE_FILL_AREA_RATIO;
  const componentQueue = queue; // reuse the same buffer for each component

  for (let start = 0; start < total; start++) {
    if (state[start] !== 0 || !isTransparent(start)) continue;

    let head = 0;
    let tail = 0;
    componentQueue[tail++] = start;
    state[start] = 2;

    while (head < tail) {
      const idx = componentQueue[head++];
      const x = idx % width;
      const y = (idx / width) | 0;
      if (x > 0 && state[idx - 1] === 0 && isTransparent(idx - 1)) {
        state[idx - 1] = 2;
        componentQueue[tail++] = idx - 1;
      }
      if (x < width - 1 && state[idx + 1] === 0 && isTransparent(idx + 1)) {
        state[idx + 1] = 2;
        componentQueue[tail++] = idx + 1;
      }
      if (y > 0 && state[idx - width] === 0 && isTransparent(idx - width)) {
        state[idx - width] = 2;
        componentQueue[tail++] = idx - width;
      }
      if (y < height - 1 && state[idx + width] === 0 && isTransparent(idx + width)) {
        state[idx + width] = 2;
        componentQueue[tail++] = idx + width;
      }
    }

    if (tail > maxHoleArea || !originalData) continue;

    for (let i = 0; i < tail; i++) {
      const o = componentQueue[i] * 4;
      data[o] = originalData[o];
      data[o + 1] = originalData[o + 1];
      data[o + 2] = originalData[o + 2];
      data[o + 3] = 255;
    }
  }
}
