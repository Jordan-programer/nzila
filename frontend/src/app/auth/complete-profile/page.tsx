'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Phone, User, Mail, ShieldAlert, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const nameParam = searchParams.get('name') || '';
  const avatarParam = searchParams.get('avatar') || '';
  const tripParam = searchParams.get('trip') || '';
  const redirectParam = tripParam ? `/payment?trip=${tripParam}` : (searchParams.get('redirect') || '/');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!emailParam) {
      toast.error('Sessão inválida. Por favor, tente autenticar novamente.');
      router.push('/sign-up-login-screen');
      return;
    }
    setEmail(emailParam);
    setFullName(nameParam);
  }, [emailParam, nameParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.trim().length < 9) {
      toast.error('Por favor, introduza um número de telefone válido (mínimo 9 dígitos).');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/social-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: fullName,
          phone,
          document: document || '005432168LA045',
          avatar: avatarParam,
        }),
      });

      if (response.ok) {
        const backendData = await response.json();
        const loggedUser = {
          email: backendData.user.email,
          name: backendData.user.name,
          phone: backendData.user.phone || phone,
          document: backendData.user.document || document || '005432168LA045',
          avatar:
            backendData.user.avatar ||
            avatarParam ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          role: backendData.user.role.toLowerCase(),
          isAdmin: backendData.user.role === 'ADMIN',
          company_id: backendData.user.company_id,
          company_code: backendData.user.company_code,
          company_status: backendData.user.company_status,
          token: backendData.token,
        };

        localStorage.setItem('nzila_current_user', JSON.stringify(loggedUser));
        window.dispatchEvent(new Event('storage'));

        toast.success(`Bem-vindo ao Nzila, ${loggedUser.name}! Registo concluído.`);
        router.push(redirectParam);
      } else {
        let errorMsg = 'Falha ao concluir o registo do seu perfil.';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
          }
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Erro ao sincronizar com backend:', err);
      toast.error('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Decorative header gradient */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-accent" />

      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3">
          <Phone className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Conclua o seu Perfil</h2>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Falta apenas o seu número de contacto para poder reservar bilhetes no Nzila.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email (Read-Only) */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Email de Autenticação
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              disabled
              value={email}
              className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-muted text-muted-foreground border-input cursor-not-allowed opacity-80 focus:outline-none"
            />
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Nome Completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Fátima Manuel"
              className="w-full pl-9 pr-4 py-2.5 border border-input rounded-xl text-sm bg-background hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-150 focus:outline-none"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Número de Telefone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+244 923 456 789"
              className="w-full pl-9 pr-4 py-2.5 border border-input rounded-xl text-sm bg-background hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-150 focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 px-1">
            Recomendado: utilize o indicativo nacional (ex: +244 9XX XXX XXX)
          </p>
        </div>

        {/* Document (BI/Passport) */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Documento de Identificação (BI / Passaporte)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="005432168LA045"
              className="w-full pl-9 pr-4 py-2.5 border border-input rounded-xl text-sm bg-background hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-150 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-accent active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />A guardar perfil...
            </>
          ) : (
            'Concluir Registo'
          )}
        </button>
      </form>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-10 pt-24">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center min-h-[350px]">
              <Loader2 className="animate-spin text-primary w-10 h-10" />
            </div>
          }
        >
          <CompleteProfileForm />
        </Suspense>
      </main>
    </div>
  );
}
