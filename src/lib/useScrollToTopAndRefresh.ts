import { usePosts } from "@/context/PostsContext";

// X/Instagram-style Home button behavior: scrolled down -> smooth-scroll to
// top only; already at top -> reload the timeline in place. Callers should
// only invoke the returned handler while the Home screen is the active one
// (a press from elsewhere should just navigate there normally).
export function useScrollToTopAndRefresh() {
  const { refresh } = usePosts();

  return () => {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      refresh();
    }
  };
}
