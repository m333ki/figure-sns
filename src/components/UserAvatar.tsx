import Image from "next/image";

export default function UserAvatar({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3/5 w-3/5">
          <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a8.25 8.25 0 0 1 15 0" />
        </svg>
      </div>
    );
  }

  return (
    <Image src={src} alt={alt} fill unoptimized className="object-cover" />
  );
}
