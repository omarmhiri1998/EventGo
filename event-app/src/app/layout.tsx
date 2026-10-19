import "./globals.css";

import { Geist } from "next/font/google";
import { redirect } from "next/navigation";

import { Navbar } from "@/components/organisms/Navbar/Navbar";
import { Footer } from "@/components/organisms/Footer/Footer";
import { FloatingCart } from "@/components/organisms/FloatingCart/FloatingCart";

import { getSession } from "@/lib/auth";
import { cn } from "../lib/utils";

export const instant = false;

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable)}
    >
      <body>
        <Navbar role={session.role} />

        {children}

        <Footer />

        <FloatingCart />
      </body>
    </html>
  );
}