import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { IconPlay } from "@/components/icons";

export default function RegisterPage() {
  return (
    <AuthShell mode="register">
      <div className="ec-card-dashed w-full max-w-[520px] px-5 py-6 backdrop-blur-[1px] sm:px-7 sm:py-8 lg:px-8 lg:py-9">
        <h2 className="text-center text-[34px] font-semibold tracking-[-0.02em] text-[var(--ec-text-dark)] sm:text-[44px] lg:text-[56px]">
          Create an account
        </h2>
        <p className="mt-1 text-center text-[14px] text-[#1f2e5d] sm:text-[17px] lg:text-[20px]">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-2 hover:text-[#14296d]">
            Log in
          </Link>
        </p>

        <form action="/api/auth/register" method="post" className="mt-6 space-y-3 sm:mt-7 sm:space-y-4">
          <label className="block text-[20px] font-medium leading-none text-[#111f4f] sm:text-[24px] lg:text-[30px]">
            Username
            <input
              name="username"
              required
              minLength={3}
              maxLength={40}
              className="ec-focus ec-interactive mt-2.5 h-12 w-full rounded-full border border-[color:var(--ec-accent-2)] bg-[var(--ec-input-bg)] px-4 text-[16px] text-[#0f214f] outline-none placeholder:text-[#3b4d85]/60 sm:h-13 sm:px-5 sm:text-[18px] lg:h-14 lg:text-[22px]"
              placeholder="student_name"
            />
          </label>

          <label className="block text-[20px] font-medium leading-none text-[#111f4f] sm:text-[24px] lg:text-[30px]">
            Email
            <input
              name="email"
              type="email"
              required
              className="ec-focus ec-interactive mt-2.5 h-12 w-full rounded-full border border-[color:var(--ec-accent-2)] bg-[var(--ec-input-bg)] px-4 text-[16px] text-[#0f214f] outline-none placeholder:text-[#3b4d85]/60 sm:h-13 sm:px-5 sm:text-[18px] lg:h-14 lg:text-[22px]"
              placeholder="student@educast.ai"
            />
          </label>

          <label className="block text-[20px] font-medium leading-none text-[#111f4f] sm:text-[24px] lg:text-[30px]">
            Password
            <input
              name="password"
              type="password"
              required
              className="ec-focus ec-interactive mt-2.5 h-12 w-full rounded-full border border-[color:var(--ec-accent-2)] bg-[var(--ec-input-bg)] px-4 text-[16px] text-[#0f214f] outline-none placeholder:text-[#3b4d85]/60 sm:h-13 sm:px-5 sm:text-[18px] lg:h-14 lg:text-[22px]"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="ec-interactive ec-press ec-focus mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#100d79] text-[20px] font-medium text-white hover:brightness-110 sm:h-13 sm:text-[24px] lg:h-14 lg:text-[30px]"
          >
            Sign up <IconPlay className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
