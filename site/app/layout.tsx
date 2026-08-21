import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import CommandPalette from "@/components/CommandPalette";
import HashRedirect from "@/components/HashRedirect";
import Footer from "@/components/Footer";

const mono = IBM_Plex_Mono({
  variable: "--font-mono-lab",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Indraswara",
  description: "Computer Science student at ITB, Security Engineer, and Developer",
  metadataBase: new URL("https://egolab.top"),
  openGraph: {
    type: "website",
    title: "Indraswara",
    description: "Computer Science student at ITB, Security Engineer, and Developer",
    url: "https://egolab.top",
  },
  twitter: {
    card: "summary",
    title: "Indraswara",
    description: "Computer Science student at ITB, Security Engineer, and Developer",
  },
  icons: { icon: "/favicon.svg" },
};

// Runs before hydration to avoid a light-mode flash. Dark is the default
// identity of the site — only an explicit "light" in localStorage opts out.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored !== "light") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <HashRedirect />
        <CommandPalette />
        <div className="w-full px-6 pt-5 sm:px-8">
          <Nav />
        </div>
        <main className="flex flex-1 flex-col">{children}</main>
        <div className="w-full px-6 pb-5 sm:px-8">
          <Footer />
        </div>
      </body>
    </html>
  );
}
