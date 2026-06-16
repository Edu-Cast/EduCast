import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppChrome } from "@/components/app-chrome";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduCast — Smart Audio Learning Platform",
  description:
    "Educational platform for short student-generated audio explainers with tagging, search, recommendations, and playlists.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <AppChrome currentUser={currentUser}>{children}</AppChrome>
      </body>
    </html>
  );
}
