import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-50">Create your library</h1>
      <p className="mb-6 text-sm text-zinc-400">Start cataloging your books in minutes.</p>
      <RegisterForm />
    </div>
  );
}
