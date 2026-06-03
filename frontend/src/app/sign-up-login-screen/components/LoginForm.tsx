'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Mail, Lock, ClipboardCopy, Check } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

// Mock credentials for demo
const DEMO_ACCOUNTS = [
  {
    email: 'fatima.manuel@transbook.ao',
    name: 'Fátima Manuel (Cliente)',
    role: 'cliente',
    icon: '👤',
  },
  { email: 'admin@transbook.ao', name: 'Carlos Admin (Administrador)', role: 'admin', icon: '🔑' },
  {
    email: 'fiscal@transbook.ao',
    name: 'João Fiscal (Fiscal de Embarque)',
    role: 'fiscal',
    icon: '🛡️',
  },
  {
    email: 'macon.operator@transbook.ao',
    name: 'Macon Operador (Operador Macon)',
    role: 'operador',
    icon: '🚌',
  },
];
const DEMO_PASSWORD = 'Luanda@2026';

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    defaultValues: { rememberMe: false },
  });

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const fillCredentials = (email: string) => {
    setValue('email', email);
    setValue('password', DEMO_PASSWORD);
    toast.info('Dados de demonstração preenchidos!');
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    // 1. Try backend authentication first
    try {
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (res.ok) {
        const backendData = await res.json();
        setIsLoading(false);

        const loggedUser = {
          email: backendData.user.email,
          name: backendData.user.name,
          phone: backendData.user.phone,
          document: backendData.user.document,
          avatar:
            backendData.user.role === 'ADMIN'
              ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
              : backendData.user.role === 'OPERADOR'
                ? 'https://images.unsplash.com/photo-1557683316-973673baf926?w=150&auto=format&fit=crop&q=60'
                : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          isAdmin: backendData.user.role === 'ADMIN',
          role: backendData.user.role,
          company_id: backendData.user.company_id,
          company_code: backendData.user.company_code,
          company_status: backendData.user.company_status,
        };
        localStorage.setItem('nzila_current_user', JSON.stringify(loggedUser));
        window.dispatchEvent(new Event('storage'));

        toast.success('Autenticação realizada com sucesso!', {
          description: `Bem-vindo, ${loggedUser.name}!`,
        });

        redirectUser(loggedUser.role);
        return;
      }
    } catch (error) {
      console.warn('Backend login unavailable, falling back to local auth:', error);
    }

    // 2. Offline / Local fallback authentication
    const selectedAccount = DEMO_ACCOUNTS.find((acc) => acc.email === data.email);

    let localCarrierUser: any = null;
    const storedCarriers = localStorage.getItem('nzila_carriers');
    if (storedCarriers) {
      try {
        const carriersList = JSON.parse(storedCarriers);
        for (const carrier of carriersList) {
          const admin = carrier.admins?.find((a: any) => a.email === data.email);
          if (admin) {
            localCarrierUser = {
              email: admin.email,
              name: admin.nome,
              phone: admin.telefone,
              document: admin.documento_identificacao || '002345678LA099',
              avatar:
                'https://images.unsplash.com/photo-1557683316-973673baf926?w=150&auto=format&fit=crop&q=60',
              isAdmin: false,
              role: 'OPERADOR',
              company_id: carrier.id,
              company_code: carrier.nome.substring(0, 5).toUpperCase(),
              company_status: carrier.status,
            };
            break;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!selectedAccount && !localCarrierUser) {
      setIsLoading(false);
      setError('email', {
        message: 'Credenciais inválidas — registe-se primeiro ou use as contas demo.',
      });
      return;
    }

    if (data.password !== DEMO_PASSWORD && (!localCarrierUser || data.password === '')) {
      setIsLoading(false);
      setError('password', {
        message: 'Palavra-passe incorreta para demonstração.',
      });
      return;
    }

    setIsLoading(false);

    let loggedUser: any;
    if (localCarrierUser) {
      loggedUser = localCarrierUser;
    } else if (selectedAccount) {
      loggedUser = {
        email: selectedAccount.email,
        name: selectedAccount.name.split(' (')[0],
        phone:
          selectedAccount.role === 'admin'
            ? '+244 912 999 888'
            : selectedAccount.role === 'fiscal'
              ? '+244 933 222 111'
              : selectedAccount.role === 'operador'
                ? '+244 923 101 010'
                : '+244 923 456 789',
        document:
          selectedAccount.role === 'admin'
            ? '008765432LA099'
            : selectedAccount.role === 'fiscal'
              ? '009876543LA077'
              : selectedAccount.role === 'operador'
                ? '002345678LA099'
                : '005432168LA045',
        avatar:
          selectedAccount.role === 'admin'
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
            : selectedAccount.role === 'fiscal'
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
              : selectedAccount.role === 'operador'
                ? 'https://images.unsplash.com/photo-1557683316-973673baf926?w=150&auto=format&fit=crop&q=60'
                : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isAdmin: selectedAccount.role === 'admin',
        role: selectedAccount.role === 'operador' ? 'OPERADOR' : selectedAccount.role,
        company_id: selectedAccount.role === 'operador' ? 1 : undefined,
        company_code: selectedAccount.role === 'operador' ? 'MACON' : undefined,
        company_status: selectedAccount.role === 'operador' ? 'APROVADA' : undefined,
      };
    } else {
      setIsLoading(false);
      return;
    }

    localStorage.setItem('nzila_current_user', JSON.stringify(loggedUser));
    window.dispatchEvent(new Event('storage'));

    toast.success('Autenticação realizada com sucesso!', {
      description: `Bem-vindo, ${loggedUser.name}!`,
    });

    redirectUser(loggedUser.role);
  };

  const redirectUser = (role: string) => {
    const tripId = searchParams.get('trip');
    if (tripId) {
      router.push(`/payment?trip=${tripId}`);
    } else if (role === 'admin' || role === 'ADMIN') {
      router.push('/admin');
    } else if (role === 'fiscal' || role === 'FISCAL') {
      router.push('/validation');
    } else if (role === 'operador' || role === 'OPERADOR') {
      router.push('/operator');
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

      {/* Email */}
      <div>
        <label htmlFor="login-email" className="block text-sm font-semibold text-foreground mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="seuemail@exemplo.com"
            {...register('email', {
              required: 'O email é obrigatório',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
            })}
            className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm bg-background transition-all duration-150 focus:outline-none ${
              errors.email
                ? 'border-danger focus:border-danger'
                : 'border-input hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15'
            }`}
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-danger flex items-start gap-1">
            <span className="mt-0.5 flex-shrink-0">⚠</span>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password" className="block text-sm font-semibold text-foreground">
            Palavra-passe
          </label>
          <Link
            href="#"
            className="text-xs text-primary hover:text-accent transition-colors font-medium"
          >
            Esqueceu a palavra-passe?
          </Link>
        </div>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password', {
              required: 'A palavra-passe é obrigatória',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
            className={`w-full pl-9 pr-11 py-3 border rounded-xl text-sm bg-background transition-all duration-150 focus:outline-none ${
              errors.password
                ? 'border-danger focus:border-danger'
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
          <p className="mt-1.5 text-xs text-danger flex items-start gap-1">
            <span className="mt-0.5 flex-shrink-0">⚠</span>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2">
        <input
          id="remember-me"
          type="checkbox"
          {...register('rememberMe')}
          className="w-4 h-4 accent-primary rounded border-input cursor-pointer"
        />
        <label
          htmlFor="remember-me"
          className="text-sm text-muted-foreground cursor-pointer select-none"
        >
          Manter sessão iniciada
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-accent active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />A autenticar...
          </>
        ) : (
          'Entrar na minha conta'
        )}
      </button>

      {/* Switch to register */}
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-primary font-semibold hover:text-accent transition-colors"
        >
          Criar conta gratis
        </button>
      </p>

      {/* Demo Credentials Box */}
      <div className="mt-2 p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">
          Selecione uma conta de demonstração:
        </p>
        <div className="flex flex-col gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => fillCredentials(acc.email)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-card hover:bg-muted border border-border/80 text-left transition-colors active:scale-98"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{acc.icon}</span>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-foreground truncate">
                    {acc.name}
                  </span>
                  <span className="block text-[10px] text-muted-foreground truncate">
                    {acc.email}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-primary underline">Preencher</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
