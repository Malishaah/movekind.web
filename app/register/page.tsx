import RegisterForm from "@/app/(components)/RegisterForm";

export const metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <main
      className="min-h-[calc(100svh-5rem)] flex items-center justify-center bg-zinc-50 px-4 py-10"
      aria-labelledby="register-title"
    >
      <div className="w-full max-w-xl">
        <h1
          id="register-title"
          className="mb-2 text-2xl font-semibold tracking-tight"
        >
          Create your account
        </h1>

        <h2 className="mb-6 text-sm text-zinc-600">
          Fill in your details to get started.
        </h2>

        <RegisterForm />
      </div>
    </main>
  );
}
