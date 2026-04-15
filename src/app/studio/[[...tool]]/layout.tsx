export const metadata = {
  title: "Sanatın Rotası — Admin Panel",
  description: "İçerik yönetim paneli",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
