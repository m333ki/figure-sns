const SPLIT_REGEX = /(https?:\/\/[^\s]+)/g;
const IS_URL_REGEX = /^https?:\/\//;

// Splits on a capturing group so the URL delimiters themselves come back
// interleaved in the result array (standard String.split behavior) --
// no regex lastIndex statefulness to worry about.
export default function Linkify({ text, isMine }: { text: string; isMine?: boolean }) {
  const parts = text.split(SPLIT_REGEX);
  return (
    <>
      {parts.map((part, i) =>
        IS_URL_REGEX.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`underline underline-offset-2 ${
              isMine
                ? "text-blue-100 hover:text-white"
                : "text-blue-600 hover:text-blue-700 dark:text-blue-400"
            }`}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
