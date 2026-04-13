export default function MenuItemSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <div className="h-6 w-1/3 rounded bg-gray-200" />
        <div className="flex-grow border-b border-dotted border-gray-300" />
        <div className="h-6 w-16 rounded bg-gray-200" />
      </div>
      <div className="h-4 w-full rounded bg-gray-200" />
      <div className="mt-2 flex justify-between">
        <div className="h-4 w-20 rounded bg-gray-200" />
        <div className="h-8 w-24 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
