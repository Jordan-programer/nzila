'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import AppLogo from '@/components/ui/AppLogo';
import Link from 'next/link';

type Tab = 'login' | 'register';

export default function AuthCard() {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [isCarrier, setIsCarrier] = useState(false);

  return (
    <div
      className={`w-full transition-all duration-300 ${activeTab === 'register' && isCarrier ? 'max-w-2xl' : 'max-w-md'}`}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <AppLogo size={42} />
          <span className="font-black text-2xl tracking-wider text-primary">NZILA</span>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {activeTab === 'login'
            ? 'Bem-vindo de volta! Entre na sua conta.'
            : 'Crie a sua conta e comece a reservar.'}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-modal overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { value: 'login' as Tab, label: 'Entrar', key: 'tab-login' },
            { value: 'register' as Tab, label: 'Criar Conta', key: 'tab-register' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 py-4 text-sm font-semibold transition-all duration-150 border-b-2 ${
                activeTab === tab.value
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="p-6 lg:p-7">
          {activeTab === 'login' ? (
            <LoginForm onSwitchToRegister={() => setActiveTab('register')} />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setActiveTab('login')}
              onRegisterTypeChange={(type) => setIsCarrier(type === 'transportadora')}
            />
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5">
        Ao continuar, aceita os{' '}
        <Link href="#" className="text-primary hover:underline">
          Termos de Uso
        </Link>{' '}
        e a{' '}
        <Link href="#" className="text-primary hover:underline">
          Política de Privacidade
        </Link>{' '}
        do Nzila.
      </p>
    </div>
  );
}
