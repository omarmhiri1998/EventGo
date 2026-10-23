import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/templates/AdminShell/AdminShell";
import { getSession } from "@/lib/auth";

import "./globals.css";



const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventGo Admin",
  description: "EventGo Administration Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
  redirect("https://event-app-nine-rose.vercel.app/auth/login");
}

  if (session.role !== "admin") {
    redirect("/");
  }

  return (
    <html lang="en">
      <body
        className={`${geist.className} bg-[#F5F7FA] text-[#08111D] antialiased`}
      >
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}