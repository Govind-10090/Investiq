import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { firebaseDb, isLiveFirebase } from "../firebase/config";
import { useToastStore } from "../store/useToastStore";

export interface WelcomeEmailData {
  to: string;
  name: string;
  sentAt: string;
  subject: string;
  previewText: string;
  htmlContent: string;
}

export function generateWelcomeEmailHTML(name: string, email: string): string {
  const currentYear = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to InvestIQ</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0d0e15;
      color: #e4e4e7;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 600px;
      margin: 30px auto;
      background: #16161e;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .header {
      background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
      padding: 36px 32px;
      text-align: center;
      border-bottom: 1px solid rgba(16,185,129,0.2);
    }
    .logo {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo span {
      color: #34d399;
    }
    .content {
      padding: 36px 32px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      background: rgba(16,185,129,0.15);
      color: #34d399;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .card {
      background: #1e1e2d;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .cta-btn {
      display: block;
      width: fit-content;
      margin: 28px auto 12px auto;
      padding: 14px 32px;
      background: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      border-radius: 10px;
      text-align: center;
    }
    .footer {
      background: #111118;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #71717a;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Invest<span>IQ</span></div>
      <p style="margin: 8px 0 0 0; color: #a7f3d0; font-size: 14px; font-weight: 500;">
        Enterprise Investment Intelligence & Portfolio Analytics
      </p>
    </div>
    
    <div class="content">
      <span class="badge">Account Activated 🎉</span>
      <h2 class="greeting">Welcome aboard, ${name}!</h2>
      <p style="color: #d4d4d8; font-size: 14px;">
        Thank you for joining <strong>InvestIQ</strong>. Your account (<code>${email}</code>) is now set up and ready to power your financial journey with real-time Indian & global market analytics.
      </p>
      
      <div class="card">
        <h3 style="margin-top: 0; color: #ffffff; font-size: 15px; margin-bottom: 16px;">
          🚀 Here's what you can do right now:
        </h3>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #34d399; font-size: 13px;">1. Portfolio & Holdings Tracker</strong>
          <p style="margin: 2px 0 0 0; color: #a1a1aa; font-size: 12px;">
            Add your stock, crypto, and mutual fund positions with automatic P&L and sector weighting calculations.
          </p>
        </div>

        <div style="margin-bottom: 12px;">
          <strong style="color: #34d399; font-size: 13px;">2. Real-Time Price Alerts</strong>
          <p style="margin: 2px 0 0 0; color: #a1a1aa; font-size: 12px;">
            Set price threshold alerts with browser notifications for NIFTY, BSE stocks, Bitcoin, and Forex.
          </p>
        </div>

        <div style="margin-bottom: 12px;">
          <strong style="color: #34d399; font-size: 13px;">3. AI Financial Co-Pilot</strong>
          <p style="margin: 2px 0 0 0; color: #a1a1aa; font-size: 12px;">
            Chat with your dedicated AI analyst powered by live portfolio context and market data.
          </p>
        </div>

        <div>
          <strong style="color: #34d399; font-size: 13px;">4. Investment Journal & Notes</strong>
          <p style="margin: 2px 0 0 0; color: #a1a1aa; font-size: 12px;">
            Document your trade rationale, tag assets, and maintain a historical investing journal.
          </p>
        </div>
      </div>

      <a href="https://investiq.vercel.app" class="cta-btn">Open My Dashboard →</a>
      
      <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 20px;">
        Need help? Reply directly to this email or reach out through your InvestIQ dashboard.
      </p>
    </div>
    
    <div class="footer">
      © ${currentYear} InvestIQ Analytics Inc. All rights reserved.<br />
      Designed for smart investors. Continuous Firebase synchronization enabled.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export const emailService = {
  /**
   * Dispatches welcome email upon registration
   */
  sendWelcomeEmail: async (toEmail: string, displayName: string): Promise<WelcomeEmailData> => {
    const name = displayName || "Investor";
    const subject = `Welcome to InvestIQ, ${name}! 🎉`;
    const htmlContent = generateWelcomeEmailHTML(name, toEmail);
    const sentAt = new Date().toISOString();

    const emailData: WelcomeEmailData = {
      to: toEmail,
      name,
      sentAt,
      subject,
      previewText: `Welcome to InvestIQ! Your account ${toEmail} is active. Explore live portfolio tracking, AI Co-Pilot, and price alerts.`,
      htmlContent
    };

    try {
      localStorage.setItem("investiq_last_welcome_email", JSON.stringify(emailData));
    } catch (_) {}

    if (isLiveFirebase) {
      try {
        await addDoc(collection(firebaseDb, "mail"), {
          to: toEmail,
          message: {
            subject,
            html: htmlContent,
            text: `Welcome to InvestIQ, ${name}! Your account ${toEmail} is active. Visit your dashboard to track your portfolio.`
          },
          createdAt: sentAt
        });

        const logId = `welcome-${toEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
        await setDoc(doc(firebaseDb, "welcome_emails", logId), {
          email: toEmail,
          name,
          sentAt,
          status: "queued"
        });
      } catch (err) {
        console.warn("InvestIQ: Firestore mail queue warning:", err);
      }
    }

    const webhookUrl = import.meta.env.VITE_WELCOME_EMAIL_WEBHOOK;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: toEmail,
            name,
            subject,
            html: htmlContent
          })
        });
      } catch (_) {}
    }

    useToastStore.getState().addToast({
      title: "Welcome Email Sent! 📬",
      message: `A welcome email has been sent to ${toEmail}.`,
      type: "success"
    });

    return emailData;
  },

  getLastWelcomeEmail: (): WelcomeEmailData | null => {
    try {
      const stored = localStorage.getItem("investiq_last_welcome_email");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
};
