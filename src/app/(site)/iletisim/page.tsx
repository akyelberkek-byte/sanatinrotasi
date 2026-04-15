import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import SectionLabel from "@/components/shared/SectionLabel";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Sanatın Rotası ile iletişime geçin — iş birliği, öneri veya sorularınız için bize yazın.",
};

export default function IletisimPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <SectionLabel label="İletişim" className="mb-3 block" />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink">
          Bize <span className="italic text-accent">Ulaşın</span>
        </h1>
        <p className="font-serif text-lg text-soft-black/70 mt-3">
          İş birliği, öneri veya sorularınız için bize yazın.
        </p>
      </header>
      <ContactForm />
    </div>
  );
}
