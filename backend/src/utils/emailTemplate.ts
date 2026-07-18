/**
 * Utility functions for generating branded HTML email templates for TaskBridge.
 */

interface EmailHtmlOptions {
  subject: string;
  contentHtml: string;
  preheader?: string;
  footerText?: string;
}

/**
 * Wraps rich body content in a standard, responsive, branded HTML email template.
 */
export const generateEmailHtml = (options: EmailHtmlOptions): string => {
  const currentYear = new Date().getFullYear();
  const preheaderText = options.preheader
    ? `<span style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">${options.preheader}</span>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${options.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f8fafc;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 12px !important;
      }
      .card {
        padding: 32px 20px !important;
      }
      .heading {
        font-size: 20px !important;
        line-height: 28px !important;
      }
      .body-text {
        font-size: 14px !important;
        line-height: 22px !important;
      }
      .btn {
        width: 100% !important;
        display: block !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheaderText}
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="580" class="container" style="width: 580px; max-width: 580px;">
          <!-- Header Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" target="_blank" style="text-decoration: none; display: inline-block;">
                <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <span style="color: #4f46e5;">Task</span><span style="color: #a855f7;">Bridge</span>
                </span>
              </a>
            </td>
          </tr>
          
          <!-- Content Card -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
                <!-- Gradient accent bar -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #4f46e5 0%, #a855f7 100%);"></td>
                </tr>
                <!-- Inside Card padding container -->
                <tr>
                  <td style="padding: 40px 36px;" class="card-body">
                    ${options.contentHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 20px 0 20px;">
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
                ${options.footerText || 'This is an automated system message from TaskBridge. Please do not reply directly to this email.'}
              </p>
              <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center;">
                &copy; ${currentYear} TaskBridge. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * 1. Workspace Invitation Email
 */
export const buildInviteEmail = (orgName: string, inviteUrl: string) => {
  const subject = 'TaskBridge - Workspace Invitation';
  const html = generateEmailHtml({
    subject,
    preheader: `You have been invited to join ${orgName} on TaskBridge.`,
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Workspace Invitation</h1>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        You have been invited to join <strong>${orgName}</strong> on TaskBridge! Experience a more efficient way to manage tasks, collaborate with your team, and track your progress in real-time.
      </p>
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
        <tr>
          <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <a class="btn" href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid transparent;">Accept Invitation</a>
          </td>
        </tr>
      </table>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #64748b; text-align: center;">
        This invitation link will expire in 7 days.
      </p>
      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 20px;">
        <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; word-break: break-all;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${inviteUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${inviteUrl}</a>
        </p>
      </div>
    `
  });

  const message = `You have been invited to join "${orgName}" on TaskBridge!\n\nClick the link below to accept your invitation:\n\n${inviteUrl}\n\nThis link will expire in 7 days.`;

  return { message, html };
};

/**
 * 2. Verify Your Email Address
 */
export const buildVerifyEmail = (verifyUrl: string) => {
  const subject = 'TaskBridge - Verify Your Email';
  const html = generateEmailHtml({
    subject,
    preheader: 'Welcome to TaskBridge! Please verify your email to complete registration.',
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Verify Your Email Address</h1>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        Welcome to TaskBridge! We are excited to have you on board. Please verify your email address to activate your account and start managing your workspace.
      </p>
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
        <tr>
          <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <a class="btn" href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid transparent;">Verify Email</a>
          </td>
        </tr>
      </table>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #64748b; text-align: center;">
        If you did not create a TaskBridge account, you can safely ignore this email.
      </p>
      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 20px;">
        <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; word-break: break-all;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${verifyUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${verifyUrl}</a>
        </p>
      </div>
    `
  });

  const message = `Welcome to TaskBridge! Please verify your email by clicking the link below:\n\n ${verifyUrl}\n\nIf you did not create an account, please ignore this email.`;

  return { message, html };
};

/**
 * 3. Login Verification OTP
 */
export const buildLoginOTPEmail = (otp: string) => {
  const subject = 'TaskBridge - Login Verification Code';
  const html = generateEmailHtml({
    subject,
    preheader: `Your login verification code is ${otp}.`,
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Verification Code</h1>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        Here is your temporary verification code to complete your login. For your security, this code should not be shared with anyone.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <div style="display: inline-block; padding: 16px 32px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e293b;">${otp}</span>
        </div>
      </div>
      <p class="body-text" style="margin: 0; font-size: 14px; line-height: 22px; color: #64748b; text-align: center;">
        This code will expire in 10 minutes. If you did not request this login, please change your password immediately.
      </p>
    `
  });

  const message = `Your login verification code is: ${otp}\n\nThis code will expire in 10 minutes.`;

  return { message, html };
};

/**
 * 4. Enable 2FA Verification OTP
 */
export const buildEnable2FAEmail = (otp: string) => {
  const subject = 'TaskBridge - Enable 2FA Verification Code';
  const html = generateEmailHtml({
    subject,
    preheader: `Your 2FA setup verification code is ${otp}.`,
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Enable 2FA Verification</h1>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        You requested to enable Two-Factor Authentication (2FA) for your TaskBridge account. Please use the verification code below to complete the setup.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <div style="display: inline-block; padding: 16px 32px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e293b;">${otp}</span>
        </div>
      </div>
      <p class="body-text" style="margin: 0; font-size: 14px; line-height: 22px; color: #64748b; text-align: center;">
        This code will expire in 10 minutes. If you did not request this setup, you can safely ignore this email.
      </p>
    `
  });

  const message = `You requested to enable Two-Factor Authentication. \n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.`;

  return { message, html };
};

/**
 * 5. Password Reset Request Email
 */
export const buildPasswordResetEmail = (resetUrl: string) => {
  const subject = 'TaskBridge - Password Reset Request';
  const html = generateEmailHtml({
    subject,
    preheader: 'Need to reset your password? Click the button below.',
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Reset Your Password</h1>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        You are receiving this email because a password reset request was made for your TaskBridge account. Click the button below to choose a new password.
      </p>
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
        <tr>
          <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <a class="btn" href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid transparent;">Reset Password</a>
          </td>
        </tr>
      </table>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #64748b; text-align: center;">
        This link will expire in 10 minutes. If you did not request a password reset, no further action is required and your password will remain unchanged.
      </p>
      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 20px;">
        <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; word-break: break-all;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${resetUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${resetUrl}</a>
        </p>
      </div>
    `
  });

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click on the link below to complete the process:\n\n ${resetUrl}\n\nIf you did not request this, please ignore this email.`;

  return { message, html };
};

/**
 * 6. Verify Email Change
 */
export const buildEmailChangeEmail = (newEmail: string, verifyUrl: string) => {
  const subject = 'TaskBridge - Verify Email Change';
  const html = generateEmailHtml({
    subject,
    preheader: `Confirm changing your email to ${newEmail}.`,
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Confirm Email Change</h1>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        You have requested to change the email address associated with your TaskBridge account to <strong>${newEmail}</strong>. Please click the button below to confirm and apply this change.
      </p>
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
        <tr>
          <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <a class="btn" href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid transparent;">Confirm Email Change</a>
          </td>
        </tr>
      </table>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #64748b; text-align: center;">
        This link will expire in 2 hours. If you did not request this change, you can safely ignore this email.
      </p>
      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 20px;">
        <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; word-break: break-all;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${verifyUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${verifyUrl}</a>
        </p>
      </div>
    `
  });

  const message = `You have requested to change your email to ${newEmail}.\nPlease confirm this change by clicking the link below:\n\n ${verifyUrl}\n\nThis link will expire in 2 hours. If you did not request this, please ignore this email and your email will not be changed.`;

  return { message, html };
};

/**
 * 7. Default Plain-Text to HTML Fallback Wrapper
 */
export const buildDefaultEmail = (subject: string, textContent: string) => {
  // Convert newlines to breaks, escape html, auto-wrap urls
  let escapedText = textContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Attempt to find any URL in the text and wrap it in a link, or convert to a CTA button if there's only one link
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = escapedText.match(urlRegex);
  
  let ctaSectionHtml = '';
  if (urls && urls.length === 1) {
    const rawUrl = urls[0];
    // Strip trailing punctuation if any
    const cleanUrl = rawUrl.replace(/[.,;:]$/, '');
    ctaSectionHtml = `
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 20px auto 20px auto;">
        <tr>
          <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <a class="btn" href="${cleanUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid transparent;">Click Here to Proceed</a>
          </td>
        </tr>
      </table>
    `;
    // Clean up url display in the text to avoid double raw links
    escapedText = escapedText.replace(rawUrl, `<a href="${cleanUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${cleanUrl}</a>`);
  } else if (urls) {
    // Just linkify all urls
    escapedText = escapedText.replace(urlRegex, (url) => {
      const cleanUrl = url.replace(/[.,;:]$/, '');
      return `<a href="${cleanUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${cleanUrl}</a>`;
    });
  }

  // Format paragraphs
  const paragraphs = escapedText.split('\n\n').map(p => {
    return `<p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  const html = generateEmailHtml({
    subject,
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; line-height: 28px; color: #1e293b;">${subject}</h1>
      ${paragraphs}
      ${ctaSectionHtml}
    `
  });

  return { message: textContent, html };
};

/**
 * 8. Password Changed Notification Email
 */
export const buildPasswordChangedNotificationEmail = () => {
  const subject = 'TaskBridge - Password Changed';
  const html = generateEmailHtml({
    subject,
    preheader: 'The password for your TaskBridge account has been changed.',
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Password Changed Successfully</h1>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        This is a confirmation that the password for your TaskBridge account has been successfully changed.
      </p>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #ef4444; font-weight: 600;">
        Security Notice: If you did not make this change, please contact TaskBridge support immediately and reset your password to secure your account.
      </p>
    `
  });

  const message = `This is a confirmation that the password for your TaskBridge account has been successfully changed.\n\nIf you did not make this change, please contact TaskBridge support immediately and reset your password to secure your account.`;

  return { message, html };
};

/**
 * 9. Email Changed Notification Email (sent to old email)
 */
export const buildEmailChangedNotificationEmail = (oldEmail: string, newEmail: string) => {
  const subject = 'TaskBridge - Email Address Changed';
  const html = generateEmailHtml({
    subject,
    preheader: 'The email address associated with your TaskBridge account has been changed.',
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Email Address Changed</h1>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
        The email address for your TaskBridge account has been successfully changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.
      </p>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        From now on, please use <strong>${newEmail}</strong> to log in to your account.
      </p>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #ef4444; font-weight: 600;">
        Security Notice: If you did not request this change, please contact TaskBridge support immediately to secure your account.
      </p>
    `
  });

  const message = `The email address for your TaskBridge account has been successfully changed from ${oldEmail} to ${newEmail}.\n\nIf you did not request this change, please contact TaskBridge support immediately to secure your account.`;

  return { message, html };
};

/**
 * 10. Subscription Limit Exceeded Email
 */
export const buildLimitExceededEmail = (
  planName: string,
  featureName: string,
  currentUsage: string,
  allowedLimit: string,
  billingUrl: string
) => {
  const subject = 'TaskBridge Alert: Subscription Limit Exceeded';
  const html = generateEmailHtml({
    subject,
    preheader: `Your workspace has exceeded the subscription limit for ${featureName}.`,
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Subscription Limit Exceeded</h1>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
        Your workspace is currently on the <strong>${planName}</strong> plan. We wanted to inform you that you have exceeded the allowed limit for <strong>${featureName}</strong>.
      </p>
      <div style="margin: 24px 0; padding: 20px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; font-family: sans-serif;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;"><strong>Feature:</strong> ${featureName}</p>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;"><strong>Current Usage:</strong> ${currentUsage}</p>
        <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Allowed Limit:</strong> ${allowedLimit}</p>
      </div>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        To restore full access or perform additional actions, please upgrade your subscription plan.
      </p>
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
        <tr>
          <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <a class="btn" href="${billingUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid transparent;">Upgrade Subscription</a>
          </td>
        </tr>
      </table>
    `
  });

  const message = `Your workspace has exceeded the subscription limit for ${featureName}.\n\nCurrent plan: ${planName}\nUsage: ${currentUsage}\nAllowed limit: ${allowedLimit}\n\nPlease upgrade your plan at:\n${billingUrl}`;

  return { message, html };
};

/**
 * 11. Welcome to TaskBridge Email
 */
export const buildWelcomeEmail = (userName: string, loginUrl: string) => {
  const subject = 'Welcome to TaskBridge!';
  const html = generateEmailHtml({
    subject,
    preheader: `Welcome to TaskBridge, ${userName}! We're thrilled to have you here.`,
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Welcome to TaskBridge!</h1>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
        Hi ${userName},
      </p>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        Thank you for creating an account on TaskBridge! We're excited to help you streamline your workflows, collaborate with your team, and manage your tasks more efficiently.
      </p>
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
        <tr>
          <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <a class="btn" href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid transparent;">Go to Dashboard</a>
          </td>
        </tr>
      </table>
      <p class="body-text" style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #64748b; text-align: center;">
        Get started by creating your first workspace or joining an existing one!
      </p>
      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 20px;">
        <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; word-break: break-all;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${loginUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${loginUrl}</a>
        </p>
      </div>
    `
  });

  const message = `Welcome to TaskBridge, ${userName}!\n\nThank you for creating an account. Click the link below to sign in and access your dashboard:\n\n${loginUrl}`;

  return { message, html };
};

/**
 * 12. Payment Confirmation Email (Customer Receipt)
 */
export const buildPaymentConfirmationEmail = (options: {
  planName: string;
  amount: string;
  billingCycle: string;
  paymentId: string;
  orgName: string;
  date: string;
}) => {
  const subject = 'Your TaskBridge Payment Receipt';
  const html = generateEmailHtml({
    subject,
    preheader: `Thank you for your payment to TaskBridge. Your subscription is active.`,
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">Thank you for your payment!</h1>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        Your payment has been successfully processed, and your subscription is active. Here is a summary of your transaction:
      </p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #f8fafc;">
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">Organization</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right;">${options.orgName}</td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">Plan Purchased</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right;"><strong>${options.planName} (${options.billingCycle})</strong></td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">Amount Paid</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right; font-weight: 700; color: #4f46e5;">${options.amount}</td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">Payment ID</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: right; font-family: monospace;">${options.paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 16px; font-size: 14px; color: #64748b; font-weight: 600;">Date</td>
          <td style="padding: 16px; font-size: 14px; color: #1e293b; text-align: right;">${options.date}</td>
        </tr>
      </table>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        You can now access all the premium features included in your plan. Go ahead and start inviting your team members to collaborate on projects!
      </p>
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
        <tr>
          <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <a class="btn" href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid transparent;">Go to Dashboard</a>
          </td>
        </tr>
      </table>
    `
  });

  const message = `Thank you for your payment!\n\nHere is a summary of your transaction:\n\nOrganization: ${options.orgName}\nPlan: ${options.planName} (${options.billingCycle})\nAmount Paid: ${options.amount}\nPayment ID: ${options.paymentId}\nDate: ${options.date}`;
  return { message, html };
};

/**
 * 13. Payment Notification Email (Merchant/Admin Alert)
 */
export const buildMerchantPaymentNotificationEmail = (options: {
  orgName: string;
  customerEmail: string;
  planName: string;
  amount: string;
  billingCycle: string;
  paymentId: string;
  date: string;
}) => {
  const subject = '[TaskBridge Admin] New Subscription Payment Received';
  const html = generateEmailHtml({
    subject,
    preheader: `A new payment of ${options.amount} has been received from ${options.orgName}.`,
    contentHtml: `
      <h1 class="heading" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; line-height: 30px; color: #1e293b;">New Payment Received</h1>
      <p class="body-text" style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
        A customer has successfully completed a payment for a subscription. Here are the transaction details:
      </p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #f8fafc;">
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">Organization</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right;">${options.orgName}</td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">Customer Email</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right;"><a href="mailto:${options.customerEmail}" style="color: #4f46e5; text-decoration: underline;">${options.customerEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">Plan Purchased</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right;">${options.planName} (${options.billingCycle})</td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">Amount Received</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right; font-weight: 700; color: #16a34a;">${options.amount}</td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">Payment ID</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: right; font-family: monospace;">${options.paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 16px; font-size: 14px; color: #64748b; font-weight: 600;">Date</td>
          <td style="padding: 16px; font-size: 14px; color: #1e293b; text-align: right;">${options.date}</td>
        </tr>
      </table>
    `
  });

  const message = `New subscription payment received!\n\nOrganization: ${options.orgName}\nCustomer Email: ${options.customerEmail}\nPlan: ${options.planName} (${options.billingCycle})\nAmount: ${options.amount}\nPayment ID: ${options.paymentId}\nDate: ${options.date}`;
  return { message, html };
};
