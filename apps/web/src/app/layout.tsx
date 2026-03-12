import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Optimizer",
  description: "AI-powered code optimization and benchmarking platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <a href="/" className="text-xl font-bold text-gray-900">
              Code Optimizer
            </a>
            <nav className="flex gap-6 text-sm text-gray-600">
              <a href="/" className="hover:text-gray-900">
                Submit
              </a>
              <a href="/submissions" className="hover:text-gray-900">
                History
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
