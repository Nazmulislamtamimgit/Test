"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader, Spinner } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { detailsSchema, passwordSchema, type DetailsForm, type PasswordForm } from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const details = useForm<DetailsForm>({ resolver: zodResolver(detailsSchema), defaultValues: { name: user?.name, email: user?.email } });
  const pw = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const saveDetails = async (body: DetailsForm) => {
    try {
      const r = await api<{ user: User }>("/users/profile", { method: "PUT", body });
      setUser(r.user);
      toast.success("Profile updated");
    } catch (e) { toast.error(errMsg(e)); }
  };
  const savePassword = async (v: PasswordForm) => {
    try {
      await api("/users/profile", { method: "PUT", body: { currentPassword: v.currentPassword, newPassword: v.newPassword } });
      pw.reset();
      toast.success("Password changed");
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Profile" subtitle={`Member since ${fmtDate(user?.createdAt ?? null)}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={details.handleSubmit(saveDetails)} className="card space-y-4" noValidate>
          <h2 className="font-semibold">Account details</h2>
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" {...details.register("name")} />
            {details.formState.errors.name && <p className="field-error">{details.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" {...details.register("email")} />
            {details.formState.errors.email && <p className="field-error">{details.formState.errors.email.message}</p>}
          </div>
          <button className="btn btn-primary" disabled={details.formState.isSubmitting}>
            {details.formState.isSubmitting && <Spinner className="h-4 w-4" />} Save changes
          </button>
        </form>

        <form onSubmit={pw.handleSubmit(savePassword)} className="card space-y-4" noValidate>
          <h2 className="font-semibold">Change password</h2>
          {(["currentPassword", "newPassword", "confirm"] as const).map((f) => (
            <div key={f}>
              <label className="label" htmlFor={f}>{{ currentPassword: "Current password", newPassword: "New password", confirm: "Confirm new password" }[f]}</label>
              <input id={f} type="password" autoComplete={f === "currentPassword" ? "current-password" : "new-password"} className="input" {...pw.register(f)} />
              {pw.formState.errors[f] && <p className="field-error">{pw.formState.errors[f]?.message}</p>}
            </div>
          ))}
          <button className="btn btn-primary" disabled={pw.formState.isSubmitting}>
            {pw.formState.isSubmitting && <Spinner className="h-4 w-4" />} Update password
          </button>
        </form>
      </div>
    </>
  );
}
