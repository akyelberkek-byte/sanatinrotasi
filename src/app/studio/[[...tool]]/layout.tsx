import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sanatin Rotasi — Admin Panel",
  description: "Icerik yonetim paneli",
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div style={{ margin: 0, height: "100vh" }}>{children}</div>;
}
