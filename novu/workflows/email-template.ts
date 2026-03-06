export function renderEmailHtml(props: {
  subject: string;
  body: string;
}): string {
  const primaryColor = "#1d4ed8";
  const absoluteLogoUrl = 'https://mysportschool.com/logo.png';

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${props.subject}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f3f4f6;
          color: #1f2937;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
          background-color: #ffffff;
          padding: 32px 24px;
          text-align: center;
          border-bottom: 4px solid ${primaryColor};
        }
        .header img {
          max-height: 80px;
          width: auto;
        }
        .content {
          padding: 40px 32px;
          font-size: 16px;
          line-height: 1.6;
          color: #374151;
        }
        .content h1, .content h2 {
          color: #111827;
          margin-top: 0;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 32px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .button {
          display: inline-block;
          background-color: ${primaryColor};
          color: #ffffff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 24px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header with Logo -->
        <div class="header">
          <img src="${absoluteLogoUrl}" alt="MySportsSchool Logo" />
        </div>
        
        <!-- Main Content -->
        <div class="content">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #111827;">${props.subject}</h2>
          ${props.body}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>© ${new Date().getFullYear()} MySportsSchool. Tüm hakları saklıdır.</p>
          <p>
            Bu e-postayı size ait bir işlem sonucunda otomatik olarak aldınız. <br>
            Cevaplamak için info@mysportschool.com adresini kullanabilirsiniz.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
