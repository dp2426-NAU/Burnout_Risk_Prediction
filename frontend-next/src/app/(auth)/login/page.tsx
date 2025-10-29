"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);

    if (result?.error) {
      toast.error(result.error || 'Invalid credentials');
      return;
    }

    router.push(callbackUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white/10 p-8 backdrop-blur shadow-2xl border border-white/10">
        <div className="space-y-2 text-center text-white">
          <h1 className="text-2xl font-semibold">Burnout Risk Prediction</h1>
          <p className="text-sm text-white/70">
            Sign in with your work account to access your burnout analytics.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              disabled={loading}
              {...form.register('email')}
              className={cn('bg-white/5 text-white placeholder:text-white/40 border-white/10')}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-200">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/90">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              disabled={loading}
              {...form.register('password')}
              className={cn('bg-white/5 text-white placeholder:text-white/40 border-white/10')}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-red-200">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
