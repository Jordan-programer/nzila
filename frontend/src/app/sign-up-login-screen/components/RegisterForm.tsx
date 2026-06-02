'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { score: 1, label: 'Fraca', color: 'password-strength-weak' },
    { score: 2, label: 'Razoável', color: 'password-strength-fair' },
    { score: 3, label: 'Boa', color: 'password-strength-good' },
    { score: 4, label: 'Forte', color: 'password-strength-strong' },
  ];
  return levels[Math.max(0, score - 1)] || levels[0];
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const watchedPassword = watch('password', '');
  const strength = getPasswordStrength(watchedPassword);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    // Backend integration point: POST /api/auth/register
    await new Promise((resolve) => setTimeout(resolve, 1600));
    setIsLoading(false);

    // Save to our mock session
    const newUser = {
      email: data.email,
      name: data.fullName,
      phone: '+244 ' + data.phone,
      document: '005432168LA045',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      isAdmin: false,
    };
    localStorage.setItem('nzila_current_user', JSON.stringify(newUser));

    toast.success('Conta criada com sucesso!', {
      description: `Bem-vindo ao Nzila, ${data.fullName.split(' ')[0]}!`,
    });

    const tripId = searchParams.get('trip');
    if (tripId) {
      router.push(`/payment?trip=${tripId}`);
    } else {
      router.push('/client');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Social Auth */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="social-btn">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>
        <button type="button" className="social-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Facebook</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">ou com email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="reg-name" className="block text-sm font-semibold text-foreground mb-1.5">
          Nome completo
        </label>
        <div className="relative">
          <User
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="Ex: Fátima Manuel Teixeira"
            {...register('fullName', {
              required: 'O nome é obrigatório',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' },
            })}
            className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm bg-background transition-all duration-150 focus:outline-none ${
              errors.fullName
                ? 'border-danger'
                : 'border-input hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15'
            }`}
          />
        </div>
        {errors.fullName && (
          <p className="mt-1.5 text-xs text-danger">⚠ {errors.fullName.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="reg-email" className="block text-sm font-semibold text-foreground mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="seuemail@exemplo.com"
            {...register('email', {
              required: 'O email é obrigatório',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
            })}
            className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm bg-background transition-all duration-150 focus:outline-none ${
              errors.email
                ? 'border-danger'
                : 'border-input hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15'
            }`}
          />
        </div>
        {errors.email && <p className="mt-1.5 text-xs text-danger">⚠ {errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="reg-phone" className="block text-sm font-semibold text-foreground mb-1.5">
          Telefone
        </label>
        <p className="text-xs text-muted-foreground mb-1.5">Número angolano (+244)</p>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <Phone size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">+244</span>
          </div>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            placeholder="9XX XXX XXX"
            {...register('phone', {
              required: 'O telefone é obrigatório',
              pattern: {
                value: /^9[0-9]{8}$/,
                message: 'Número angolano inválido (ex: 923456789)',
              },
            })}
            className={`w-full pl-20 pr-4 py-3 border rounded-xl text-sm bg-background transition-all duration-150 focus:outline-none ${
              errors.phone
                ? 'border-danger'
                : 'border-input hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15'
            }`}
          />
        </div>
        {errors.phone && <p className="mt-1.5 text-xs text-danger">⚠ {errors.phone.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="reg-password"
          className="block text-sm font-semibold text-foreground mb-1.5"
        >
          Palavra-passe
        </label>
        <p className="text-xs text-muted-foreground mb-1.5">
          Mínimo 8 caracteres com letras maiúsculas, números e símbolos
        </p>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('password', {
              required: 'A palavra-passe é obrigatória',
              minLength: { value: 8, message: 'Mínimo 8 caracteres' },
            })}
            className={`w-full pl-9 pr-11 py-3 border rounded-xl text-sm bg-background transition-all duration-150 focus:outline-none ${
              errors.password
                ? 'border-danger'
                : 'border-input hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-danger">⚠ {errors.password.message}</p>
        )}

        {/* Password strength indicator */}
        {watchedPassword && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={`strength-bar-${level}`}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    strength.score >= level ? strength.color : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            {strength.label && (
              <p
                className={`text-xs font-medium ${
                  strength.score === 1
                    ? 'text-danger'
                    : strength.score === 2
                      ? 'text-warning'
                      : strength.score === 3
                        ? 'text-success'
                        : 'text-primary'
                }`}
              >
                Força da palavra-passe: {strength.label}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="reg-confirm" className="block text-sm font-semibold text-foreground mb-1.5">
          Confirmar palavra-passe
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="reg-confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('confirmPassword', {
              required: 'Confirme a palavra-passe',
              validate: (value) => value === watchedPassword || 'As palavras-passe não coincidem',
            })}
            className={`w-full pl-9 pr-11 py-3 border rounded-xl text-sm bg-background transition-all duration-150 focus:outline-none ${
              errors.confirmPassword
                ? 'border-danger'
                : 'border-input hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1.5 text-xs text-danger">⚠ {errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-accent active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />A criar conta...
          </>
        ) : (
          'Criar conta gratis'
        )}
      </button>

      {/* Switch to login */}
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary font-semibold hover:text-accent transition-colors"
        >
          Entrar agora
        </button>
      </p>
    </form>
  );
}
