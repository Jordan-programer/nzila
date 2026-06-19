import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { MapPin, Phone, Mail, Share2, Camera, MessageCircle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';

const footerLinks = {
  empresa: [
    { label: 'Sobre Nós', href: '/sobre-nos', key: 'footer-sobre' },
    { label: 'Como Funciona', href: '#como-funciona', key: 'footer-como' },
    { label: 'Parceiros', href: '#', key: 'footer-parceiros' },
    { label: 'Carreiras', href: '#', key: 'footer-carreiras' },
  ],
  suporte: [
    { label: 'Central de Ajuda', href: '#ajuda', key: 'footer-ajuda' },
    { label: 'Política de Cancelamento', href: '#', key: 'footer-cancelamento' },
    { label: 'Termos de Uso', href: '#', key: 'footer-termos' },
    { label: 'Privacidade', href: '#', key: 'footer-privacidade' },
  ],
  destinos: [
    { label: 'Luanda → Huambo', href: '/results-page', key: 'footer-lda-hbo' },
    { label: 'Luanda → Benguela', href: '/results-page', key: 'footer-lda-bge' },
    { label: 'Luanda → Namibe', href: '/results-page', key: 'footer-lda-nam' },
    { label: 'Huambo → Lubango', href: '/results-page', key: 'footer-hbo-lbo' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#0a0f1e] text-white" style={{ marginTop: '2rem' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="xl:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2.5 mb-4">
              <AppLogo size={38} />
              <span className="font-black text-2xl tracking-wider text-white">NZILA</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-xs">
              A forma mais fácil e segura de reservar bilhetes de autocarro entre províncias de
              Angola.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <MapPin size={14} />
                <span>Rua Rainha Ginga, Luanda, Angola</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Phone size={14} />
                <span>+244 923 456 789</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Mail size={14} />
                <span>suporte@nzila.ao</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              {[
                { Icon: Share2, key: 'social-fb', label: 'Facebook' },
                { Icon: Camera, key: 'social-ig', label: 'Instagram' },
                { Icon: MessageCircle, key: 'social-tw', label: 'Twitter' },
              ]?.map(({ Icon: SocialIcon, key, label }) => (
                <button
                  key={key}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors duration-150"
                >
                  <SocialIcon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Empresa
            </h4>
            <ul className="space-y-2.5">
              {footerLinks?.empresa?.map((link) => (
                <li key={link?.key}>
                  <Link
                    href={link?.href}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-150"
                  >
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Suporte
            </h4>
            <ul className="space-y-2.5">
              {footerLinks?.suporte?.map((link) => (
                <li key={link?.key}>
                  <Link
                    href={link?.href}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-150"
                  >
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Destinos Populares
            </h4>
            <ul className="space-y-2.5">
              {footerLinks?.destinos?.map((link) => (
                <li key={link?.key}>
                  <Link
                    href={link?.href}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-150"
                  >
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col items-center sm:flex-row sm:justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-white/40">© 2026 NZILA. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <Link href="#" className="hover:text-white/70 transition-colors">
              Termos
            </Link>
            <Link href="#" className="hover:text-white/70 transition-colors">
              Privacidade
            </Link>
            <Link href="#" className="hover:text-white/70 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
