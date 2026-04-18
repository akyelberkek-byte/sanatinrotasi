interface TopBarProps {
  left?: string;
  right?: string;
}

export default function TopBar({
  left = "Eskişehir — Türkiye",
  right = "Sanat & Kültür Platformu",
}: TopBarProps) {
  return (
    <div
      className="flex justify-between items-center px-6 md:px-12 py-4 border-b border-ink/10 font-sans text-[0.65rem] uppercase tracking-[0.3em] text-warm-gray"
      aria-hidden="true"
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}
