import nodemailer from "nodemailer";

function getEmailConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !port || !from) {
    return null;
  }

  return {
    host,
    port,
    auth: user && pass ? { user, pass } : undefined,
    from,
  };
}

const transporter = (() => {
  const config = getEmailConfig();

  if (config) {
    const { host, port, auth } = config;
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth,
    });
  }

  if (process.env.NODE_ENV !== "production") {
    // Dev fallback: log email payload instead of throwing
    console.warn(
      "Email transport not configured; using jsonTransport for local development."
    );
    return nodemailer.createTransport({ jsonTransport: true });
  }

  console.warn("Email transport not initialized: missing SMTP settings.");
  return null;
})();

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  if (!transporter) {
    throw new Error(
      "Email transport is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM."
    );
  }

  const from = getEmailConfig()?.from || "SkinTrack <no-reply@localhost>";

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Reset your SkinTrack password",
    text: [
      "You requested a password reset for your SkinTrack account.",
      "If you did not make this request, you can safely ignore this email.",
      "",
      "To reset your password, click the link below:",
      resetUrl,
      "",
      "This link will expire in 1 hour.",
    ].join("\n"),
    html: `
      <p>You requested a password reset for your SkinTrack account.</p>
      <p>If you did not make this request, you can safely ignore this email.</p>
      <p>
        <a href="${resetUrl}" target="_blank" rel="noreferrer">
          Reset your password
        </a>
      </p>
      <p>This link will expire in 1 hour.</p>
    `,
  });

  if (info?.message && process.env.NODE_ENV !== "production") {
    console.info("Password reset email (dev):", info.message.toString());
  }
}
