import "./globals.css";

export const metadata = {
  title: {
    default: "StockFlow",
    template: "%s | StockFlow",
  },
  description: "Straightforward inventory management for small businesses.",
  icons: {
    icon: "/stockflow-mark.svg",
    apple: "/stockflow-mark.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
