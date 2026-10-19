import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Phone,
  Layers,
  ChevronDown,
  Building2,
  Users,
  Check,
  Zap,
  Globe,
  Radio,
  ExternalLink,
  Code2,
  Gamepad2,
  Waves,
  User,
  UserPlus,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import {
  SUPPORTED_COUNTRIES,
  CountryCodeOption,
  validateEmail,
  calculatePasswordStrength,
  validatePhoneNumber,
  verifyOTPCode,
} from '../../utils/authLogic';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { WallE3DScene } from '../walle/WallE3DScene';
import { Hi3DWall } from '../hiwall/Hi3DWall';

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
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
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const GmailIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 6.5C3 5.12 4.12 4 5.5 4H18.5C19.88 4 21 5.12 21 6.5V17.5C21 18.88 19.88 20 18.5 20H5.5C4.12 20 3 18.88 3 17.5V6.5Z"
      fill="#1e293b"
      stroke="#475569"
      strokeWidth="1.5"
    />
    <path
      d="M3 6.5L12 13.5L21 6.5"
      stroke="#EA4335"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M3.5 6.5V17.5H7.5V11L3.5 7.8V6.5Z" fill="#EA4335" />
    <path d="M20.5 6.5V17.5H16.5V11L20.5 7.8V6.5Z" fill="#EA4335" />
    <path d="M7.5 17.5V10.5L12 14L16.5 10.5V17.5H7.5Z" fill="#FBBC04" />
  </svg>
);

export const AppleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-white' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z M15.97 6.4c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.67-2.83 1.45-.59.68-1.11 1.78-.97 2.84 1.12.09 2.2-.56 2.84-1.34z" />
  </svg>
);

export const AuthPage: React.FC = () => {
  const {
    loginWithEmail,
    loginWithGmail,
    signupWithEmail,
    loginWithMicrosoft,
    loginWithApple,
    loginWithPhone,
    loginAsPersona,
    completeOnboarding,
    users,
    setArchitectureOpen,
    setPresenceInspectorOpen,
    setAuthInspectorOpen,
    setGameOpen,
  } = useCollabStore();

  // Mode: 'signin' | 'signup' | 'onboarding'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'onboarding'>('signin');

  // Sign-in sub-method: 'email' | 'phone'
  const [signMethod, setSignMethod] = useState<'email' | 'phone'>('email');

  // Interactive 3D Showcase: 'hiwall' (@react-three/fiber + drei) | 'walle' (Three.js WALL-E)
  const [showcaseMode, setShowcaseMode] = useState<'hiwall' | 'walle'>('hiwall');

  // Sign-in form state
  const [email, setEmail] = useState('elena.vance@acme.corp');
  const [password, setPassword] = useState('CollabFlow#2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Phone state
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(SUPPORTED_COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('4155552671');
  const [phoneStep, setPhoneStep] = useState<'enter_number' | 'enter_otp'>('enter_number');
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [generatedOTP, setGeneratedOTP] = useState('492810');
  const [otpExpiry, setOtpExpiry] = useState(Date.now() + 180000);

  // Microsoft OAuth modal simulation
  const [isMicrosoftModalOpen, setIsMicrosoftModalOpen] = useState(false);
  const [msAccountType, setMsAccountType] = useState<'work_school' | 'personal_outlook'>('work_school');

  // Apple OAuth modal simulation
  const [isAppleModalOpen, setIsAppleModalOpen] = useState(false);
  const [appleHideEmail, setAppleHideEmail] = useState(true);

  // Gmail / Google OAuth modal simulation
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [selectedGmailAccount, setSelectedGmailAccount] = useState<'mahesh' | 'custom'>('mahesh');
  const [customGmail, setCustomGmail] = useState('');

  // Direct Sign Up form state
  const [signupName, setSignupName] = useState('Mahesh');
  const [signupEmail, setSignupEmail] = useState('maheshmass363@gmail.com');
  const [signupPassword, setSignupPassword] = useState('CollabPro#2026!');
  const [signupShowPassword, setSignupShowPassword] = useState(false);
  const [signupWorkspace, setSignupWorkspace] = useState("Mahesh's Team");
  const [signupAgreeTerms, setSignupAgreeTerms] = useState(true);

  // Onboarding wizard state
  const [onboardStep, setOnboardStep] = useState<1 | 2 | 3>(1);
  const [onboardName, setOnboardName] = useState('Sarah Jenkins');
  const [onboardEmail, setOnboardEmail] = useState('sarah.jenkins@hyperflow.dev');
  const [onboardPassword, setOnboardPassword] = useState('HyperFlow$Secure2026');
  const [workspaceName, setWorkspaceName] = useState('HyperFlow Systems');
  const [workspaceSlug, setWorkspaceSlug] = useState('hyperflow-systems');
  const [teamSize, setTeamSize] = useState('11-50');
  const [useCase, setUseCase] = useState('engineering');
  const [workspaceMode, setWorkspaceMode] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('ACME-PLATFORM-2026');

  // Modals & feedback
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simulated live pulse for brand preview
  const [pulseCount, setPulseCount] = useState(14820);
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount((c) => c + Math.floor(Math.random() * 5) - 2);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Handle standard email sign in
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setErrorMsg(emailCheck.error || 'Please enter a valid work email.');
      return;
    }
    if (!password) {
      setErrorMsg('Password is required.');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      await loginWithEmail(email, password, rememberMe);
      setIsLoading(false);
    }, 600);
  };

  // Handle phone OTP request
  const handleRequestPhoneOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const phoneCheck = validatePhoneNumber(selectedCountry.dialCode, phoneNumber);
    if (!phoneCheck.isValid) {
      setErrorMsg(phoneCheck.error || 'Invalid phone number format.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const code = '492810';
      setGeneratedOTP(code);
      setOtpExpiry(Date.now() + 180000);
      setPhoneStep('enter_otp');
      setOtpCooldown(30);
      setSuccessMsg(`Verification code sent to ${phoneCheck.formatted}`);
    }, 700);
  };

  // Handle phone OTP verify
  const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const verifyCheck = verifyOTPCode(otpCode, generatedOTP, otpExpiry);
    if (!verifyCheck.success) {
      setErrorMsg(verifyCheck.error || 'Verification code failed.');
      return;
    }

    setIsLoading(true);
    const phoneCheck = validatePhoneNumber(selectedCountry.dialCode, phoneNumber);
    setTimeout(async () => {
      await loginWithPhone(phoneCheck.e164, otpCode, rememberMe);
      setIsLoading(false);
    }, 600);
  };

  // Handle Microsoft sign in
  const handleMicrosoftOAuth = async () => {
    setIsLoading(true);
    setIsMicrosoftModalOpen(false);
    setTimeout(async () => {
      await loginWithMicrosoft(msAccountType, undefined, rememberMe);
      setIsLoading(false);
    }, 700);
  };

  // Handle Apple sign in
  const handleAppleOAuth = async () => {
    setIsLoading(true);
    setIsAppleModalOpen(false);
    setTimeout(async () => {
      await loginWithApple({ hideEmail: appleHideEmail, rememberMe });
      setIsLoading(false);
    }, 700);
  };

  // Handle Gmail / Google OAuth sign in
  const handleGmailOAuth = async (emailOverride?: string) => {
    setIsLoading(true);
    setIsGmailModalOpen(false);
    setErrorMsg('');
    setSuccessMsg('');
    const targetEmail =
      emailOverride ||
      (selectedGmailAccount === 'mahesh'
        ? 'maheshmass363@gmail.com'
        : customGmail.trim() || 'maheshmass363@gmail.com');
    const targetName = targetEmail.toLowerCase().includes('mahesh')
      ? 'Mahesh'
      : targetEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    setTimeout(async () => {
      await loginWithGmail({ email: targetEmail, name: targetName, rememberMe });
      setIsLoading(false);
    }, 500);
  };

  // Handle direct sign up submission
  const handleDirectSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    const emailCheck = validateEmail(signupEmail);
    if (!emailCheck.isValid) {
      setErrorMsg(emailCheck.error || 'Please enter a valid work or personal email.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (!signupAgreeTerms) {
      setErrorMsg('Please accept the Terms of Service & Privacy Policy.');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      const res = await signupWithEmail({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        workspaceName: signupWorkspace,
        rememberMe,
      });
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    }, 600);
  };

  // Handle onboarding submission
  const handleOnboardingSubmit = () => {
    setErrorMsg('');
    if (onboardStep === 1) {
      if (!onboardName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      const emailCheck = validateEmail(onboardEmail);
      if (!emailCheck.isValid) {
        setErrorMsg(emailCheck.error || 'Please enter a valid work email.');
        return;
      }
      const strength = calculatePasswordStrength(onboardPassword);
      if (strength.score < 2) {
        setErrorMsg('Please choose a stronger password.');
        return;
      }
      setOnboardStep(2);
    } else if (onboardStep === 2) {
      if (workspaceMode === 'create' && !workspaceName.trim()) {
        setErrorMsg('Workspace name is required.');
        return;
      }
      setOnboardStep(3);
    } else if (onboardStep === 3) {
      setIsLoading(true);
      setTimeout(() => {
        completeOnboarding(
          { name: onboardName, email: onboardEmail },
          {
            name: workspaceName,
            slug: workspaceSlug || workspaceName.toLowerCase().replace(/\s+/g, '-'),
            useCase,
            teamSize,
          },
          rememberMe
        );
        setIsLoading(false);
      }, 800);
    }
  };

  const passwordStrength = calculatePasswordStrength(onboardPassword);
  const signupPasswordStrength = calculatePasswordStrength(signupPassword);

  return (
    <div className="min-h-screen w-full bg-[#0a0d14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-violet-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[300px] bg-cyan-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-20 h-16 border-b border-slate-800/80 bg-[#0a0d14]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between shrink-0">
        {/* CollabFlow Wordmark & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Collab<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Flow</span>
              </span>
              <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 font-mono font-semibold">
                ENTERPRISE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:block">Real-time distributed collaboration</span>
          </div>
        </div>

        {/* Center / Tagline & Compliance */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-slate-300 font-medium">SOC-2 Type II & ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] text-slate-300 font-mono">Redis 7.2 Presence Active</span>
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAuthInspectorOpen(true)}
            title="Inspect OAuth & JWT Tokens"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Auth & JWTs</span>
          </button>

          <button
            onClick={() => setArchitectureOpen(true)}
            title="Inspect Backend Architecture"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Architecture</span>
          </button>

          {/* Break Time Arcade Launcher */}
          <button
            onClick={() => setGameOpen(true)}
            title="Play Free Time Break Game"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 transition-all shadow-sm shadow-emerald-900/20 active:scale-95"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Break Game</span>
            <span className="sm:hidden">Game</span>
          </button>

          {authMode === 'signin' ? (
            <button
              onClick={() => {
                setAuthMode('onboarding');
                setOnboardStep(1);
                setErrorMsg('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try for free</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg('');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Sign in instead
            </button>
          )}
        </div>
      </header>

      {/* MAIN SPLIT-SCREEN VIEWPORT */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 pb-12 sm:pb-16 gap-8 items-start lg:items-center">
        {/* ======================================================== */}
        {/* LEFT-SIDE BRAND & PRODUCT SHOWCASE */}
        {/* ======================================================== */}
        <section className="order-2 lg:order-1 lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Next-Generation Team Collaboration</span>
            </div>

            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Your team's best work{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300">
                starts here.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              CollabFlow unifies real-time messaging, multi-socket Redis presence, instant audio huddles, and threaded discussions in one secure, SOC-2 compliant enterprise workspace.
            </p>
          </div>

          {/* INTERACTIVE 3D EXPERIENCE SHOWCASE (HI WALL & WALL-E) */}
          <div className="space-y-2.5 max-w-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setShowcaseMode('hiwall')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    showcaseMode === 'hiwall'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-900/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5 text-cyan-300" />
                  <span>3D 'HI' Wall (R3F + Drei)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowcaseMode('walle')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    showcaseMode === 'walle'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-900/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>3D WALL-E Robot</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setGameOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/30 transition-all active:scale-95"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Play Break Game</span>
                <span className="sm:hidden">Game</span>
              </button>
            </div>

            {showcaseMode === 'hiwall' ? (
              <Hi3DWall />
            ) : (
              <WallE3DScene onOpenGame={() => setGameOpen(true)} />
            )}
          </div>

          {/* REALISTIC INTERFACE PREVIEW CARD (Clearly marked illustrative) */}
          <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl p-4 sm:p-5 backdrop-blur-xl space-y-4 max-w-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-slate-400">#engineering-core</span>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Illustrative Live Preview
              </span>
            </div>

            {/* Channels & Live Telemetry row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Active Sockets</span>
                <span className="text-sm font-mono font-bold text-cyan-400">{pulseCount.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Cluster Latency</span>
                <span className="text-sm font-mono font-bold text-emerald-400">11.4ms</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Presence Status</span>
                <span className="text-sm font-bold text-indigo-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Synced
                </span>
              </div>
            </div>

            {/* Simulated collaborative message item */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    EV
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">Elena Vance</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">Staff Architect</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">10:42 AM</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                🚀 Multi-socket presence state has synced to Redis 7.2 cluster. Inactivity decay is handling automatic away timeouts seamlessly across all connected clients!
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-[11px] font-medium flex items-center gap-1">
                  🔥 8
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1">
                  🚀 5
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1">
                  ✨ 3
                </span>
                <span className="ml-auto text-[11px] text-indigo-400 font-medium">3 thread replies</span>
              </div>
            </div>

            {/* Quick action buttons for reviewers */}
            <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPresenceInspectorOpen(true)}
                  className="hover:text-white underline decoration-dotted transition-colors"
                >
                  Redis Engine Monitor
                </button>
                <span>•</span>
                <button
                  onClick={() => setArchitectureOpen(true)}
                  className="hover:text-white underline decoration-dotted transition-colors"
                >
                  Django Channels Architecture
                </button>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">100% WCAG AAA</span>
            </div>
          </div>

          {/* Social Proof & Security Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>SAML 2.0 & SCIM Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>TLS 1.3 / AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Global 99.99% Uptime SLA</span>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT-SIDE AUTHENTICATION & ONBOARDING CARD */}
        {/* ======================================================== */}
        <section className="order-1 lg:order-2 lg:col-span-6 xl:col-span-5 w-full">
          <div className="w-full bg-[#0d121f] border border-slate-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
            {/* Subtle top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />

            {/* Error & Success Feedback alerts */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{successMsg}</span>
              </div>
            )}

            {/* TOP TABS: SIGN IN vs SIGN UP */}
            <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  authMode === 'signin'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
                <span>Sign Up</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase">
                  Free
                </span>
              </button>
            </div>

            {/* =================================================== */}
            {/* VIEW A: SIGN IN FLOW */}
            {/* =================================================== */}
            {authMode === 'signin' && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Sign in to your CollabFlow workspace or select an identity provider.
                  </p>
                </div>

                {/* SSO PROVIDERS (GMAIL, MICROSOFT & APPLE) */}
                <div className="space-y-2.5">
                  {/* GMAIL / GOOGLE IDENTITY BUTTON */}
                  <button
                    type="button"
                    onClick={() => setIsGmailModalOpen(true)}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-white transition-all shadow-sm hover:border-indigo-500/60 group"
                  >
                    <GoogleIcon className="w-4 h-4 shrink-0" />
                    <span>Continue with Gmail</span>
                    <span className="ml-auto text-[10px] text-cyan-400 font-mono hidden sm:inline flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Google Fast Sign-In
                    </span>
                  </button>

                  {/* MICROSOFT IDENTITY BUTTON */}
                  <button
                    type="button"
                    onClick={() => setIsMicrosoftModalOpen(true)}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-white transition-all shadow-sm hover:border-slate-600 group"
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-4 h-4 shrink-0">
                      <div className="bg-[#f25022]" />
                      <div className="bg-[#7fba00]" />
                      <div className="bg-[#00a4ef]" />
                      <div className="bg-[#ffb900]" />
                    </div>
                    <span>Continue with Microsoft</span>
                    <span className="ml-auto text-[10px] text-slate-400 font-mono hidden sm:inline">
                      Work, School & Outlook
                    </span>
                  </button>

                  {/* APPLE SIGN IN BUTTON */}
                  <button
                    type="button"
                    onClick={() => setIsAppleModalOpen(true)}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-700 text-xs font-semibold text-white transition-all shadow-sm hover:border-neutral-600 group"
                  >
                    <AppleIcon className="w-4 h-4 text-white shrink-0" />
                    <span>Continue with Apple</span>
                    <span className="ml-auto text-[10px] text-slate-400 font-mono hidden sm:inline">
                      Private Relay & Face ID
                    </span>
                  </button>
                </div>

                {/* DIVIDER */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative px-3 bg-[#0d121f] text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Or sign in with
                  </div>
                </div>

                {/* SUB-METHOD TOGGLE: EMAIL VS PHONE */}
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSignMethod('email');
                      setErrorMsg('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      signMethod === 'email'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Work Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignMethod('phone');
                      setErrorMsg('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      signMethod === 'phone'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone & SMS OTP</span>
                  </button>
                </div>

                {/* EMAIL & PASSWORD FORM */}
                {signMethod === 'email' && (
                  <form onSubmit={handleEmailSignIn} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Work Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          required
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">Password</label>
                        <button
                          type="button"
                          onClick={() => setIsForgotModalOpen(true)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full pl-9 pr-10 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span>Remember device for 30 days</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying session...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to CollabFlow</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* PHONE & SMS OTP FORM */}
                {signMethod === 'phone' && (
                  <div className="space-y-4">
                    {phoneStep === 'enter_number' ? (
                      <form onSubmit={handleRequestPhoneOTP} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Mobile Phone Number
                          </label>
                          <div className="flex gap-2">
                            {/* Country Dial Code Dropdown */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                className="h-full px-2.5 py-2 flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-200 hover:border-slate-600 transition-colors"
                              >
                                <span>{selectedCountry.flag}</span>
                                <span className="font-mono">{selectedCountry.dialCode}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              </button>

                              {isCountryDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-56 max-h-56 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1 space-y-0.5">
                                  {SUPPORTED_COUNTRIES.map((country) => (
                                    <button
                                      key={country.code}
                                      type="button"
                                      onClick={() => {
                                        setSelectedCountry(country);
                                        setIsCountryDropdownOpen(false);
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left hover:bg-slate-800 text-slate-200 transition-colors"
                                    >
                                      <span>{country.flag}</span>
                                      <span className="flex-1 truncate">{country.name}</span>
                                      <span className="font-mono text-slate-400">{country.dialCode}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Phone Input */}
                            <div className="relative flex-1">
                              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                              <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="415 555 2671"
                                required
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            We will send a 6-digit one-time verification code via SMS. Standard rates apply.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Dispatching OTP...</span>
                            </>
                          ) : (
                            <>
                              <span>Send Verification Code</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* OTP VERIFICATION STEP */
                      <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300">
                          Verification code sent to <strong className="text-white font-mono">{selectedCountry.dialCode} {phoneNumber}</strong>. (For demo preview: enter code <strong className="text-white font-mono">492810</strong>)
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Enter 6-Digit Code
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="492810"
                            autoFocus
                            required
                            className="w-full px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <button
                            type="button"
                            onClick={() => setPhoneStep('enter_number')}
                            className="text-slate-400 hover:text-white"
                          >
                            Edit Phone Number
                          </button>
                          <button
                            type="button"
                            disabled={otpCooldown > 0}
                            onClick={() => {
                              setOtpCooldown(30);
                              setSuccessMsg('New 6-digit code dispatched.');
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50"
                          >
                            {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Validating OTP...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify & Enter Workspace</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* 1-CLICK FAST PERSONA TESTING BAR */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Test Accounts (RBAC)
                    </span>
                    <span className="text-[10px] text-indigo-400">1-Click Sign In</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {users
                      .filter((u) => !u.isBot)
                      .slice(0, 4)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => loginAsPersona(u.id, rememberMe)}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-600/50 transition-colors text-left"
                        >
                          <span className="w-5 h-5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                            {u.avatar}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block text-[11px] font-semibold text-slate-200 truncate">
                              {u.name}
                            </span>
                            <span className="block text-[10px] text-slate-500 capitalize">{u.role}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Card Footer: Switch to Sign Up */}
                <div className="pt-2 text-center text-xs text-slate-400 space-y-1">
                  <div>
                    <span>Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Sign up for free
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('onboarding');
                        setOnboardStep(1);
                        setErrorMsg('');
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-400"
                    >
                      Or start 14-day enterprise trial →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================== */}
            {/* VIEW B: DIRECT SIGN UP FLOW */}
            {/* =================================================== */}
            {authMode === 'signup' && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Create your account</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Get started with CollabFlow in seconds. No credit card required.
                  </p>
                </div>

                {/* 1-CLICK FAST SSO SIGNUP WITH GMAIL */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setIsGmailModalOpen(true)}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-indigo-500/50 hover:border-indigo-400 text-xs font-semibold text-white transition-all shadow-sm group"
                  >
                    <GoogleIcon className="w-4 h-4 shrink-0" />
                    <span>Sign up with Gmail</span>
                    <span className="ml-auto text-[10px] text-emerald-400 font-mono hidden sm:inline flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      1-Click Instant
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMicrosoftModalOpen(true)}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 text-xs font-medium text-slate-200 transition-all hover:border-slate-600"
                    >
                      <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 shrink-0">
                        <div className="bg-[#f25022]" />
                        <div className="bg-[#7fba00]" />
                        <div className="bg-[#00a4ef]" />
                        <div className="bg-[#ffb900]" />
                      </div>
                      <span>Microsoft</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAppleModalOpen(true)}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-700 text-xs font-medium text-white transition-all hover:border-neutral-600"
                    >
                      <AppleIcon className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Apple ID</span>
                    </button>
                  </div>
                </div>

                {/* DIVIDER */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative px-3 bg-[#0d121f] text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Or sign up with email
                  </div>
                </div>

                {/* SIGN UP FORM */}
                <form onSubmit={handleDirectSignUp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Mahesh Kumar"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address (Gmail or Work Email)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="maheshmass363@gmail.com"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <span className="text-[10px] text-slate-400">Min 6 characters</span>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type={signupShowPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create a secure password"
                        required
                        className="w-full pl-9 pr-10 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setSignupShowPassword(!signupShowPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                        aria-label={signupShowPassword ? 'Hide password' : 'Show password'}
                      >
                        {signupShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Password Strength:</span>
                        <span className="font-semibold text-slate-200">{signupPasswordStrength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 rounded-full ${
                              signupPasswordStrength.score >= level ? signupPasswordStrength.color : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Workspace / Team Name <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={signupWorkspace}
                        onChange={(e) => setSignupWorkspace(e.target.value)}
                        placeholder="e.g. Mahesh's Team"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={signupAgreeTerms}
                        onChange={(e) => setSignupAgreeTerms(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5"
                      />
                      <span>
                        I agree to CollabFlow's{' '}
                        <a href="#terms" onClick={(e) => e.preventDefault()} className="text-indigo-400 underline">Terms of Service</a>{' '}
                        and{' '}
                        <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-indigo-400 underline">Privacy Policy</a>.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating account & initializing workspace...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Create Free Account & Enter</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Advanced Enterprise Setup Option */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Need custom SSO / SAML 2.0?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('onboarding');
                      setOnboardStep(1);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    3-step enterprise wizard →
                  </button>
                </div>

                {/* Footer: Back to Sign In */}
                <div className="pt-1 text-center text-xs text-slate-400">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMsg('');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Sign in here
                  </button>
                </div>
              </div>
            )}

            {/* =================================================== */}
            {/* VIEW C: TRY FOR FREE ONBOARDING FLOW */}
            {/* =================================================== */}
            {authMode === 'onboarding' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 font-mono uppercase font-bold">
                      Step {onboardStep} of 3
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {onboardStep === 1 && 'Create your account'}
                    {onboardStep === 2 && 'Set up your workspace'}
                    {onboardStep === 3 && 'Activate 14-day Enterprise Trial'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {onboardStep === 1 && 'No credit card required. Full enterprise access unlocked.'}
                    {onboardStep === 2 && 'Name your workspace or join an existing organization.'}
                    {onboardStep === 3 && 'All enterprise security, presence, and huddle features ready.'}
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className={`h-1.5 rounded-full ${onboardStep >= 1 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                  <div className={`h-1.5 rounded-full ${onboardStep >= 2 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                  <div className={`h-1.5 rounded-full ${onboardStep >= 3 ? 'bg-cyan-400' : 'bg-slate-800'}`} />
                </div>

                {/* ONBOARDING STEP 1: USER ACCOUNT */}
                {onboardStep === 1 && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={onboardName}
                        onChange={(e) => setOnboardName(e.target.value)}
                        placeholder="Sarah Jenkins"
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        value={onboardEmail}
                        onChange={(e) => setOnboardEmail(e.target.value)}
                        placeholder="sarah@hyperflow.dev"
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={onboardPassword}
                        onChange={(e) => setOnboardPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      {/* Password Strength Meter */}
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Password Strength:</span>
                          <span className="font-semibold text-slate-200">{passwordStrength.label}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 rounded-full ${
                                passwordStrength.score >= level ? passwordStrength.color : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOnboardingSubmit}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      <span>Continue to Workspace Setup</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* ONBOARDING STEP 2: WORKSPACE SETUP */}
                {onboardStep === 2 && (
                  <div className="space-y-4">
                    {/* Create vs Join Mode */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkspaceMode('create')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          workspaceMode === 'create'
                            ? 'bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-indigo-400 mb-1" />
                        <span className="block text-xs font-bold">Create Workspace</span>
                        <span className="block text-[10px] text-slate-400">Start a new team hub</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkspaceMode('join')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          workspaceMode === 'join'
                            ? 'bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Users className="w-4 h-4 text-cyan-400 mb-1" />
                        <span className="block text-xs font-bold">Join Workspace</span>
                        <span className="block text-[10px] text-slate-400">Use team invitation code</span>
                      </button>
                    </div>

                    {workspaceMode === 'create' ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Workspace Name
                          </label>
                          <input
                            type="text"
                            value={workspaceName}
                            onChange={(e) => {
                              setWorkspaceName(e.target.value);
                              setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'));
                            }}
                            placeholder="HyperFlow Systems"
                            required
                            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Workspace URL Slug
                          </label>
                          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-xs text-slate-400">
                            <span>collabflow.app/</span>
                            <input
                              type="text"
                              value={workspaceSlug}
                              onChange={(e) => setWorkspaceSlug(e.target.value)}
                              className="flex-1 bg-transparent text-slate-100 font-mono focus:outline-none ml-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Team Size
                            </label>
                            <select
                              value={teamSize}
                              onChange={(e) => setTeamSize(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="1-10">1 - 10 people</option>
                              <option value="11-50">11 - 50 people</option>
                              <option value="51-250">51 - 250 people</option>
                              <option value="250+">250+ Enterprise</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Primary Department
                            </label>
                            <select
                              value={useCase}
                              onChange={(e) => setUseCase(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="engineering">Engineering & SRE</option>
                              <option value="product">Product & Design</option>
                              <option value="operations">Operations & Security</option>
                              <option value="general">Company-wide</option>
                            </select>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Workspace Invitation Code
                        </label>
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          placeholder="e.g. ACME-PLATFORM-2026"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Enter the 16-character workspace invite code provided by your organization administrator.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setOnboardStep(1)}
                        className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleOnboardingSubmit}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                      >
                        <span>Review & Launch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ONBOARDING STEP 3: CONFIRMATION & TRIAL LAUNCH */}
                {onboardStep === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-tr from-indigo-950/60 to-violet-950/60 border border-indigo-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{workspaceName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                          14 DAYS FREE TRIAL
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Configured for <strong className="text-white">{onboardName}</strong> as Workspace Owner.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300 block">Default Channels Generated</span>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                          <span className="text-slate-500">#</span> announcements
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                          <span className="text-slate-500">#</span> general
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                          <span className="text-slate-500">#</span> engineering-core
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                          <span className="text-slate-500">#</span> deployments
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setOnboardStep(2)}
                        className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleOnboardingSubmit}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Provisioning Workspace...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Launch CollabFlow Workspace</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PRIVACY & COMPLIANCE FOOTER */}
          <div className="mt-4 text-center text-[11px] text-slate-500 flex flex-wrap items-center justify-center gap-3">
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-300 transition-colors">
              Terms of Service
            </a>
            <span>•</span>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#security" onClick={(e) => e.preventDefault()} className="hover:text-slate-300 transition-colors">
              SOC-2 Compliance
            </a>
            <span>•</span>
            <button
              onClick={() => setAuthInspectorOpen(true)}
              className="hover:text-indigo-400 underline decoration-dotted transition-colors"
            >
              SSO Architecture
            </button>
          </div>
        </section>
      </main>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* FORGOT PASSWORD MODAL */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        defaultEmail={email}
        onSuccess={(em) => {
          setSuccessMsg(`Password successfully updated for ${em}. You may now sign in.`);
        }}
      />

      {/* GMAIL / GOOGLE OAUTH SIMULATED MODAL */}
      {isGmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#1f1f1f] border border-neutral-700/80 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-100">
            {/* Header with Google Logo */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <GoogleIcon className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Sign in with Google</h3>
                  <p className="text-[11px] text-slate-400">Choose an account to continue to CollabFlow</p>
                </div>
              </div>
              <button
                onClick={() => setIsGmailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Account List */}
            <div className="space-y-2 pt-1">
              {/* Primary User Account */}
              <button
                type="button"
                onClick={() => setSelectedGmailAccount('mahesh')}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  selectedGmailAccount === 'mahesh'
                    ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-inner shrink-0">
                  M
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Mahesh</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                      Primary
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-400 truncate font-mono">
                    maheshmass363@gmail.com
                  </span>
                </div>
                {selectedGmailAccount === 'mahesh' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                )}
              </button>

              {/* Custom / Another Account */}
              <button
                type="button"
                onClick={() => setSelectedGmailAccount('custom')}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  selectedGmailAccount === 'custom'
                    ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 text-slate-300 font-bold text-sm flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4 text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-white">Use another Gmail account</span>
                  <span className="block text-[11px] text-slate-400">Enter custom email address</span>
                </div>
                {selectedGmailAccount === 'custom' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                )}
              </button>

              {/* Inline input if custom account chosen */}
              {selectedGmailAccount === 'custom' && (
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 animate-in fade-in">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Enter your Gmail address:
                  </label>
                  <input
                    type="email"
                    value={customGmail}
                    onChange={(e) => setCustomGmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    autoFocus
                    className="w-full px-3 py-2 text-xs bg-black border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Google OAuth Permissions notice */}
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px] text-slate-400 leading-relaxed">
              To continue, Google will share your name, email address, language preference, and profile picture with CollabFlow.
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsGmailModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGmailOAuth()}
                className="px-4 py-2 text-xs font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                <GoogleIcon className="w-3.5 h-3.5" />
                <span>Continue as {selectedGmailAccount === 'mahesh' ? 'Mahesh' : 'Gmail User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MICROSOFT OAUTH SIMULATED MODAL */}
      {isMicrosoftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <div className="bg-[#f25022]" />
                  <div className="bg-[#7fba00]" />
                  <div className="bg-[#00a4ef]" />
                  <div className="bg-[#ffb900]" />
                </div>
                <h3 className="text-sm font-bold text-white">Microsoft Identity Platform</h3>
              </div>
              <button onClick={() => setIsMicrosoftModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select your Microsoft account type to authorize CollabFlow:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => setMsAccountType('work_school')}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                  msAccountType === 'work_school'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Work or School Account (Microsoft Entra ID)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  elena.vance@acme.corp (Acme Corp Azure Tenant)
                </div>
              </button>

              <button
                onClick={() => setMsAccountType('personal_outlook')}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                  msAccountType === 'personal_outlook'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Personal Microsoft or Outlook.com Account
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  user.outlook@outlook.com
                </div>
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              Scopes requested: <code className="text-indigo-300 font-mono">User.Read openid profile email</code>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsMicrosoftModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleMicrosoftOAuth}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30"
              >
                Authorize & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLE SIGN IN SIMULATED MODAL */}
      {isAppleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <AppleIcon className="w-5 h-5 text-white shrink-0" />
                <h3 className="text-sm font-bold text-white">Sign in with Apple</h3>
              </div>
              <button onClick={() => setIsAppleModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Do you want to sign in to CollabFlow with your Apple ID?
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setAppleHideEmail(false)}
                className={`w-full p-3 rounded-xl border block cursor-pointer text-xs transition-all ${
                  !appleHideEmail
                    ? 'bg-neutral-800 border-white text-white'
                    : 'bg-neutral-950 border-neutral-800 text-slate-300'
                }`}
              >
                <div className="font-bold">Share My Email</div>
                <div className="text-[11px] text-slate-400">developer@apple.user</div>
              </label>

              <label
                onClick={() => setAppleHideEmail(true)}
                className={`w-full p-3 rounded-xl border block cursor-pointer text-xs transition-all ${
                  appleHideEmail
                    ? 'bg-neutral-800 border-white text-white'
                    : 'bg-neutral-950 border-neutral-800 text-slate-300'
                }`}
              >
                <div className="font-bold">Hide My Email (Private Relay)</div>
                <div className="text-[11px] text-slate-400">
                  relay.cf78a@privaterelay.appleid.com (Forwards to your real inbox)
                </div>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsAppleModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAppleOAuth}
                className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl"
              >
                Continue with Face ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
