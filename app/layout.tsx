import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Group Trip Planner",
  description: "Everyone adds their preferences once; get the group's best 3 trip options.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <Link href="/" className="brand">
            Group Trip Planner
          </Link>
          <nav>
            <Link href="/">My preferences</Link>
            <Link href="/results">Results</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
