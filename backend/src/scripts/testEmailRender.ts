import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildInviteEmail,
  buildVerifyEmail,
  buildLoginOTPEmail,
  buildEnable2FAEmail,
  buildPasswordResetEmail,
  buildEmailChangeEmail,
  buildDefaultEmail,
  buildPasswordChangedNotificationEmail,
  buildEmailChangedNotificationEmail
} from '../utils/emailTemplate.js';

// Resolve paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '../../email_tests');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const templates = [
  { name: '1_workspace_invite.html', result: buildInviteEmail('Acme Corporation', 'http://localhost:3000/accept-invite/mock-token-123') },
  { name: '2_verify_email.html', result: buildVerifyEmail('http://localhost:3000/verify-email/mock-token-456') },
  { name: '3_login_otp.html', result: buildLoginOTPEmail('847291') },
  { name: '4_enable_2fa.html', result: buildEnable2FAEmail('930182') },
  { name: '5_password_reset.html', result: buildPasswordResetEmail('http://localhost:3000/reset-password/mock-token-789') },
  { name: '6_email_change.html', result: buildEmailChangeEmail('new-email@example.com', 'http://localhost:3000/verify-email-change/mock-token-012') },
  { name: '7_default_plaintext_fallback.html', result: buildDefaultEmail('Important System Alert', 'Hello User,\n\nWe noticed a login from a new device. If this was you, please ignore this email. Otherwise, please secure your account immediately.\n\nLink to proceed: http://localhost:3000/security-settings\n\nBest regards,\nTaskBridge Team') },
  { name: '8_password_changed.html', result: buildPasswordChangedNotificationEmail() },
  { name: '9_email_changed.html', result: buildEmailChangedNotificationEmail('old-email@example.com', 'new-email@example.com') }
];

for (const t of templates) {
  const filePath = path.join(outputDir, t.name);
  fs.writeFileSync(filePath, t.result.html);
}
