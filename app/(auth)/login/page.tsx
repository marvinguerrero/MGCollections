import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-50">Welcome back</h1>
      <p className="mb-6 text-sm text-zinc-400">Sign in to your library.</p>
      <LoginForm />
    </div>
  );
}
