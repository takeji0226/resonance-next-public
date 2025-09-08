export const metadata = {
  title: 'Resonance App',
  description: 'Rails API + Next.js Example',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ backgroundColor: "#f0f0f0", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
