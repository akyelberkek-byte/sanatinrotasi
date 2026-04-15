export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div
          className="inline-block w-8 h-8 border-2 border-ink/20 border-t-accent rounded-full animate-spin"
          role="status"
          aria-label="Yukleniyor"
        />
        <p className="font-serif text-warm-gray mt-4">Yukleniyor...</p>
      </div>
    </div>
  );
}
