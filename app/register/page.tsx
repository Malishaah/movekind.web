import RegisterForm from "@/app/(components)/RegisterForm";

export const metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <main className="min-h-[calc(100svh-5rem)] flex items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-xl">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Create your account</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
