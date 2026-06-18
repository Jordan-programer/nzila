'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  FileText,
  CheckCircle,
  ShieldCheck,
  MapPin,
  Calendar,
  Layers,
  X,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterTypeChange?: (type: 'cliente' | 'transportadora') => void;
}

const ANGOLAN_PROVINCES: Record<string, string[]> = {
  Bengo: ['Ambriz', 'Bula-Atumba', 'Dande', 'Dembos', 'Nambuangongo', 'Pango-Aluquém', 'Quibaxe'],
  Benguela: [
    'Baía Farta',
    'Balombo',
    'Benguela',
    'Bocoio',
    'Caimbambo',
    'Catumbela',
    'Chongorói',
    'Cubal',
    'Ganda',
    'Lobito',
  ],
  Bié: [
    'Andulo',
    'Camacupa',
    'Catabola',
    'Chinguar',
    'Chitembo',
    'Cuemba',
    'Cuito',
    'Cunhinga',
    'Nharea',
  ],
  Cabinda: ['Belize', 'Buco-Zau', 'Cabinda', 'Cacongo'],
  Cuando: [
    'Cuito Cuanavale',
    'Dima',
    'Dirico',
    'Luengue',
    'Luiana',
    'Mavinga',
    'Mucusso',
    'Rivungo',
    'Xipundo',
  ],
  Cubango: [
    'Calai',
    'Cuangar',
    'Cuchi',
    'Cuito Cuanavale',
    'Mavinga',
    'Menongue',
    'Nancova',
    'Rivungo',
  ],
  'Cuanza Norte': [
    'Ambaca',
    'Banga',
    'Bolongongo',
    'Cambambe',
    'Cazengo',
    'Golungo Alto',
    'Gonguembo',
    'Lucala',
    'Quiculungo',
    'Samba Caju',
  ],
  'Cuanza Sul': [
    'Amboim',
    'Cassongue',
    'Cela',
    'Conda',
    'Ebo',
    'Libolo',
    'Mussende',
    'Porto Amboim',
    'Quibala',
    'Quilenda',
    'Seles',
    'Sumbe',
  ],
  Cunene: ['Cahama', 'Cuanhama', 'Curoca', 'Cuvelai', 'Namacunde', 'Ombadja'],
  Huambo: [
    'Bailundo',
    'Caála',
    'Catchiungo',
    'Ecunha',
    'Huambo',
    'Londuimbali',
    'Longonjo',
    'Mungo',
    'Tchicala-Tcholoanga',
    'Tchindjenje',
    'Ucuma',
  ],
  Huíla: [
    'Caconda',
    'Cacula',
    'Caluquembe',
    'Chiange',
    'Chibia',
    'Chicomba',
    'Chipindo',
    'Cuvango',
    'Humpata',
    'Jamba',
    'Lubango',
    'Matala',
    'Quilengues',
    'Quipungo',
  ],
  'Ícolo e Bengo': [
    'Bom Jesus do Cuanza',
    'Cabiri',
    'Cabo Ledo',
    'Calumbo',
    'Catete',
    'Quissama',
    'Sequele',
  ],
  Luanda: ['Belas', 'Cacuaco', 'Cazenga', 'Kilamba Kiaxi', 'Luanda', 'Talatona', 'Viana'],
  'Lunda Norte': [
    'Cambulo',
    'Capenda-Camulemba',
    'Caungula',
    'Chitato',
    'Cuango',
    'Cuílo',
    'Lóvua',
    'Lubalo',
    'Lucapa',
    'Xá-Muteba',
  ],
  'Lunda Sul': ['Cacolo', 'Dala', 'Muconda', 'Saurimo'],
  Malanje: [
    'Cacuso',
    'Calandula',
    'Cambundi-Catembo',
    'Cangandala',
    'Caombo',
    'Cuaba Nzogo',
    'Cunda-dia-Baze',
    'Luquembo',
    'Malanje',
    'Marimba',
    'Massango',
    'Mucari',
    'Quela',
    'Quirima',
  ],
  Moxico: ['Camanongue', 'Léua', 'Luau', 'Luena', 'Luchazes', 'Lumeje', 'Moxico'],
  'Moxico Leste': [
    'Caianda',
    'Cameia',
    'Cazombo',
    'Lago-Dilolo',
    'Lóvua do Zambeze',
    'Luacano',
    'Luau',
    'Macondo',
    'Nana Candundo',
  ],
  Namibe: ['Bibala', 'Camucuio', 'Moçâmedes', 'Tômbua', 'Virei'],
  Uíge: [
    'Ambuíla',
    'Bembe',
    'Buengas',
    'Bungo',
    'Damba',
    'Milunga',
    'Mucaba',
    'Negage',
    'Puri',
    'Quimbele',
    'Quitexe',
    'Santa Cruz',
    'Sanza Pombo',
    'Songo',
    'Uíge',
    'Zombo',
  ],
  Zaire: ['Cuimba', 'Mbanza Congo', 'Noqui', 'Nzeto', 'Soyo', 'Tomboco'],
};

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { score: 1, label: 'Fraca', color: 'bg-danger' },
    { score: 2, label: 'Razoável', color: 'bg-warning' },
    { score: 3, label: 'Boa', color: 'bg-success' },
    { score: 4, label: 'Forte', color: 'bg-primary' },
  ];
  return levels[Math.max(0, score - 1)] || levels[0];
}

export default function RegisterForm({ onSwitchToLogin, onRegisterTypeChange }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [registerType, setRegisterType] = useState<'cliente' | 'transportadora'>('cliente');

  useEffect(() => {
    onRegisterTypeChange?.(registerType);
  }, [registerType, onRegisterTypeChange]);

  // Passenger state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Passenger OTP verification state
  const [isClientOtpVerification, setIsClientOtpVerification] = useState(false);
  const [clientOtpCode, setClientOtpCode] = useState('');
  const [clientServerOtp, setClientServerOtp] = useState('');
  const [passengerData, setPassengerData] = useState<RegisterFormData | null>(null);
  const [clientOtpCooldown, setClientOtpCooldown] = useState(0);
  const [isResendingClientOtp, setIsResendingClientOtp] = useState(false);
  const clientCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startClientCooldown = () => {
    setClientOtpCooldown(60);
    if (clientCooldownRef.current) clearInterval(clientCooldownRef.current);
    clientCooldownRef.current = setInterval(() => {
      setClientOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(clientCooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const watchedPassword = watch('password', '');
  const strength = getPasswordStrength(watchedPassword);

  const onSubmitPassenger = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-client-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.fullName,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.error || 'Erro ao enviar o código de verificação.');
        setIsLoading(false);
        return;
      }

      setClientServerOtp(resData.otp);
      setPassengerData(data);
      setIsClientOtpVerification(true);
      startClientCooldown();

      toast.success('Código de verificação enviado! Verifique o seu email.');
    } catch (err) {
      toast.error('Erro de ligação ao servidor. Não foi possível enviar o código OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientOtpCode) {
      toast.error('Introduza o código de verificação.');
      return;
    }

    if (clientOtpCode !== clientServerOtp) {
      toast.error('Código de verificação OTP incorreto.');
      return;
    }

    if (!passengerData) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: passengerData.email,
          fullName: passengerData.fullName,
          password: passengerData.password,
          phone: passengerData.phone,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.error || 'Erro ao criar conta.');
        setIsLoading(false);
        return;
      }

      // Save to session
      const loggedUser = {
        email: resData.user.email,
        name: resData.user.name || passengerData.fullName,
        phone: resData.user.phone || '+244 ' + passengerData.phone,
        document: resData.user.document || '005432168LA045',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        role: 'cliente',
        token: resData.token,
      };
      localStorage.setItem('nzila_current_user', JSON.stringify(loggedUser));
      window.dispatchEvent(new Event('storage'));

      toast.success('Conta criada e e-mail verificado com sucesso!', {
        description: `Bem-vindo ao Nzila, ${passengerData.fullName.split(' ')[0]}!`,
      });

      const tripId = searchParams.get('trip');
      if (tripId) {
        router.push(`/payment?trip=${tripId}`);
      } else {
        router.push('/client');
      }
    } catch (err) {
      toast.error('Erro de ligação ao servidor. Não foi possível criar a conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendClientOtp = async () => {
    if (clientOtpCooldown > 0 || isResendingClientOtp) return;
    setIsResendingClientOtp(true);

    try {
      const res = await fetch('/api/auth/send-client-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: passengerData?.email,
          name: passengerData?.fullName,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.error || 'Erro ao reenviar o código.');
      } else {
        setClientServerOtp(resData.otp);
        toast.success('Código de verificação reenviado! Verifique o seu email.');
        startClientCooldown();
      }
    } catch (err) {
      toast.error('Erro de ligação ao servidor.');
    } finally {
      setIsResendingClientOtp(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Facebook') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === 'Google' ? 'google' : 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setIsLoading(false);
      toast.error(`Erro ao ligar ao ${provider}: ${err.message || err}`);
    }
  };

  // ==========================================
  // CARRIER REGISTER MULTI-STEP STATE
  // ==========================================
  const [carrierStep, setCarrierStep] = useState(1);
  const [isSubmittingCarrier, setIsSubmittingCarrier] = useState(false);

  // Step 1: Basic Company Info
  const [compNome, setCompNome] = useState('');
  const [compNif, setCompNif] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compTelefone, setCompTelefone] = useState('');
  const [compTelefoneAlt, setCompTelefoneAlt] = useState('');
  const [compTipo, setCompTipo] = useState('Lda');
  const [compAno, setCompAno] = useState('');
  const [compProvincia, setCompProvincia] = useState('');
  const [compMunicipio, setCompMunicipio] = useState('');
  const [compEndereco, setCompEndereco] = useState('');
  const [compLogo, setCompLogo] = useState('');

  // Step 2: Responsible Contact Person
  const [respNome, setRespNome] = useState('');
  const [respCargo, setRespCargo] = useState('');
  const [respDoc, setRespDoc] = useState('');
  const [respTelefone, setRespTelefone] = useState('');
  const [respEmail, setRespEmail] = useState('');
  const [respPassword, setRespPassword] = useState('');

  // Step 3: Legal Documents
  const [docRegisto, setDocRegisto] = useState('');
  const [docAlvara, setDocAlvara] = useState('');
  const [docContribuinte, setDocContribuinte] = useState('');
  const [docEstatutos, setDocEstatutos] = useState('');

  const [docRegistoName, setDocRegistoName] = useState('');
  const [docAlvaraName, setDocAlvaraName] = useState('');
  const [docContribuinteName, setDocContribuinteName] = useState('');
  const [docEstatutosName, setDocEstatutosName] = useState('');

  const handleDocChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setDocUrl: (url: string) => void,
    setDocName: (name: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O tamanho do ficheiro não deve exceder 5MB.');
        return;
      }
      setDocName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDocUrl(event.target.result as string);
          toast.success(`Ficheiro "${file.name}" carregado com sucesso!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 4: OTP Verification Code
  const [otpCode, setOtpCode] = useState('');
  const [serverOtp, setServerOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start a 60-second cooldown after OTP is sent
  const startCooldown = () => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      if (clientCooldownRef.current) clearInterval(clientCooldownRef.current);
    },
    []
  );

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: respEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao reenviar o código.');
      } else {
        if (data.otp) setServerOtp(data.otp);
        toast.success('Código OTP reenviado! Verifique o seu email.');
        startCooldown();
      }
    } catch {
      toast.error('Erro ao ligar ao servidor. Não foi possível reenviar o código.');
    } finally {
      setIsResending(false);
    }
  };

  const nextStep = () => setCarrierStep((prev) => prev + 1);
  const prevStep = () => setCarrierStep((prev) => prev - 1);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('O tamanho do logótipo não deve exceder 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCompLogo(event.target.result as string);
          toast.success('Logótipo carregado com sucesso!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Step 1
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compNome || !compNif || !compEmail || !compTelefone) {
      toast.error('Preencha os campos obrigatórios da empresa.');
      return;
    }
    nextStep();
  };

  // Submit Step 2
  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respNome || !respCargo || !respEmail || !respPassword) {
      toast.error('Preencha os campos obrigatórios do responsável.');
      return;
    }
    nextStep();
  };

  // Submit Step 3 (Trigger API Call and generate OTP)
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCarrier(true);

    const payload = {
      nome: compNome,
      nif: compNif,
      email: compEmail,
      telefone: compTelefone,
      telefone_alt: compTelefoneAlt,
      tipo_empresa: compTipo,
      ano_fundacao: compAno,
      provincia: compProvincia,
      municipio: compMunicipio,
      endereco: compEndereco,
      logo_url:
        compLogo ||
        'https://images.unsplash.com/photo-1557683316-973673baf926?w=150&auto=format&fit=crop&q=60',
      resp_nome: respNome,
      resp_cargo: respCargo,
      resp_doc: respDoc,
      resp_telefone: respTelefone,
      resp_email: respEmail,
      resp_password: respPassword,
    };

    try {
      // Backend request
      const res = await fetch('/api/auth/register-carrier/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao realizar registo.');
        setIsSubmittingCarrier(false);
        return;
      }

      // Upload company documents
      const docs = [
        { tipo: 'REGISTO_COMERCIAL', arquivo_url: docRegisto },
        { tipo: 'ALVARA', arquivo_url: docAlvara },
        { tipo: 'CONTRIBUINTE', arquivo_url: docContribuinte },
      ];
      if (docEstatutos) docs.push({ tipo: 'ESTATUTOS', arquivo_url: docEstatutos });

      for (const d of docs) {
        try {
          const resDoc = await fetch('/api/auth/upload-document/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company_id: data.company_id,
              tipo: d.tipo,
              arquivo_url: d.arquivo_url,
            }),
          });
          if (!resDoc.ok) {
            const errData = await resDoc.json().catch(() => ({}));
            throw new Error(errData.error || `Erro HTTP ${resDoc.status} ao carregar o documento.`);
          }
        } catch (docErr: any) {
          console.error(`Error uploading document ${d.tipo}:`, docErr);
          toast.error(
            `Falha ao enviar documento "${d.tipo.replace('_', ' ')}": ${docErr.message || docErr}`
          );
        }
      }

      // Set verification state
      const generatedOtp = data.otp;
      setServerOtp(generatedOtp);
      toast.info(`OTP enviado! Use o código de verificação: ${generatedOtp}`, {
        duration: 9000,
      });

      setIsSubmittingCarrier(false);
      nextStep(); // Go to step 4 OTP
    } catch (err) {
      setIsSubmittingCarrier(false);
      toast.error('Ocorreu um erro de ligação ao servidor do backend.');
    }
  };

  // Submit Step 4 OTP verification
  const handleStep4Otp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error('Introduza o código de verificação.');
      return;
    }

    setIsSubmittingCarrier(true);

    try {
      const res = await fetch('/api/auth/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode }),
      });

      if (!res.ok) {
        toast.error('Código de verificação OTP incorreto.');
        setIsSubmittingCarrier(false);
        return;
      }

      toast.success('Contacto verificado com sucesso!');

      setIsSubmittingCarrier(false);
      nextStep(); // Go to step 5 Success
    } catch (err) {
      setIsSubmittingCarrier(false);
      toast.error('Ocorreu um erro de ligação ao servidor do backend.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper progress for Carrier */}
      {registerType === 'transportadora' && (
        <div className="flex items-center justify-between px-4 pb-4 border-b border-border text-[10px] font-bold text-muted-foreground select-none">
          {[
            { step: 1, label: '1. Dados' },
            { step: 2, label: '2. Responsável' },
            { step: 3, label: '3. Documentos' },
            { step: 4, label: '4. OTP' },
            { step: 5, label: '5. Fim' },
          ].map((item, index) => (
            <React.Fragment key={item.step}>
              {index > 0 && <span className="text-muted-foreground/30">→</span>}
              <button
                type="button"
                disabled={item.step >= carrierStep || carrierStep === 5}
                onClick={() => setCarrierStep(item.step)}
                className={`transition-colors font-bold ${
                  carrierStep === item.step
                    ? 'text-primary underline decoration-2 underline-offset-4'
                    : carrierStep > item.step && carrierStep < 5
                      ? 'text-foreground hover:text-primary cursor-pointer'
                      : 'text-muted-foreground/60 cursor-not-allowed'
                }`}
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Account Type Toggle */}
      {carrierStep !== 5 && (
        <div className="grid grid-cols-2 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => {
              setRegisterType('cliente');
              setCarrierStep(1);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              registerType === 'cliente'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Passageiro (Cliente)
          </button>
          <button
            type="button"
            onClick={() => setRegisterType('transportadora')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              registerType === 'transportadora'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Transportadora (Parceiro)
          </button>
        </div>
      )}

      {/* CLIENT SIGNUP FORM */}
      {registerType === 'cliente' && !isClientOtpVerification && (
        <form onSubmit={handleSubmit(onSubmitPassenger)} noValidate className="space-y-4">
          {/* Social Auth */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('Google')}
              type="button"
              className="social-btn"
            >
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
              <span>Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin('Facebook')}
              type="button"
              className="social-btn"
            >
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
            <label
              htmlFor="reg-name"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
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
            <label
              htmlFor="reg-email"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
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
            <label
              htmlFor="reg-phone"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Telefone
            </label>
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
            <label
              htmlFor="reg-confirm"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
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
                  validate: (value) =>
                    value === watchedPassword || 'As palavras-passe não coincidem',
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
              'Criar conta grátis'
            )}
          </button>

          {/* Switch to login */}
          <p className="text-center text-sm text-muted-foreground font-sans">
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
      )}

      {/* CLIENT OTP VERIFICATION */}
      {registerType === 'cliente' && isClientOtpVerification && (
        <form onSubmit={handleClientOtpSubmit} className="space-y-4 text-xs font-semibold">
          <div className="border-b border-border pb-2 mb-2 text-center">
            <ShieldCheck className="text-primary w-10 h-10 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">Verificação de E-mail</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-normal max-w-xs mx-auto">
              Introduza o código de 6 dígitos que enviamos para o seu e-mail ({passengerData?.email}
              ) para validar e ativar a sua conta de passageiro.
            </p>
          </div>

          <div>
            <label className="block text-[11px] text-muted-foreground mb-1 text-center font-bold">
              Código de Verificação de 6 Dígitos
            </label>
            <input
              type="text"
              maxLength={6}
              required
              placeholder="Digite o código (Ex: 123456)"
              value={clientOtpCode}
              onChange={(e) => setClientOtpCode(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-xl bg-background text-foreground text-center text-sm font-mono tracking-widest focus:outline-none focus:border-primary"
            />
          </div>

          {/* Resend OTP */}
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[10px] text-muted-foreground font-normal">Não recebeu o código?</p>
            <button
              type="button"
              onClick={handleResendClientOtp}
              disabled={clientOtpCooldown > 0 || isResendingClientOtp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/30 text-primary text-[11px] font-bold hover:bg-primary/10 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isResendingClientOtp ? (
                <>
                  <Loader2 size={11} className="animate-spin" />A reenviar...
                </>
              ) : clientOtpCooldown > 0 ? (
                `Reenviar código (${clientOtpCooldown}s)`
              ) : (
                'Reenviar código por e-mail'
              )}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsClientOtpVerification(false)}
              className="flex-1 py-2.5 border border-border text-foreground font-bold rounded-xl text-xs hover:bg-muted transition-colors"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-colors flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar e Criar Conta'
              )}
            </button>
          </div>
        </form>
      )}

      {/* ==========================================
          CARRIER REGISTER STEP 1: BASIC DATA
          ========================================== */}
      {registerType === 'transportadora' && carrierStep === 1 && (
        <form onSubmit={handleStep1} className="space-y-4 text-xs font-semibold">
          <div className="border-b border-border pb-2 mb-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Building2 className="text-primary w-4 h-4" />
              <span>Dados da Empresa Transportadora</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Macon Transportes"
                value={compNome}
                onChange={(e) => setCompNome(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                NIF da Empresa *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 5000998877"
                value={compNif}
                onChange={(e) => setCompNif(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Tipo de Sociedade
              </label>
              <select
                value={compTipo}
                onChange={(e) => setCompTipo(e.target.value)}
                className="w-full px-2 py-2 border border-input rounded-lg bg-background text-foreground text-xs cursor-pointer"
              >
                <option value="Lda">Lda</option>
                <option value="S.A.">S.A.</option>
                <option value="Unipessoal">Unipessoal Lda</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Fundação</label>
              <input
                type="number"
                placeholder="Ex: 2008"
                value={compAno}
                onChange={(e) => setCompAno(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Logotipo da Empresa
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-input rounded-lg py-1.5 cursor-pointer hover:border-primary bg-background transition-colors text-center">
                  {compLogo ? (
                    <img src={compLogo} alt="Logo" className="h-7 max-w-full object-contain" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Upload size={12} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Carregar imagem</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                {compLogo && (
                  <button
                    type="button"
                    onClick={() => setCompLogo('')}
                    className="p-1.5 border border-danger/30 text-danger hover:bg-danger/5 rounded-lg"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 mt-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Província *</label>
              <select
                required
                value={compProvincia}
                onChange={(e) => {
                  setCompProvincia(e.target.value);
                  setCompMunicipio('');
                }}
                className="w-full px-2 py-2 border border-input rounded-lg bg-background text-foreground text-xs cursor-pointer font-semibold focus:outline-none"
              >
                <option value="">Selecione a Província</option>
                {Object.keys(ANGOLAN_PROVINCES).map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Município *</label>
              <select
                required
                value={compMunicipio}
                onChange={(e) => setCompMunicipio(e.target.value)}
                disabled={!compProvincia}
                className="w-full px-2 py-2 border border-input rounded-lg bg-background text-foreground text-xs cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              >
                <option value="">Selecione o Município</option>
                {compProvincia &&
                  ANGOLAN_PROVINCES[compProvincia]?.map((mun) => (
                    <option key={mun} value={mun}>
                      {mun}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">
              Endereço Completo
            </label>
            <input
              type="text"
              placeholder="Ex: Estrada de Catete, Bairro Azul"
              value={compEndereco}
              onChange={(e) => setCompEndereco(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 mt-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Email Comercial *
              </label>
              <input
                type="email"
                required
                placeholder="comercial@empresa.ao"
                value={compEmail}
                onChange={(e) => setCompEmail(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Telefone Principal *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 923 111 222"
                value={compTelefone}
                onChange={(e) => setCompTelefone(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-colors"
          >
            Seguinte: Dados do Responsável →
          </button>
        </form>
      )}

      {/* ==========================================
          CARRIER REGISTER STEP 2: RESPONSIBLE PERSON
          ========================================== */}
      {registerType === 'transportadora' && carrierStep === 2 && (
        <form onSubmit={handleStep2} className="space-y-4 text-xs font-semibold">
          <div className="border-b border-border pb-2 mb-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <User className="text-primary w-4 h-4" />
              <span>Dados do Responsável / Gerente</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João da Silva Santos"
                value={respNome}
                onChange={(e) => setRespNome(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Cargo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Diretor de Operações"
                value={respCargo}
                onChange={(e) => setRespCargo(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                BI / Passaporte *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 009876543LA077"
                value={respDoc}
                onChange={(e) => setRespDoc(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Telemóvel Pessoal
              </label>
              <input
                type="text"
                placeholder="Ex: 934 999 888"
                value={respTelefone}
                onChange={(e) => setRespTelefone(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 mt-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Email de Acesso *
              </label>
              <input
                type="email"
                required
                placeholder="responsavel@empresa.ao"
                value={respEmail}
                onChange={(e) => setRespEmail(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Senha de Acesso (Nova) *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={respPassword}
                onChange={(e) => setRespPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 py-2.5 border border-border text-foreground font-bold rounded-xl text-xs hover:bg-muted transition-colors"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-colors"
            >
              Seguinte: Documentação →
            </button>
          </div>
        </form>
      )}

      {/* ==========================================
          CARRIER REGISTER STEP 3: DOCUMENT VALIDATION
          ========================================== */}
      {registerType === 'transportadora' && carrierStep === 3 && (
        <form onSubmit={handleStep3Submit} className="space-y-4 text-xs font-semibold">
          <div className="border-b border-border pb-2 mb-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <FileText className="text-primary w-4 h-4" />
              <span>Documentos Obrigatórios (Carregar Ficheiros)</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-normal">
              Carregue os ficheiros dos documentos (PDF ou Imagem) para revisão do Administrador.
            </p>
          </div>

          <div className="space-y-4">
            {/* Certificado de Registo Comercial */}
            <div className="border border-border/80 bg-muted/20 p-3 rounded-xl hover:border-primary/50 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <span className="block text-xs font-bold text-foreground">
                    Certificado de Registo Comercial *
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-normal">
                    Documento de constituição da empresa (PDF/Imagem, Máx. 5MB)
                  </span>
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 rounded-lg cursor-pointer transition-all duration-150 text-[10px] font-bold">
                    <Upload size={12} />
                    <span>{docRegistoName ? 'Alterar Ficheiro' : 'Carregar Ficheiro'}</span>
                    <input
                      type="file"
                      required={!docRegisto}
                      accept=".pdf,image/*"
                      onChange={(e) => handleDocChange(e, setDocRegisto, setDocRegistoName)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {docRegistoName && (
                <div className="mt-2 text-[10px] text-success flex items-center gap-1">
                  <span>✓ {docRegistoName}</span>
                </div>
              )}
            </div>

            {/* Alvará / Licença de Transporte */}
            <div className="border border-border/80 bg-muted/20 p-3 rounded-xl hover:border-primary/50 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <span className="block text-xs font-bold text-foreground">
                    Alvará / Licença de Transporte *
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-normal">
                    Autorização oficial para transporte de passageiros (PDF/Imagem, Máx. 5MB)
                  </span>
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 rounded-lg cursor-pointer transition-all duration-150 text-[10px] font-bold">
                    <Upload size={12} />
                    <span>{docAlvaraName ? 'Alterar Ficheiro' : 'Carregar Ficheiro'}</span>
                    <input
                      type="file"
                      required={!docAlvara}
                      accept=".pdf,image/*"
                      onChange={(e) => handleDocChange(e, setDocAlvara, setDocAlvaraName)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {docAlvaraName && (
                <div className="mt-2 text-[10px] text-success flex items-center gap-1">
                  <span>✓ {docAlvaraName}</span>
                </div>
              )}
            </div>

            {/* Registo de Contribuinte (NIF) */}
            <div className="border border-border/80 bg-muted/20 p-3 rounded-xl hover:border-primary/50 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <span className="block text-xs font-bold text-foreground">
                    Registo de Contribuinte (NIF) *
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-normal">
                    Cartão de contribuinte / Comprovativo da AGT (PDF/Imagem, Máx. 5MB)
                  </span>
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 rounded-lg cursor-pointer transition-all duration-150 text-[10px] font-bold">
                    <Upload size={12} />
                    <span>{docContribuinteName ? 'Alterar Ficheiro' : 'Carregar Ficheiro'}</span>
                    <input
                      type="file"
                      required={!docContribuinte}
                      accept=".pdf,image/*"
                      onChange={(e) =>
                        handleDocChange(e, setDocContribuinte, setDocContribuinteName)
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {docContribuinteName && (
                <div className="mt-2 text-[10px] text-success flex items-center gap-1">
                  <span>✓ {docContribuinteName}</span>
                </div>
              )}
            </div>

            {/* Estatutos da Empresa (Recomendado) */}
            <div className="border border-border/80 bg-muted/20 p-3 rounded-xl hover:border-primary/50 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <span className="block text-xs font-bold text-foreground">
                    Estatutos da Empresa (Opcional)
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-normal">
                    Diário da República ou certidão equivalente (PDF/Imagem, Máx. 5MB)
                  </span>
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 rounded-lg cursor-pointer transition-all duration-150 text-[10px] font-bold">
                    <Upload size={12} />
                    <span>{docEstatutosName ? 'Alterar Ficheiro' : 'Carregar Ficheiro'}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleDocChange(e, setDocEstatutos, setDocEstatutosName)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {docEstatutosName && (
                <div className="mt-2 text-[10px] text-success flex items-center gap-1">
                  <span>✓ {docEstatutosName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 py-2.5 border border-border text-foreground font-bold rounded-xl text-xs hover:bg-muted transition-colors"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmittingCarrier}
              className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmittingCarrier ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Submetendo...
                </>
              ) : (
                'Submeter Candidatura →'
              )}
            </button>
          </div>
        </form>
      )}

      {/* ==========================================
          CARRIER REGISTER STEP 4: OTP CODE SECURITY
          ========================================== */}
      {registerType === 'transportadora' && carrierStep === 4 && (
        <form onSubmit={handleStep4Otp} className="space-y-4 text-xs font-semibold">
          <div className="border-b border-border pb-2 mb-2 text-center">
            <ShieldCheck className="text-primary w-10 h-10 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">Verificação OTP de Segurança</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-normal max-w-xs mx-auto">
              Introduza o código de 6 dígitos que enviamos para o email do responsável ({respEmail})
              e telemóvel para validar a conta.
            </p>
          </div>

          <div>
            <label className="block text-[11px] text-muted-foreground mb-1 text-center font-bold">
              Código OTP de 6 Dígitos
            </label>
            <input
              type="text"
              maxLength={6}
              required
              placeholder="Digite o código (Ex: 123456)"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-xl bg-background text-foreground text-center text-sm font-mono tracking-widest focus:outline-none focus:border-primary"
            />
          </div>

          {/* Resend OTP */}
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[10px] text-muted-foreground font-normal">Não recebeu o código?</p>
            <button
              type="button"
              id="resend-otp-btn"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || isResending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/30 text-primary text-[11px] font-bold hover:bg-primary/10 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isResending ? (
                <>
                  <Loader2 size={11} className="animate-spin" />A reenviar...
                </>
              ) : resendCooldown > 0 ? (
                `Reenviar código (${resendCooldown}s)`
              ) : (
                'Reenviar código OTP'
              )}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevStep}
              disabled={isSubmittingCarrier}
              className="flex-1 py-2.5 border border-border text-foreground font-bold rounded-xl text-xs hover:bg-muted transition-colors"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmittingCarrier}
              className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmittingCarrier ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Validando...
                </>
              ) : (
                'Verificar e Concluir'
              )}
            </button>
          </div>
        </form>
      )}

      {/* ==========================================
          CARRIER REGISTER STEP 5: SUCCESS / PENDING STATE
          ========================================== */}
      {registerType === 'transportadora' && carrierStep === 5 && (
        <div className="p-4 text-center space-y-4 text-xs font-semibold">
          <CheckCircle className="text-success w-12 h-12 mx-auto mb-2 animate-bounce-in" />
          <h3 className="text-base font-black text-foreground">Candidatura Submetida!</h3>
          <p className="text-muted-foreground font-normal leading-relaxed max-w-xs mx-auto">
            A sua conta de parceiro transportador foi criada com sucesso e encontra-se sob o estado
            de{' '}
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-black tracking-wide">
              PENDENTE
            </span>
            .
          </p>
          <div className="p-3 bg-muted rounded-xl text-left text-[10px] leading-relaxed text-muted-foreground">
            💡 **O que acontece a seguir?**
            <br />
            1. O administrador do Nzila analisará a sua documentação fiscal e legal.
            <br />
            2. Assim que for aprovada, receberá uma notificação no email oficial da empresa.
            <br />
            3. A sua conta de operador será ativada para que possa começar a cadastrar as suas
            frotas, rotas e horários de viagens no painel de parceiro.
          </div>
          <button
            onClick={() => onSwitchToLogin()}
            className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      )}
    </div>
  );
}
