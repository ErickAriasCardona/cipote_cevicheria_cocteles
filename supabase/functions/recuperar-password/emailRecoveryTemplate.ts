interface GenerarEmailRecuperacionParams {
  nombreCompleto?: string
  email: string
  actionLink: string
  logoUrl?: string
}

export function generarEmailRecuperacionHtml({
  nombreCompleto,
  email,
  actionLink,
  logoUrl = 'https://cipote-ceviche-cocteles.vercel.app/logo.jpeg',
}: GenerarEmailRecuperacionParams): string {
  const saludo = nombreCompleto ? `¡Hola, ${nombreCompleto}! 👋` : '¡Hola! 👋'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña — Cipote Ceviche Cocteles</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; }
    table { border-collapse: collapse; }
    a { color: #41AFE0; text-decoration: none; }
    .btn-recuperar:hover { background-color: #0284C7 !important; }
  </style>
</head>
<body style="margin: 0; padding: 30px 10px; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 45, 80, 0.08); border: 1px solid #E2E8F0;" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header Navy Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #071524 0%, #002D50 60%, #1a4f78 100%); padding: 36px 30px 32px; text-align: center;">
              <!-- Logo Brand -->
              <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 14px;">
                <tr>
                  <td style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #E42926, #41AFE0); padding: 3px; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
                    <img src="${logoUrl}" alt="Cipote Logo" width="66" height="66" style="border-radius: 50%; display: block; object-fit: cover; border: 2px solid #ffffff; background: #fff;" />
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Cipote Ceviche Cocteles
              </h1>
              <p style="margin: 6px 0 0; color: #93C5FD; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">
                Recuperación de Contraseña
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 34px 30px;">
              
              <h2 style="margin: 0 0 12px; color: #002D50; font-size: 21px; font-weight: 800; line-height: 1.3;">
                ${saludo}
              </h2>

              <p style="margin: 0 0 18px; font-size: 14.5px; line-height: 1.6; color: #475569;">
                Hemos recibido una solicitud para restablecer la contraseña asociada a tu cuenta <strong>${email}</strong> en la plataforma de <strong>Cipote Ceviche Cocteles</strong>.
              </p>

              <p style="margin: 0 0 24px; font-size: 14.5px; line-height: 1.6; color: #475569;">
                Para elegir una nueva contraseña de acceso, haz clic en el siguiente botón:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${actionLink}" target="_blank" class="btn-recuperar" style="display: inline-block; background: linear-gradient(135deg, #0284C7, #002D50); color: #FFFFFF; font-size: 15px; font-weight: 800; padding: 14px 34px; border-radius: 12px; text-decoration: none; box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35); letter-spacing: 0.2px;">
                      Restablecer mi contraseña →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning Callout -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-left: 4px solid #41AFE0; border-radius: 0 10px 10px 0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #334155; line-height: 1.5;">
                    🔒 <strong>Aviso de seguridad:</strong> Este enlace es de un solo uso. Si tú no realizaste esta solicitud, puedes ignorar este correo; tu contraseña actual continuará siendo la misma.
                  </td>
                </tr>
              </table>

              <!-- Link Fallback -->
              <p style="margin: 20px 0 0; font-size: 12px; color: #94A3B8; line-height: 1.5; word-break: break-all;">
                Si el botón no abre directamente, copia y pega el siguiente enlace en tu navegador:<br>
                <a href="${actionLink}" style="color: #41AFE0; font-size: 11.5px;">${actionLink}</a>
              </p>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #07131F; padding: 24px 30px; text-align: center; border-top: 1px solid #1E293B;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #FFFFFF;">
                Cipote Ceviche Cocteles
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: #94A3B8;">
                📍 Avenida Guabinal No. 51-53, Mercacentro N°4 · Ibagué, Tolima
              </p>
              <p style="margin: 0 0 12px; font-size: 12px; color: #94A3B8;">
                📞 Contacto: <strong>311 230 2233</strong> · De domingo a domingo: 1:30 PM – 8:30 PM
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Este es un mensaje automático de seguridad. Por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
