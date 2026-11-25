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
import { registerSchema, type RegisterForm } from "@/lib/schemas";
import { useToast } from "@/lib/toast";

const FIELDS = [
  { name: "name", label: "Name", type: "text", auto: "name" },
  { name: "email", label: "Email", type: "email", auto: "email" },
  { name: "password", label: "Password", type: "password", auto: "new-password" },
  { name: "confirmPassword", label: "Confirm password", type: "password", auto: "new-password" },
] as const;

export default function RegisterPage() {
  const { user, loading, register: signUp } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  useEffect(() => { if (!loading && user) router.replace("/dashboard"); }, [loading, user, router]);

  const onSubmit = async (v: RegisterForm) => {
    try {
      await signUp(v.name, v.email, v.password);
      toast.success("Account created");
      router.push("/dashboard");
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <AuthCard title="Create account" footer={<>Already registered? <Link href="/login" className="font-medium text-indigo-600">Log in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label className="label" htmlFor={f.name}>{f.label}</label>
            <input id={f.name} type={f.type} autoComplete={f.auto} className="input" {...register(f.name)} />
            {errors[f.name] && <p className="field-error">{errors[f.name]?.message}</p>}
          </div>
        ))}
        <button className="btn btn-primary w-full" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4" />} Register</button>
      </form>
    </AuthCard>
  );
}
