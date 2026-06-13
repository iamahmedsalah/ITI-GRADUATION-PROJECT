const LOGO_URL = "https://res.cloudinary.com/dvepf4xdm/image/upload/q_auto/f_auto/v1780761755/logo_qnlxxo.png";
const LOGO_LINK =
  process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.PRODUCTION_URL || "http://localhost:5173";
const EMAIL_THEME = ["light", "dark"].includes((process.env.EMAIL_THEME || "").toLowerCase())
  ? process.env.EMAIL_THEME.toLowerCase()
  : "auto";
const EMAIL_THEME_CLASS = `theme-${EMAIL_THEME}`;

const EMAIL_STYLE = `
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #6b6375;
      font-family: "DM Sans", Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .email-body {
      width: 100%;
      background-color: #ffffff;
      padding: 24px 0;
    }

    .email-card {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e5e4e7;
      box-shadow: 0 18px 42px rgba(8, 6, 13, 0.08);
    }

    .email-header {
      padding: 30px 24px 24px;
      text-align: center;
      background-color: #ffffff;
      border-top: 5px solid #1DB954;
      border-bottom: 1px solid #e5e4e7;
    }

    .logo-link {
      display: inline-block;
      text-decoration: none;
    }

    .logo {
      width: 118px;
      max-width: 180px;
      height: auto;
      display: block;
      margin: 0 auto 14px;
    }

    .email-title {
      margin: 0;
      color: #08060d;
      font-size: 26px;
      font-weight: 700;
      line-height: 1.2;
    }

    .email-content {
      padding: 32px 28px;
      color: #6b6375;
      background-color: #ffffff;
    }

    .email-content p {
      margin: 0 0 18px;
      font-size: 15px;
      line-height: 1.7;
    }

    .email-content p.lead {
      font-size: 16px;
      color: #08060d;
      font-weight: 700;
    }

    .email-panel {
      margin: 28px 0;
      text-align: center;
    }

    .token-box {
      display: inline-block;
      padding: 16px 24px;
      background-color: rgba(29, 185, 84, 0.08);
      border: 1px solid rgba(29, 185, 84, 0.35);
      border-radius: 12px;
      color: #1DB954;
      font-size: 30px;
      letter-spacing: 6px;
      font-weight: 700;
    }

    .info-card {
      margin: 24px 0;
      padding: 16px 18px;
      background-color: #f6f4f8;
      border: 1px solid #e5e4e7;
      border-radius: 12px;
      color: #6b6375;
    }

    .info-card p {
      margin-bottom: 0;
    }

    .button {
      display: inline-block;
      background-color: #1DB954;
      color: #ffffff;
      text-decoration: none;
      padding: 13px 22px;
      border-radius: 999px;
      font-size: 15px;
      font-weight: 700;
    }

    .footer {
      padding: 18px 24px;
      text-align: center;
      background-color: #f6f4f8;
      border-top: 1px solid #e5e4e7;
      color: #6b6375;
      font-size: 12px;
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin: 24px 0 0;
    }

    .details-table td {
      padding: 10px;
      border: 1px solid #e5e4e7;
      color: #08060d;
    }

    .details-table td.label {
      color: #6b6375;
      width: 38%;
    }

    .section-title {
      margin: 24px 0 12px;
      color: #08060d;
      font-size: 16px;
      line-height: 1.4;
    }

    .theme-dark,
    .theme-dark .email-body {
      background-color: #121212 !important;
      color: #A7A7A7 !important;
    }

    .theme-dark .email-card {
      background-color: #181818 !important;
      border-color: #282828 !important;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.5) !important;
    }

    .theme-dark .email-header {
      background-color: #181818 !important;
      border-bottom-color: #282828 !important;
    }

    .theme-dark .email-title,
    .theme-dark .email-content p.lead,
    .theme-dark .section-title,
    .theme-dark .details-table td {
      color: #FFFFFF !important;
    }

    .theme-dark .email-content {
      background-color: #181818 !important;
      color: #A7A7A7 !important;
    }

    .theme-dark .email-content p,
    .theme-dark .info-card,
    .theme-dark .details-table td.label {
      color: #A7A7A7 !important;
    }

    .theme-dark .info-card,
    .theme-dark .token-box {
      background-color: #282828 !important;
      border-color: rgba(29, 185, 84, 0.35) !important;
    }

    .theme-dark .footer {
      background-color: #282828 !important;
      border-top-color: #333333 !important;
      color: #A7A7A7 !important;
    }

    @media (prefers-color-scheme: dark) {
      body,
      .theme-auto {
        background-color: #121212;
        color: #A7A7A7;
      }

      .theme-auto .email-body {
        background-color: #121212;
      }

      .theme-auto .email-card {
        background-color: #181818;
        border-color: #282828;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
      }

      .theme-auto .email-header {
        background-color: #181818;
        border-bottom-color: #282828;
      }

      .theme-auto .email-title,
      .theme-auto .email-content p.lead,
      .theme-auto .section-title,
      .theme-auto .details-table td {
        color: #FFFFFF;
      }

      .theme-auto .email-content {
        background-color: #181818;
        color: #A7A7A7;
      }

      .theme-auto .email-content p,
      .theme-auto .info-card,
      .theme-auto .details-table td.label {
        color: #A7A7A7;
      }

      .theme-auto .info-card,
      .theme-auto .token-box {
        background-color: #282828;
        border-color: rgba(29, 185, 84, 0.35);
      }

      .theme-auto .footer {
        background-color: #282828;
        border-top-color: #333333;
        color: #A7A7A7;
      }

      .theme-auto .details-table td {
        border-color: #333333;
      }

      .theme-light,
      .theme-light .email-body {
        background-color: #ffffff;
        color: #6b6375;
      }

      .theme-light .email-card,
      .theme-light .email-header,
      .theme-light .email-content {
        background-color: #ffffff;
      }
    }
  </style>
`;

export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Verify your ILMA account</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body ${EMAIL_THEME_CLASS}">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body ${EMAIL_THEME_CLASS}">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <a href="${LOGO_LINK}" class="logo-link" target="_blank" rel="noopener">
                <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
              </a>
              <h1 class="email-title">Verify your ILMA account</h1>
            </td>
          </tr>

          <tr>
            <td class="email-content">
              <p class="lead">Hello {name},</p>
              <p>Thank you for signing up for ILMA. Use the verification token below to complete your registration.</p>
              <div class="email-panel">
                <div class="token-box">{verificationCode}</div>
              </div>
              <p>This token expires in 15 minutes for your security.</p>
              <p>If you did not create an ILMA account using {email}, you can safely ignore this email.</p>
              <p>Best regards,<br />ILMA Team</p>
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p>This is an automated message from ILMA. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Welcome to ILMA</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body ${EMAIL_THEME_CLASS}">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body ${EMAIL_THEME_CLASS}">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <a href="${LOGO_LINK}" class="logo-link" target="_blank" rel="noopener">
                <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
              </a>
              <h1 class="email-title">Welcome to ILMA</h1>
            </td>
          </tr>

          <tr>
            <td class="email-content">
              <p class="lead">Hello {name},</p>
              <p>Your ILMA account has been created successfully.</p>
              <p>You can now start exploring personalized software engineering course recommendations.</p>
              <div class="info-card">
                <p>Account email: <strong>{email}</strong></p>
              </div>
              <p>Best regards,<br />ILMA Team</p>
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p>This is an automated message from ILMA. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Reset your ILMA password</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body ${EMAIL_THEME_CLASS}">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body ${EMAIL_THEME_CLASS}">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <a href="${LOGO_LINK}" class="logo-link" target="_blank" rel="noopener">
                <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
              </a>
              <h1 class="email-title">Reset your password</h1>
            </td>
          </tr>

          <tr>
            <td class="email-content">
              <p class="lead">Hello {name},</p>
              <p>We received a request to reset the password for your ILMA account: <strong>{email}</strong>.</p>
              <p>Click the button below to choose a new password.</p>
              <div class="email-panel">
                <a href="{resetURL}" class="button">Reset password</a>
              </div>
              <p>This link expires in 1 hour for your security.</p>
              <p>If you did not request a password reset, you can safely ignore this email.</p>
              <p>Best regards,<br />ILMA Security Team</p>
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p>This is an automated security message from ILMA.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Your ILMA password was reset</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body ${EMAIL_THEME_CLASS}">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body ${EMAIL_THEME_CLASS}">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <a href="${LOGO_LINK}" class="logo-link" target="_blank" rel="noopener">
                <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
              </a>
              <h1 class="email-title">Password reset successful</h1>
            </td>
          </tr>

          <tr>
            <td class="email-content">
              <p class="lead">Hello {name},</p>
              <p>Your ILMA password was reset successfully.</p>
              <div class="info-card">
                <p>If this was you, no further action is needed.</p>
              </div>
              <h3 class="section-title">Reset details</h3>
              <table class="details-table">
                <tr>
                  <td class="label">Password changed at</td>
                  <td>{passwordChangedAt}</td>
                </tr>
                <tr>
                  <td class="label">IP Address</td>
                  <td>{ipAddress}</td>
                </tr>
                <tr>
                  <td class="label">Location</td>
                  <td>{location}</td>
                </tr>
                <tr>
                  <td class="label">Device</td>
                  <td>{device}</td>
                </tr>
              </table>
              <p>If you did not reset your password, please secure your account immediately.</p>
              <p>Best regards,<br />ILMA Security Team</p>
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p>This is an automated security message from ILMA.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const ACCOUNT_DELETION_CODE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Confirm your ILMA account deletion</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body ${EMAIL_THEME_CLASS}">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body ${EMAIL_THEME_CLASS}">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <a href="${LOGO_LINK}" class="logo-link" target="_blank" rel="noopener">
                <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
              </a>
              <h1 class="email-title">Confirm account deletion</h1>
            </td>
          </tr>

          <tr>
            <td class="email-content">
              <p class="lead">Hello {name},</p>
              <p>We received a request to delete your ILMA account: <strong>{email}</strong>.</p>
              <p>Use the verification code below to confirm this action.</p>
              <div class="email-panel">
                <div class="token-box">{verificationCode}</div>
              </div>
              <div class="info-card">
                <p>After confirmation, deletion is scheduled for <strong>{scheduledFor}</strong>.</p>
                <p>You can still undo the deletion before that date.</p>
              </div>
              <p>If this was not you, do not enter this code. Change your password and contact support.</p>
              <p>Best regards,<br />ILMA Security Team</p>
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p>This is an automated security message from ILMA.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const ACCOUNT_DELETION_UNDO_CODE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Undo your ILMA account deletion</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body ${EMAIL_THEME_CLASS}">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body ${EMAIL_THEME_CLASS}">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <a href="${LOGO_LINK}" class="logo-link" target="_blank" rel="noopener">
                <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
              </a>
              <h1 class="email-title">Undo account deletion</h1>
            </td>
          </tr>

          <tr>
            <td class="email-content">
              <p class="lead">Hello {name},</p>
              <p>We received a request to cancel the scheduled deletion for your ILMA account: <strong>{email}</strong>.</p>
              <p>Use the verification code below to undo the deletion.</p>
              <div class="email-panel">
                <div class="token-box">{verificationCode}</div>
              </div>
              <div class="info-card">
                <p>Entering this code will cancel the scheduled deletion and keep your account active.</p>
              </div>
              <p>If this was not you, you can safely ignore this email.</p>
              <p>Best regards,<br />ILMA Security Team</p>
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p>This is an automated security message from ILMA.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const CONTACT_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>New ILMA contact message</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body ${EMAIL_THEME_CLASS}">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body ${EMAIL_THEME_CLASS}">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <a href="${LOGO_LINK}" class="logo-link" target="_blank" rel="noopener">
                <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
              </a>
              <h1 class="email-title">New contact message</h1>
            </td>
          </tr>

          <tr>
            <td class="email-content">
              <p class="lead">A visitor sent a message through the ILMA contact form.</p>
              <table class="details-table">
                <tr>
                  <td class="label">Name</td>
                  <td>{name}</td>
                </tr>
                <tr>
                  <td class="label">Email</td>
                  <td>{email}</td>
                </tr>
              </table>
              <h3 class="section-title">Message</h3>
              <div class="info-card">
                <p>{message}</p>
              </div>
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p>This message was sent from the ILMA public contact form.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const CONTACT_REPLY_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Reply from ILMA</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body ${EMAIL_THEME_CLASS}">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body ${EMAIL_THEME_CLASS}">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <a href="${LOGO_LINK}" class="logo-link" target="_blank" rel="noopener">
                <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
              </a>
              <h1 class="email-title">Reply from ILMA</h1>
            </td>
          </tr>

          <tr>
            <td class="email-content">
              <p class="lead">Hello {name},</p>
              <p>Thank you for contacting ILMA. Our team replied to your message.</p>
              <h3 class="section-title">Our reply</h3>
              <div class="info-card">
                <p>{replyMessage}</p>
              </div>
              <h3 class="section-title">Your original message</h3>
              <div class="info-card">
                <p>{originalMessage}</p>
              </div>
              <p>You can reply directly to this email if you need more help.</p>
              <p>Best regards,<br />ILMA Support Team</p>
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p>This message was sent by the ILMA support team.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export default {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  ACCOUNT_DELETION_CODE_TEMPLATE,
  ACCOUNT_DELETION_UNDO_CODE_TEMPLATE,
  CONTACT_EMAIL_TEMPLATE,
  CONTACT_REPLY_EMAIL_TEMPLATE,
};
