interface SectionLabelProps {
  label: string;
  className?: string;
}

export default function SectionLabel({ label, className = "" }: SectionLabelProps) {
  return (
    <span
      className={`font-sans text-[0.65rem] uppercase tracking-[0.3em] text-warm-gray ${className}`}
    >
      {label}
    </span>
  );
}
