/**
 * Pure authentication & onboarding utility logic for CollabFlow.
 * Decoupled from UI for testing and high-fidelity validation.
 */

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Excellent';
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export interface CountryCodeOption {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  format: string;
  length: number;
}

export const SUPPORTED_COUNTRIES: CountryCodeOption[] = [
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸', format: '(###) ###-####', length: 10 },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧', format: '#### ######', length: 10 },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦', format: '(###) ###-####', length: 10 },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪', format: '### #######', length: 10 },
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳', format: '##### #####', length: 10 },
  { code: 'JP', dialCode: '+81', name: 'Japan', flag: '🇯🇵', format: '## #### ####', length: 10 },
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺', format: '### ### ###', length: 9 },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷', format: '# ## ## ## ##', length: 9 },
  { code: 'CH', dialCode: '+41', name: 'Switzerland', flag: '🇨🇭', format: '## ### ####', length: 9 },
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬', format: '#### ####', length: 8 },
];

/**
 * Validates email according to standard corporate/work email format.
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const clean = email.trim();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  return { isValid: true };
}

/**
 * Evaluates password strength and returns score + check breakdown.
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;

  if (password.length === 0) {
    return { score: 0, label: 'Very Weak', color: 'bg-slate-700', checks };
  }

  if (passedCount <= 2) {
    return { score: 1, label: 'Weak', color: 'bg-rose-500', checks };
  }
  if (passedCount === 3) {
    return { score: 2, label: 'Medium', color: 'bg-amber-500', checks };
  }
  if (passedCount === 4) {
    return { score: 3, label: 'Strong', color: 'bg-indigo-500', checks };
  }
  return { score: 4, label: 'Excellent', color: 'bg-emerald-500', checks };
}

/**
 * Validates and formats a phone number against its country dialing configuration.
 */
export function validatePhoneNumber(
  dialCode: string,
  rawNumber: string
): { isValid: boolean; e164: string; formatted: string; error?: string } {
  const digitsOnly = rawNumber.replace(/\D/g, '');
  const country = SUPPORTED_COUNTRIES.find((c) => c.dialCode === dialCode) || SUPPORTED_COUNTRIES[0];

  if (!digitsOnly) {
    return { isValid: false, e164: '', formatted: '', error: 'Phone number is required.' };
  }

  if (digitsOnly.length < country.length - 1 || digitsOnly.length > country.length + 2) {
    return {
      isValid: false,
      e164: `${dialCode}${digitsOnly}`,
      formatted: digitsOnly,
      error: `Expected ${country.length} digits for ${country.name}.`,
    };
  }

  return {
    isValid: true,
    e164: `${dialCode}${digitsOnly}`,
    formatted: `${dialCode} ${digitsOnly}`,
  };
}

/**
 * Verifies a 6-digit OTP code against the expected value and expiry.
 */
export function verifyOTPCode(
  inputCode: string,
  expectedCode: string,
  expiresAt: number
): { success: boolean; error?: string } {
  const cleanInput = inputCode.replace(/\D/g, '');
  if (cleanInput.length !== 6) {
    return { success: false, error: 'Please enter all 6 digits of the verification code.' };
  }
  if (Date.now() > expiresAt) {
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }
  if (cleanInput !== expectedCode) {
    return { success: false, error: 'Incorrect verification code. Please try again.' };
  }
  return { success: true };
}

/**
 * Generates URL-friendly workspace slug.
 */
export function slugifyWorkspace(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-workspace';
}

/**
 * Generates tailored default channels for onboarding use cases.
 */
export function getDefaultChannelsForUseCase(useCase: string) {
  const base = [
    {
      name: 'announcements',
      description: 'Company-wide updates and official notices',
      topic: 'Official broadcasts & milestone celebrations',
      isPrivate: false,
    },
    {
      name: 'general',
      description: 'Day-to-day conversation and cross-team alignment',
      topic: 'Team watercooler & team syncs',
      isPrivate: false,
    },
  ];

  switch (useCase) {
    case 'engineering':
      return [
        ...base,
        {
          name: 'engineering-core',
          description: 'Architecture, PR reviews, and distributed systems discussions',
          topic: 'High-scale ASGI & WebSocket cluster discussions',
          isPrivate: false,
        },
        {
          name: 'deployments-and-incidents',
          description: 'Production alerts, canary rollouts, and uptime metrics',
          topic: 'CI/CD pipelines & automated SRE alerts',
          isPrivate: false,
        },
      ];
    case 'product':
      return [
        ...base,
        {
          name: 'product-roadmap',
          description: 'Sprint roadmaps, user research, and quarterly milestones',
          topic: 'Q3/Q4 Enterprise feature releases',
          isPrivate: false,
        },
        {
          name: 'design-critique',
          description: 'Figma prototypes, design systems, and typography review',
          topic: 'CollabFlow design constitution guidelines',
          isPrivate: false,
        },
      ];
    case 'operations':
      return [
        ...base,
        {
          name: 'compliance-and-security',
          description: 'SOC-2 Type II audit, ISO 27001, and GDPR controls',
          topic: 'Quarterly compliance & penetration testing',
          isPrivate: true,
        },
        {
          name: 'talent-and-culture',
          description: 'Onboarding, team benefits, and company summits',
          topic: 'Employee experience & welcoming newcomers',
          isPrivate: false,
        },
      ];
    default:
      return [
        ...base,
        {
          name: 'projects-sync',
          description: 'Active project updates and sprint deliverables',
          topic: 'Weekly deliverables & action items',
          isPrivate: false,
        },
      ];
  }
}

/**
 * Simulates enterprise JWT token issuance with claims & rotation.
 */
export function issueJWTSession(user: { id: string; email: string; role: string; name: string }) {
  const now = Math.floor(Date.now() / 1000);
  const accessExpiresAt = now + 900; // 15 minutes
  const refreshExpiresAt = now + 604800; // 7 days

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const accessPayload = btoa(
    JSON.stringify({
      token_type: 'access',
      exp: accessExpiresAt,
      iat: now,
      jti: `jti_${Math.random().toString(36).substring(2, 11)}`,
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iss: 'https://api.collabflow.internal/auth',
    })
  );

  const refreshPayload = btoa(
    JSON.stringify({
      token_type: 'refresh',
      exp: refreshExpiresAt,
      iat: now,
      jti: `ref_${Math.random().toString(36).substring(2, 11)}`,
      user_id: user.id,
    })
  );

  return {
    accessToken: `${header}.${accessPayload}.sig_simulated_hmac_sha256`,
    refreshToken: `${header}.${refreshPayload}.sig_simulated_hmac_sha256`,
    expiresAt: accessExpiresAt * 1000,
    issuedAt: now * 1000,
    tokenType: 'Bearer',
  };
}
