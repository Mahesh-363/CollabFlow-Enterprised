import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  calculatePasswordStrength,
  validatePhoneNumber,
  verifyOTPCode,
  slugifyWorkspace,
  getDefaultChannelsForUseCase,
  issueJWTSession,
} from './authLogic.ts';

test('validateEmail handles valid corporate and personal emails', () => {
  assert.equal(validateEmail('elena.vance@acme.corp').isValid, true);
  assert.equal(validateEmail('dev@startup.io').isValid, true);
  assert.equal(validateEmail('user.name+tag@domain.co.uk').isValid, true);
});

test('validateEmail catches missing or malformed emails', () => {
  assert.equal(validateEmail('').isValid, false);
  assert.equal(validateEmail('   ').isValid, false);
  assert.equal(validateEmail('plainaddress').isValid, false);
  assert.equal(validateEmail('@missingusername.com').isValid, false);
  assert.equal(validateEmail('user@.com').isValid, false);
});

test('calculatePasswordStrength evaluates length and character diversity', () => {
  const weak = calculatePasswordStrength('abc');
  assert.equal(weak.score <= 1, true);
  assert.equal(weak.label, 'Weak');

  const medium = calculatePasswordStrength('Password123');
  assert.equal(medium.score >= 2, true);

  const strong = calculatePasswordStrength('SuperSecret99#$!');
  assert.equal(strong.score >= 4, true);
  assert.equal(strong.checks.uppercase, true);
  assert.equal(strong.checks.lowercase, true);
  assert.equal(strong.checks.number, true);
  assert.equal(strong.checks.special, true);
  assert.equal(strong.checks.length, true);
});

test('validatePhoneNumber validates US and international country formats', () => {
  const validUS = validatePhoneNumber('+1', '4155552671');
  assert.equal(validUS.isValid, true);
  assert.equal(validUS.e164, '+14155552671');

  const validUK = validatePhoneNumber('+44', '7911123456');
  assert.equal(validUK.isValid, true);
  assert.equal(validUK.e164, '+447911123456');

  const tooShort = validatePhoneNumber('+1', '123');
  assert.equal(tooShort.isValid, false);
});

test('verifyOTPCode handles exact matches, wrong codes, and expiry', () => {
  const future = Date.now() + 60000;
  const past = Date.now() - 5000;

  // Valid
  assert.equal(verifyOTPCode('492810', '492810', future).success, true);
  // Invalid code
  assert.equal(verifyOTPCode('111111', '492810', future).success, false);
  // Incomplete digits
  assert.equal(verifyOTPCode('4928', '492810', future).success, false);
  // Expired
  assert.equal(verifyOTPCode('492810', '492810', past).success, false);
});

test('slugifyWorkspace produces clean URL slugs', () => {
  assert.equal(slugifyWorkspace('Acme Platform & Cloud'), 'acme-platform-cloud');
  assert.equal(slugifyWorkspace('  DevOps SIG / Core  '), 'devops-sig-core');
  assert.equal(slugifyWorkspace(''), 'my-workspace');
});

test('getDefaultChannelsForUseCase generates tailored channels', () => {
  const engChannels = getDefaultChannelsForUseCase('engineering');
  assert.equal(engChannels.some((c) => c.name === 'engineering-core'), true);
  assert.equal(engChannels.some((c) => c.name === 'deployments-and-incidents'), true);

  const productChannels = getDefaultChannelsForUseCase('product');
  assert.equal(productChannels.some((c) => c.name === 'product-roadmap'), true);
});

test('issueJWTSession generates structured JWT with access and refresh tokens', () => {
  const session = issueJWTSession({
    id: 'user-elena',
    email: 'elena.vance@acme.corp',
    name: 'Elena Vance',
    role: 'owner',
  });

  assert.equal(typeof session.accessToken, 'string');
  assert.equal(typeof session.refreshToken, 'string');
  assert.equal(session.tokenType, 'Bearer');
  assert.equal(session.expiresAt > Date.now(), true);

  // Check payload decoding
  const parts = session.accessToken.split('.');
  assert.equal(parts.length, 3);
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
  assert.equal(payload.email, 'elena.vance@acme.corp');
  assert.equal(payload.role, 'owner');
  assert.equal(payload.token_type, 'access');
});
