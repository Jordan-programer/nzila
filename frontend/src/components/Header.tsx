'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, User, LogIn, Bell, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const navLinks = [
  { label: 'Início', href: '/', key: 'nav-home' },
  { label: 'Comprar Bilhete', href: '/results-page', key: 'nav-search' },
  { label: 'Sobre Nós', href: '/sobre-nos', key: 'nav-about' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ name: string; email?: string; role?: string } | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const getDashboardLink = (): string => {
    if (!user) return '/';
    const role = user.role?.toLowerCase();
    if (role === 'admin') return '/admin';
    if (role === 'operador' || role === 'operator') return '/operator';
    if (role === 'fiscal') return '/validation';
    return '/client';
  };

  // Returns the link target if this notification is a carrier-registration notification for admin
  const getNotifLink = (n: any): string | null => {
    if (!user) return null;
    const role = user.role?.toLowerCase();
    
    // Admin checks
    if (role === 'admin') {
      const text = ((n.subject || '') + ' ' + (n.snippet || '')).toLowerCase();
      if (
        text.includes('transportadora') ||
        text.includes('candidatura') ||
        text.includes('carrier') ||
        text.includes('nova empresa')
      ) {
        return '/admin?tab=empresas';
      }
      return '/admin';
    }
    
    // Operator checks
    if (role === 'operador' || role === 'operator') {
      return '/operator';
    }
    
    // Fiscal checks
    if (role === 'fiscal') {
      return '/validation';
    }
    
    // Client checks (default)
    return '/client';
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const checkUser = () => {
      const stored = localStorage.getItem('nzila_current_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    };

    const fetchNotifs = async () => {
      const storedUser = localStorage.getItem('nzila_current_user');
      let userEmail = '';
      if (storedUser) {
        try {
          userEmail = JSON.parse(storedUser).email || '';
        } catch (e) {
          console.error(e);
        }
      }

      if (userEmail) {
        try {
          const res = await fetch(
            `/api/notifications/?email=${encodeURIComponent(userEmail)}`
          );
          if (res.ok) {
            const data = await res.json();
            const backendNotifs = data.map((item: any) => ({
              id: `db-${item.id}`,
              recipient: userEmail,
              subject:
                item.tipo === 'CONFIRMACAO'
                  ? 'Nzila: Confirmação / Registo'
                  : item.tipo === 'LEMBRETE'
                    ? 'Nzila: Lembrete'
                    : 'Nzila: Alerta / Cancelamento',
              snippet: item.mensagem,
              sentAt: item.created_at,
              lida: item.lida,
            }));
            setNotifications(backendNotifs);
            return;
          }
        } catch (error) {
          console.warn('Backend notifications endpoint unreachable:', error);
        }
      }

      setNotifications([]);
    };

    checkUser();
    fetchNotifs();
    window.addEventListener('storage', checkUser);
    window.addEventListener('storage', fetchNotifs);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('storage', fetchNotifs);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nzila_current_user');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/';
  };

  const userNotifs = notifications.filter(
    (n) => n.recipient?.toLowerCase() === user?.email?.toLowerCase()
  );

  const unreadNotifsCount = userNotifs.filter((n) => !n.lida).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read/`, {
        method: 'POST',
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
        toast.success('Todas as notificações foram marcadas como lidas.');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (n: any, link: string | null) => {
    if (!n.lida) {
      await handleMarkAsRead(n.id);
    }
    setIsNotifOpen(false);
    if (link) {
      router.push(link);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-card border-b border-border transition-all duration-300 ${scrolled ? 'shadow-md py-1' : 'shadow-sm py-2'}`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center h-16 lg:h-20 xl:h-22">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 mr-auto lg:mr-8 xl:mr-12">
            <AppLogo size={38} />
            <span className="font-black text-2xl lg:text-3xl xl:text-4xl tracking-wider text-foreground">NZILA</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`px-3 xl:px-4 py-2 rounded-lg text-sm xl:text-base font-medium transition-colors duration-150 ${
                  pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:text-primary hover:bg-primary/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Dynamic perspective links based on role */}
            {user?.role?.toLowerCase() === 'admin' && (
              <>
                <span className="h-4 w-px bg-border mx-2" />
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150 ${
                    pathname.startsWith('/admin') ? 'text-primary bg-primary/5' : ''
                  }`}
                >
                  Painel Admin
                </Link>
              </>
            )}

            {(user?.role?.toLowerCase() === 'operador' ||
              user?.role?.toLowerCase() === 'operator') && (
              <>
                <span className="h-4 w-px bg-border mx-2" />
                <Link
                  href="/operator"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150 ${
                    pathname.startsWith('/operator') ? 'text-primary bg-primary/5' : ''
                  }`}
                >
                  Painel Operador
                </Link>
              </>
            )}

            {user?.role?.toLowerCase() === 'fiscal' && (
              <>
                <span className="h-4 w-px bg-border mx-2" />
                <Link
                  href="/validation"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150 ${
                    pathname === '/validation' ? 'text-primary bg-primary/5' : ''
                  }`}
                >
                  Fiscalização
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 ml-auto">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Desktop Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors relative"
                    title="Notificações"
                  >
                    <Bell size={18} />
                    {unreadNotifsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 space-y-3 text-xs animate-bounce-in font-sans">
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="font-bold text-foreground">Notificações Nzila</span>
                        <div className="flex items-center gap-2">
                          {unreadNotifsCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-[10px] text-primary font-semibold hover:underline"
                            >
                              Marcar todas lidas
                            </button>
                          )}
                          <button
                            onClick={() => setIsNotifOpen(false)}
                            className="text-muted-foreground hover:text-foreground p-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      {userNotifs.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Sem novas notificações.
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {userNotifs.map((n) => {
                            const link = getNotifLink(n);
                            const isClickable = !!link;
                            return (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => handleNotificationClick(n, link)}
                                className={`w-full p-2.5 rounded-xl space-y-1 transition-all border text-left cursor-pointer flex flex-col relative ${
                                  !n.lida
                                    ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                    : 'bg-card border-border hover:bg-muted/30'
                                }`}
                              >
                                <div className="flex justify-between items-start w-full">
                                  <span className="font-bold text-foreground text-[11px] pr-2">
                                    {n.subject}
                                  </span>
                                  {!n.lida && (
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-muted-foreground text-[10px] leading-relaxed">
                                  {n.snippet}
                                </p>
                                {isClickable && (
                                  <span className="flex items-center gap-0.5 text-[9px] text-primary font-bold mt-0.5">
                                    {link.includes('tab=empresas')
                                      ? 'Ver transportadoras pendentes'
                                      : 'Ir para o painel'}
                                    <ArrowRight size={9} />
                                  </span>
                                )}
                                <span className="block text-[8px] text-muted-foreground/60 text-right w-full mt-1">
                                  {new Date(n.sentAt).toLocaleTimeString('pt-AO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  href={getDashboardLink()}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    pathname.startsWith(getDashboardLink())
                      ? 'bg-primary/15 text-primary'
                      : 'text-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <User size={16} />
                  <span>Olá, {user.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 border border-danger/30 text-danger hover:bg-danger/5 hover:border-danger/60 rounded-lg text-sm font-medium transition-all duration-150"
                >
                  Sair
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-up-login-screen"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150"
                >
                  <LogIn size={16} />
                  Entrar
                </Link>
                <Link
                  href="/sign-up-login-screen"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-accent active:scale-95 transition-all duration-150 shadow-sm"
                >
                  <User size={16} />
                  Criar Conta
                </Link>
              </>
            )}
          </div>

          {/* Mobile actions & Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors relative"
                  title="Notificações"
                >
                  <Bell size={18} />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-[-40px] mt-2 w-72 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 space-y-3 text-xs animate-bounce-in font-sans">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="font-bold text-foreground">Notificações Nzila</span>
                      <div className="flex items-center gap-2">
                        {unreadNotifsCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[9px] text-primary font-semibold hover:underline"
                          >
                            Marcar todas lidas
                          </button>
                        )}
                        <button
                          onClick={() => setIsNotifOpen(false)}
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    {userNotifs.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Sem novas notificações.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto space-y-2">
                        {userNotifs.map((n) => {
                          const link = getNotifLink(n);
                          const isClickable = !!link;
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => handleNotificationClick(n, link)}
                              className={`w-full p-2.5 rounded-xl space-y-1 transition-all border text-left cursor-pointer flex flex-col relative ${
                                !n.lida
                                  ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                  : 'bg-card border-border hover:bg-muted/30'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="font-bold text-foreground text-[10px] pr-2">
                                  {n.subject}
                                </span>
                                {!n.lida && (
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-muted-foreground text-[9px] leading-relaxed">
                                {n.snippet}
                              </p>
                              {isClickable && (
                                <span className="flex items-center gap-0.5 text-[8px] text-primary font-bold mt-0.5">
                                  {link.includes('tab=empresas')
                                    ? 'Ver transportadoras pendentes'
                                    : 'Ir para o painel'}
                                  <ArrowRight size={8} />
                                </span>
                              )}
                              <span className="block text-[8px] text-muted-foreground/60 text-right w-full mt-1">
                                {new Date(n.sentAt).toLocaleTimeString('pt-AO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors duration-150"
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        } bg-card border-b border-border shadow-lg`}
      >
        <div className="px-4 py-4 space-y-1.5">
          {navLinks.map((link) => (
            <Link
              key={`mobile-${link.key}`}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                pathname === link.href
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user?.role?.toLowerCase() === 'admin' && (
            <div className="pt-2 border-t border-border flex flex-col gap-1.5">
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase text-muted-foreground hover:text-primary hover:bg-primary/5"
              >
                Painel Admin
              </Link>
            </div>
          )}

          {(user?.role?.toLowerCase() === 'operador' ||
            user?.role?.toLowerCase() === 'operator') && (
            <div className="pt-2 border-t border-border flex flex-col gap-1.5">
              <Link
                href="/operator"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase text-muted-foreground hover:text-primary hover:bg-primary/5"
              >
                Painel Operador
              </Link>
            </div>
          )}

          {user?.role?.toLowerCase() === 'fiscal' && (
            <div className="pt-2 border-t border-border flex flex-col gap-1.5">
              <Link
                href="/validation"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase text-muted-foreground hover:text-primary hover:bg-primary/5"
              >
                Fiscalização
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-border">
            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href={getDashboardLink()}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary"
                >
                  <User size={16} />
                  <span>Olá, {user.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border border-danger/30 text-danger"
                >
                  Terminar Sessão
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/sign-up-login-screen"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted"
                >
                  <LogIn size={16} />
                  Entrar
                </Link>
                <Link
                  href="/sign-up-login-screen"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground"
                >
                  <User size={16} />
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
