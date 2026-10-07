"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/form";
import { useLogin } from "@/hooks/use-auth";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { getErrorMessage } from "@/services/api/errors";

export function LoginForm() {
  const router = useRouter(); const login = useLogin(); const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const submit = handleSubmit(async (values) => { try { await login.mutateAsync(values); toast.success("Đăng nhập thành công"); router.replace("/dashboard"); } catch (error) { toast.error(getErrorMessage(error)); } });
  return <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
    <div><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3.5 top-3.5 size-4 text-slate-400" /><Input id="email" autoComplete="email" placeholder="admin@example.com" className="pl-10" {...register("email")} /></div><FieldError>{errors.email?.message}</FieldError></div>
    <div><div className="flex items-center justify-between"><Label htmlFor="password">Mật khẩu</Label><span className="mb-1.5 text-xs text-slate-400">Tối thiểu 8 ký tự</span></div><div className="relative"><LockKeyhole className="absolute left-3.5 top-3.5 size-4 text-slate-400" /><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" className="px-10" {...register("password")} /><button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div><FieldError>{errors.password?.message}</FieldError></div>
    <Button type="submit" size="lg" className="w-full" loading={login.isPending}>Đăng nhập</Button>
  </form>;
}
