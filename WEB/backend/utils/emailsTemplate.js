export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your ILMA account</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#2563eb; padding:28px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Verify your ILMA account</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px; font-size:16px;">Hello {name},</p>

              <p style="margin:0 0 18px; font-size:15px; line-height:1.6;">
                Thank you for signing up for ILMA. Use the verification token below to complete your registration.
              </p>

              <div style="margin:28px 0; text-align:center;">
                <div style="display:inline-block; padding:16px 24px; background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;">
                  <span style="font-size:30px; letter-spacing:6px; font-weight:700; color:#1d4ed8;">{verificationCode}</span>
                </div>
              </div>

              <p style="margin:0 0 12px; font-size:14px; line-height:1.6;">
                This token expires in 15 minutes for your security.
              </p>

              <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#4b5563;">
                If you did not create an ILMA account using {email}, you can safely ignore this email.
              </p>

              <p style="margin:0; font-size:15px;">
                Best regards,<br />
                ILMA Team
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 24px; background-color:#f9fafb; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#6b7280;">
                This is an automated message from ILMA. Please do not reply to this email.
              </p>
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
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#2563eb; padding:28px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Welcome to ILMA</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px; font-size:16px;">Hello {name},</p>

              <p style="margin:0 0 18px; font-size:15px; line-height:1.6;">
                Your ILMA account has been created successfully.
              </p>

              <p style="margin:0 0 18px; font-size:15px; line-height:1.6;">
                You can now start exploring personalized software engineering course recommendations.
              </p>

              <div style="margin:24px 0; padding:14px 18px; background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:10px;">
                <p style="margin:0; font-size:14px; color:#4b5563;">
                  Account email: <strong style="color:#111827;">{email}</strong>
                </p>
              </div>

              <p style="margin:0; font-size:15px;">
                Best regards,<br />
                ILMA Team
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 24px; background-color:#f9fafb; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#6b7280;">
                This is an automated message from ILMA. Please do not reply to this email.
              </p>
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
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#dc2626; padding:28px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Reset your password</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px; font-size:16px;">Hello {name},</p>

              <p style="margin:0 0 18px; font-size:15px; line-height:1.6;">
                We received a request to reset the password for your ILMA account: <strong>{email}</strong>.
              </p>

              <p style="margin:0 0 24px; font-size:15px; line-height:1.6;">
                Click the button below to choose a new password.
              </p>

              <div style="text-align:center; margin:28px 0;">
                <a href="{resetURL}" style="display:inline-block; background-color:#dc2626; color:#ffffff; text-decoration:none; padding:13px 22px; border-radius:8px; font-size:15px; font-weight:700;">
                  Reset password
                </a>
              </div>

              <p style="margin:0 0 12px; font-size:14px; line-height:1.6;">
                This link expires in 1 hour for your security.
              </p>

              <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#4b5563;">
                If you did not request a password reset, you can safely ignore this email.
              </p>

              <p style="margin:0; font-size:15px;">
                Best regards,<br />
                ILMA Security Team
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 24px; background-color:#f9fafb; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#6b7280;">
                This is an automated security message from ILMA.
              </p>
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
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
          
          <tr>
            <td style="background:#16a34a; padding:28px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px;">Password reset successful</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;">
              <p style="font-size:16px; margin:0 0 16px;">Hello {name},</p>

              <p style="font-size:15px; line-height:1.6; margin:0 0 18px;">
                Your ILMA password was reset successfully.
              </p>

              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px 18px; margin:24px 0;">
                <p style="margin:0; color:#166534; font-size:14px;">
                  If this was you, no further action is needed.
                </p>
              </div>

              <h3 style="font-size:16px; margin:24px 0 12px; color:#111827;">Reset details</h3>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
                <tr>
                  <td style="padding:10px; border:1px solid #e5e7eb; color:#6b7280;">Password changed at</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">{passwordChangedAt}</td>
                </tr>
                <tr>
                  <td style="padding:10px; border:1px solid #e5e7eb; color:#6b7280;">IP Address</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">{ipAddress}</td>
                </tr>
                <tr>
                  <td style="padding:10px; border:1px solid #e5e7eb; color:#6b7280;">Location</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">{location}</td>
                </tr>
                <tr>
                  <td style="padding:10px; border:1px solid #e5e7eb; color:#6b7280;">Device</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">{device}</td>
                </tr>
              </table>

              <p style="font-size:14px; line-height:1.6; color:#4b5563; margin:24px 0 0;">
                If you did not reset your password, please secure your account immediately.
              </p>

              <p style="font-size:15px; margin:24px 0 0;">
                Best regards,<br />
                ILMA Security Team
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 24px; background:#f9fafb; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#6b7280;">
                This is an automated security message from ILMA.
              </p>
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