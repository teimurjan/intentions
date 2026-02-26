import "@/styles/globals.css";
import clsx from "clsx";
import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/navbar";
import { fontSans } from "@/config/fonts";
import { siteConfig } from "@/config/site";
import { ProviderContextProvider } from "@/contexts/provider-context";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <ProviderContextProvider>
            <div className="relative flex flex-col min-h-screen">
              <Navbar />
              <main>{children}</main>
              <footer className="w-full flex items-center justify-center py-6 border-t border-divider">
                <span className="text-default-500 text-sm">
                  Built with intentions — LLM-powered headless UI components
                </span>
              </footer>
            </div>
          </ProviderContextProvider>
        </Providers>
      </body>
    </html>
  );
}
