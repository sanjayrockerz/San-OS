export default function RoadmapsLoading() {
  return (
    <div className="animate-pulse space-y-4 px-4 py-6">
      <div className="h-8 w-40 rounded-xl bg-secondary" />
      <div className="h-4 w-80 rounded-lg bg-secondary" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-secondary" />
        ))}
      </div>
    </div>
  );
}
