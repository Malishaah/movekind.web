// app/auth/page.tsx
import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";

const HERO = "/media/tpanosg4/chatgpt-image-4-jan-2026-01_22_13.png";

export default async function AuthPage() {
  return (
    <main className="min-h-[calc(100svh-5rem)] flex items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--ink)]">
      <div className="w-full max-w-xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--card)]">
          <Image
            src={HERO}
            alt="Welcome to MoveKind"
            width={1600}
            height={900}
            priority
            className="h-72 w-full object-cover sm:h-96"
          />

          {/* overlay */}
          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute inset-0 flex items-center">
            <div className="px-6 sm:px-10">
              <h1 className="text-white/95 tracking-tight text-2xl sm:text-3xl font-semibold">
                Welcome to <span className="font-bold">MoveKind</span>
              </h1>
              <p className="mt-2 text-white text-3xl sm:text-5xl font-semibold leading-tight">
                Move well.
                <br className="hidden sm:block" />
                Feel better.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-4">
          <Link
            href="/register"
            className="block w-full rounded-full bg-[var(--btn)] text-[var(--btnText)] text-center py-4 text-lg font-medium shadow-sm hover:opacity-95 transition"
          >
            Sign up
          </Link>

          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--btn)] text-[var(--btnText)] py-4 text-lg font-medium shadow-sm hover:opacity-95 transition"
          >
            <LogIn className="h-5 w-5" />
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
