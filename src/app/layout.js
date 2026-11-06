import "./globals.css";

export const metadata = {
  title: "stockflow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}