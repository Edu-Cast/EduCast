import type { ReactNode } from "react";
import { IconCap, IconNext, IconPause, IconPlay, IconPrev } from "@/components/icons";

export function AuthShell({ children, mode }: { children: ReactNode; mode: "login" | "register" }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[40%_60%]">
      <section className="relative overflow-hidden bg-[var(--ec-bg-auth-left)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(203,218,255,0.95),rgba(99,133,218,0.25)_40%,rgba(9,28,94,0.95)_78%)]" />

        <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div>
            <h1 className="max-w-[320px] text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[40px] lg:text-[52px]">
              Listen, record, and share your lectures
            </h1>

            <div className="mt-6 rounded-[999px] border border-white/15 bg-white/15 px-6 py-8 backdrop-blur-sm sm:mt-8 sm:px-8 lg:mt-10 lg:px-10 lg:py-12">
              <div className="mx-auto flex max-w-[300px] items-end justify-center gap-3 sm:gap-4 lg:gap-5">
                {[34, 92, 58, 118, 46, 87, 38].map((height, index) => (
                  <span
                    key={`bar-${index}`}
                    className="w-[5px] rounded-full bg-[#0c1f69] shadow-[0_0_8px_rgba(11,26,86,0.45)] sm:w-[6px] lg:w-[7px]"
                    style={{ height: `${Math.max(24, Math.round(height * 0.8))}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-6 flex items-center justify-around text-[#bdd0ff] sm:mb-8 lg:mb-10">
              <IconCap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              <span className="text-[14px] sm:text-[16px] lg:text-[20px]">✣</span>
              <span className="text-[14px] sm:text-[16px] lg:text-[20px]">⟟</span>
              <span className="text-[14px] sm:text-[16px] lg:text-[20px]">√x</span>
              <IconCap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
            </div>
            <div className="flex items-center justify-center gap-8 text-[#dce7ff] sm:gap-10 lg:gap-14">
              <IconPrev className="h-9 w-9 sm:h-11 sm:w-11 lg:h-14 lg:w-14" />
              {mode === "login" ? <IconPlay className="h-11 w-11 sm:h-14 sm:w-14 lg:h-16 lg:w-16" /> : <IconPause className="h-11 w-11 sm:h-14 sm:w-14 lg:h-16 lg:w-16" />}
              <IconNext className="h-9 w-9 sm:h-11 sm:w-11 lg:h-14 lg:w-14" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[var(--ec-bg-auth-right)]">
        <div className="absolute -right-24 -top-24 h-[220px] w-[220px] rounded-full border-[8px] border-[color:var(--ec-accent)]/70 sm:h-[280px] sm:w-[280px] lg:h-[320px] lg:w-[320px] lg:border-[10px]" />
        <div className="absolute -right-10 top-0 hidden h-[210px] w-[260px] rounded-[60%] border-[8px] border-[color:var(--ec-accent)]/55 blur-[1px] sm:block" />
        <div className="absolute -bottom-24 left-[10%] h-[280px] w-[280px] rounded-full border-[7px] border-[color:var(--ec-accent)]/60 sm:left-[18%] sm:h-[360px] sm:w-[360px] lg:-bottom-32 lg:left-[22%] lg:h-[430px] lg:w-[430px] lg:border-[9px]" />

        <div className="relative z-10 grid min-h-[55vh] place-items-center p-4 sm:min-h-screen sm:p-6">{children}</div>
      </section>
    </div>
  );
}
