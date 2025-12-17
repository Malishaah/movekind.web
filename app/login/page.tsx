// app/login/page.tsx
import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import LoginForm from "../(components)/LoginForm";

const HERO = "/media/dxkejxcv/hero-auth.jpg"; // funkar med din proxy /media/*

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100svh-5rem)] flex items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-2">
        {/* Vänster: Hero */}
        <div className="relative overflow-hidden rounded-[32px] order-last md:order-first">
          <Image
            src={HERO}
            alt="Welcome back to MoveKind"
            width={1600}
            height={900}
            priority
            className="h-64 w-full object-cover sm:h-full"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex items-end sm:items-center p-6 sm:p-10">
            <div>
              <h1 className="font-semibold text-white/95 tracking-tight text-2xl sm:text-3xl">
                Welcome back to <span className="font-bold">MoveKind</span>
              </h1>
              <p className="mt-2 text-white text-xl sm:text-2xl font-medium leading-tight">
                Pick up where you left off.
              </p>
            </div>
          </div>
        </div>

        {/* Höger: Formulär */}
        <div className="flex items-center">
          <div className="w-full">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <LogIn className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Log in</h2>
              </div>

              {/* Din befintliga klientkomponent */}
              <LoginForm />

              {/* Länkar */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <Link href="/register" className="text-zinc-700 hover:underline">
                  Create an account
                </Link>
                <Link href="/forgot" className="text-zinc-700 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Tipslänkar (som du hade) */}
              <p className="mt-6 text-sm text-zinc-600">
                After logging in, try{" "}
                <Link href="/profile" className="font-medium text-zinc-900 hover:underline">
                  /profile
                </Link>{" "}
                and{" "}
                <Link href="/favorites" className="font-medium text-zinc-900 hover:underline">
                  /favorites
                </Link>
                .
              </p>

              {/* Divider */}
              <div className="my-6 h-px w-full bg-zinc-200" />

              {/* Social auth (dummy knappar) */}
              <div className="text-center">
                <div className="text-zinc-600">or continue with</div>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    className="inline-flex size-11 items-center justify-center rounded-full bg-white shadow border border-zinc-200 hover:bg-zinc-50"
                    aria-label="Continue with Apple"
                  >
                    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
                      <path d="M16.365 1.43c0 1.14-.43 2.2-1.2 3-.77.82-2.03 1.45-3.18 1.34-.14-1.06.45-2.2 1.2-2.98.8-.86 2.2-1.5 3.18-1.36zM20.4 17.04c-.59 1.37-1.32 2.72-2.38 3.82-.91.95-2.02 2.03-3.36 2.03-1.26 0-1.59-.66-3.3-.66-1.73 0-2.1.64-3.36.67-1.35.03-2.38-1.04-3.3-1.98-1.8-1.86-3.19-4.98-3.2-7.93-.02-1.55.33-3.07 1.16-4.37C3.27 6.55 4.7 5.6 6.34 5.57c1.27-.03 2.47.7 3.3.7.82 0 2.3-.86 3.88-.73.66.03 2.51.26 3.7 2.03-3.24 1.76-2.74 6.34.48 7.47z" />
                    </svg>
                  </button>
                  <button
                    className="inline-flex size-11 items-center justify-center rounded-full bg-white shadow border border-zinc-200 hover:bg-zinc-50"
                    aria-label="Continue with Google"
                  >
                    <svg viewBox="0 0 24 24" className="size-6">
                      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.24 1.38-1.62 4.05-5.4 4.05a6.3 6.3 0 1 1 0-12.6 5.49 5.49 0 0 1 3.87 1.53l2.64-2.55A9.49 9.49 0 0 0 12 2.7 9.3 9.3 0 1 0 21.3 12c0-.6-.06-1.05-.15-1.8H12z" />
                      <path fill="#34A853" d="M3.17 7.7a7.56 7.56 0 0 1 8.83-3.35v3.85a4.55 4.55 0 0 0-6.96 2.37L3.17 7.7z" />
                      <path fill="#4A90E2" d="M12 21.15c2.88 0 5.31-.96 7.08-2.6l-3.47-2.7c-.96.66-2.25 1.11-3.6 1.11A6.3 6.3 0 0 1 5.08 12H1.1a10.05 10.05 0 0 0 10.9 9.15z" />
                      <path fill="#FBBC05" d="M20.4 8.25H12V12h4.8c-.24 1.5-1.68 4.05-4.8 4.05-2.91 0-5.31-2.4-5.31-5.31 0-2.91 2.4-5.31 5.31-5.31 1.5 0 2.88.6 3.84 1.56l2.55-2.55A9.14 9.14 0 0 0 12 2.7 9.3 9.3 0 1 0 21.3 12c0-.6-.06-1.05-.15-1.8z" />
                    </svg>
                  </button>
                  <button
                    className="inline-flex size-11 items-center justify-center rounded-full bg-white shadow border border-zinc-200 hover:bg-zinc-50"
                    aria-label="Continue with Facebook"
                  >
                    <svg viewBox="0 0 24 24" className="size-6" fill="#1877F2">
                      <path d="M22 12a10 10 0 1 0-11.56 9.9v-7H7.9V12h2.53V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.24c-1.22 0-1.6.76-1.6 1.55V12h2.72l-.44 2.9H13.6v7A10 10 0 0 0 22 12z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Liten copy under kortet */}
            <p className="mt-4 text-center text-xs text-zinc-500">
              By continuing you agree to our{" "}
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
