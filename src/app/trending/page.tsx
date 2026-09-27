import TrendingHashtags from "@/components/TrendingHashtags";

export default function TrendingPage() {
  return (
    <div className="mx-auto w-full px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-foreground">トレンド</h1>
      <TrendingHashtags />
    </div>
  );
}
