"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

type AppChromeProps = {
  children: ReactNode;
  currentUser: {
    id: number;
    username: string;
    fullName: string | null;
  } | null;
};

export function AppChrome({ children, currentUser }: AppChromeProps) {
  const pathname = usePathname();
  const isImmersive = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/auth";

  if (isImmersive) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader currentUser={currentUser} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </>
  );
}
