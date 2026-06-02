'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, User, LogIn } from 'lucide-react';

const navLinks = [
  { label: 'Início', href: '/', key: 'nav-home' },
  { label: 'Comprar Bilhete', href: '/results-page', key: 'nav-search' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ name: string; email?: string; role?: string } | null>(null);

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

    checkUser();
    window.addEventListener('storage', checkUser);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nzila_current_user');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/';
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-card border-b border-border transition-all duration-300 ${scrolled ? 'shadow-md py-1' : 'shadow-sm py-2'}`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <AppLogo size={38} />
            <span className="font-black text-2xl tracking-wider text-foreground">NZILA</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:text-primary hover:bg-primary/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Dynamic perspective links based on role */}
            {user?.role === 'admin' && (
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

            {user?.role === 'fiscal' && (
              <>
                <span className="h-4 w-px bg-border mx-2" />
                <Link
                  href="/validation"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150 ${
                    pathname === '/validation' ? 'text-primary bg-primary/5' : ''
                  }`}
                >
                  Fiscal (Web)
                </Link>
                <Link
                  href="/mobile-validation"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150 ${
                    pathname === '/mobile-validation' ? 'text-primary bg-primary/5' : ''
                  }`}
                >
                  Fiscal (Telemóvel)
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/client"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    pathname.startsWith('/client')
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors duration-150"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
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

          {user?.role === 'admin' && (
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

          {user?.role === 'fiscal' && (
            <div className="pt-2 border-t border-border flex flex-col gap-1.5">
              <Link
                href="/validation"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase text-muted-foreground hover:text-primary hover:bg-primary/5"
              >
                Fiscalização (Web)
              </Link>
              <Link
                href="/mobile-validation"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase text-muted-foreground hover:text-primary hover:bg-primary/5"
              >
                Fiscalização (Mobile)
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-border">
            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/client"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary"
                >
                  <User size={16} />
                  <span>Área do Cliente: {user.name}</span>
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
