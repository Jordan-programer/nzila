'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const tripId = searchParams.get('trip');

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session?.user) {
          const user = data.session.user;

          let loggedUser;
          try {
            const response = await fetch('/api/auth/social-login/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name || 'Cliente Social',
                phone: '',
                avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
              }),
            });

            if (response.ok) {
              const backendData = await response.json();

              if (!backendData.user.phone) {
                const queryParams = new URLSearchParams({
                  email: user.email || '',
                  name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                  avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
                  ...(tripId ? { trip: tripId } : {}),
                }).toString();

                toast.info('Por favor, informe o seu número de telefone para concluir o registo.');
                router.push(`/auth/complete-profile?${queryParams}`);
                return;
              }

              loggedUser = {
                email: backendData.user.email,
                name: backendData.user.name,
                phone: backendData.user.phone,
                document: backendData.user.document || '005432168LA045',
                avatar:
                  backendData.user.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                role: backendData.user.role.toLowerCase(),
                isAdmin: backendData.user.role === 'ADMIN',
                company_id: backendData.user.company_id,
                company_code: backendData.user.company_code,
                company_status: backendData.user.company_status,
                token: backendData.token,
              };
            } else {
              console.warn('Chamada de login social falhou no backend. A usar simulação local.');
            }
          } catch (backendErr) {
            console.warn('Backend indisponível. A usar simulação local:', backendErr);
          }

          if (!loggedUser) {
            const socialPhone = user.user_metadata?.phone;
            if (!socialPhone) {
              const queryParams = new URLSearchParams({
                email: user.email || '',
                name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
                ...(tripId ? { trip: tripId } : {}),
              }).toString();

              toast.info('Por favor, informe o seu número de telefone para concluir o registo.');
              router.push(`/auth/complete-profile?${queryParams}`);
              return;
            }

            loggedUser = {
              email: user.email || '',
              name: user.user_metadata?.full_name || user.user_metadata?.name || 'Cliente Social',
              phone: socialPhone,
              document: '005432168LA045',
              avatar:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              role: 'cliente',
            };
          }

          localStorage.setItem('nzila_current_user', JSON.stringify(loggedUser));
          window.dispatchEvent(new Event('storage'));

          toast.success(`Bem-vindo, ${loggedUser.name}! Autenticado com sucesso.`);

          if (tripId) {
            router.push(`/payment?trip=${tripId}`);
          } else {
            router.push('/');
          }
        } else {
          router.push('/sign-up-login-screen');
        }
      } catch (err: any) {
        console.error('Erro na autenticação social:', err);
        toast.error(`Falha ao iniciar sessão social: ${err.message || err}`);
        router.push('/sign-up-login-screen');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground font-sans">
      <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
      <h2 className="text-sm font-bold tracking-wide uppercase">A confirmar autenticação...</h2>
      <p className="text-xs text-muted-foreground mt-1">Isso levará apenas alguns segundos.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground font-sans">
          <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
          <h2 className="text-sm font-bold tracking-wide uppercase">A confirmar autenticação...</h2>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
