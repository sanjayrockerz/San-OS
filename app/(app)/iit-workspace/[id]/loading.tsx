export default function CourseDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-4 px-4 py-6">
      <div className="flex items-start gap-4">
        <div className="size-9 rounded-xl bg-secondary" />
        <div className="space-y-2">
          <div className="h-4 w-20 rounded-lg bg-secondary" />
          <div className="h-7 w-48 rounded-xl bg-secondary" />
          <div className="h-4 w-32 rounded-lg bg-secondary" />
        </div>
      </div>
      <div className="h-20 rounded-2xl bg-secondary" />
      <div className="flex gap-2">
        <div className="h-10 w-36 rounded-xl bg-secondary" />
        <div className="h-10 w-36 rounded-xl bg-secondary" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-secondary" />
        ))}
      </div>
    </div>
  );
}
