const LOGO_URL = 'https://res.cloudinary.com/dvepf4xdm/image/upload/q_auto/f_auto/v1780761755/logo_qnlxxo.png';

const EMAIL_STYLE = `
  <style>
    :root {
      color-scheme: light dark;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #f4f7fb;
      color: #1f2937;
      font-family: Arial, Helvetica, sans-serif;
    }

    .email-body {
      width: 100%;
      background-color: #f4f7fb;
      padding: 24px 0;
    }

    .email-card {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
    }

    .email-header {
      padding: 28px 24px 20px;
      text-align: center;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }

    .logo {
      width: 140px;
      max-width: 180px;
      height: auto;
      display: block;
      margin: 0 auto 14px;
    }

    .email-title {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
    }

    .email-content {
      padding: 32px 28px;
      color: #334155;
      background-color: #ffffff;
    }

    .email-content p {
      margin: 0 0 18px;
      font-size: 15px;
      line-height: 1.7;
    }

    .email-content p.lead {
      font-size: 16px;
      color: #0f172a;
    }

    .email-panel {
      margin: 28px 0;
      text-align: center;
    }

    .token-box {
      display: inline-block;
      padding: 16px 24px;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      color: #1d4ed8;
      font-size: 30px;
      letter-spacing: 6px;
      font-weight: 700;
    }

    .info-card {
      margin: 24px 0;
      padding: 16px 18px;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      color: #475569;
    }

    .button {
      display: inline-block;
      background-color: #dc2626;
      color: #ffffff;
      text-decoration: none;
      padding: 13px 22px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
    }

    .footer {
      padding: 18px 24px;
      text-align: center;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      color: #64748b;
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
      border: 1px solid #e5e7eb;
    }

    .details-table td.label {
      color: #64748b;
      width: 38%;
    }

    @media (prefers-color-scheme: dark) {
      body {
        background-color: #040617;
        color: #d1d5db;
      }

      .email-body {
        background-color: #040617;
      }

      .email-card {
        background-color: #0f172a;
        border-color: #334155;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
      }

      .email-header {
        background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      }

      .email-title {
        color: #eef2ff;
      }

      .email-content {
        background-color: #111827;
        color: #cbd5e1;
      }

      .email-content p {
        color: #cbd5e1;
      }

      .info-card {
        background-color: #111827;
        border-color: #334155;
        color: #cbd5e1;
      }

      .footer {
        background-color: #0b1220;
        color: #94a3b8;
      }

      .details-table td {
        border-color: #334155;
        color: #e2e8f0;
      }

      .token-box {
        background-color: #1e293b;
        border-color: #334155;
        color: #93c5fd;
      }

      .button {
        background-color: #ef4444;
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
  <title>Verify your ILMA account</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <img src="https://res.cloudinary.com/dvepf4xdm/image/upload/q_auto/f_auto/v1780761755/logo_qnlxxo.png" alt="ILMA logo" class="logo" />
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
  <title>Welcome to ILMA</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
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
  <title>Reset your ILMA password</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
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
  <title>Your ILMA password was reset</title>
  ${EMAIL_STYLE}
</head>
<body class="email-body">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" class="email-card">
          <tr>
            <td class="email-header">
              <img src="${LOGO_URL}" alt="ILMA logo" class="logo" />
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
              <h3 style="font-size:16px; margin:24px 0 12px; color:#111827;">Reset details</h3>
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

export default {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
};