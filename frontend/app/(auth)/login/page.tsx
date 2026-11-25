"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthCard from "@/components/AuthCard";
import { Spinner } from "@/components/ui";
import { errMsg } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loginSchema, type LoginForm } from "@/lib/schemas";
import { useToast } from "@/lib/toast";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => { if (!loading && user) router.replace("/dashboard"); }, [loading, user, router]);

  const onSubmit = async (v: LoginForm) => {
    try {
      await login(v.email, v.password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <AuthCard title="Log in" footer={<>No account? <Link href="/register" className="font-medium text-indigo-600">Register</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" {...register("email")} />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="input" {...register("password")} />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>
        <button className="btn btn-primary w-full" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4" />} Log in</button>
        <p className="text-center text-xs text-slate-500">Demo after seeding: demo@example.com / Demo@12345</p>
      </form>
    </AuthCard>
  );
}
