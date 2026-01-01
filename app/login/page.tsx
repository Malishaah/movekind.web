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
