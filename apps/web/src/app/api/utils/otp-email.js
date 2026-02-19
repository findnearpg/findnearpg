import nodemailer from 'nodemailer';

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    configured: Boolean(host && port && user && pass && from),
  };
}

function buildOtpTemplate({ otp, ownerName, purpose = 'signup' }) {
  const greeting = ownerName ? `Hi ${ownerName},` : 'Hi there,';
  const purposeCopy =
    purpose === 'password-reset'
      ? 'Use this OTP to reset your FindNearPG owner account password:'
      : 'Use the following OTP to complete your owner account signup:';
  const heading =
    purpose === 'password-reset' ? 'FindNearPG Password Reset' : 'FindNearPG Owner Verification';
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f7fafc; padding: 24px;">
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f8f8b, #0c6764); color: #fff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800;">${heading}</h2>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px;">${greeting}</p>
        <p style="font-size: 15px; color: #334155; margin: 0 0 16px;">
          ${purposeCopy}
        </p>
        <div style="font-size: 32px; letter-spacing: 8px; font-weight: 800; color: #073735; background: #f1f9f9; border: 1px dashed #0f8f8b; padding: 16px; border-radius: 12px; text-align: center;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">
          This OTP is valid for 10 minutes. If you did not request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  </div>
  `;
}

function buildAdminOtpTemplate({ otp, adminName }) {
  const greeting = adminName ? `Hi ${adminName},` : 'Hi Admin,';
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f7fafc; padding: 24px;">
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #073735, #0c6764); color: #fff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800;">FindNearPG Admin Security OTP</h2>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px;">${greeting}</p>
        <p style="font-size: 15px; color: #334155; margin: 0 0 16px;">
          Use this OTP to complete your admin login:
        </p>
        <div style="font-size: 32px; letter-spacing: 8px; font-weight: 800; color: #073735; background: #f1f9f9; border: 1px dashed #0f8f8b; padding: 16px; border-radius: 12px; text-align: center;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">
          This OTP is valid for 10 minutes and can be used only once. If you did not request this login, secure your account immediately.
        </p>
      </div>
    </div>
  </div>
  `;
}

export async function sendOwnerSignupOtpEmail({ email, otp, ownerName }) {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return { ok: false, error: 'SMTP is not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to: email,
      subject: 'Your FindNearPG OTP for Owner Signup',
      html: buildOtpTemplate({ otp, ownerName, purpose: 'signup' }),
    });

    return { ok: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    return { ok: false, error: 'Failed to send OTP email' };
  }
}

function buildUserOtpTemplate({ otp, userName }) {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f7fafc; padding: 24px;">
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f8f8b, #0c6764); color: #fff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800;">FindNearPG User Verification</h2>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px;">${greeting}</p>
        <p style="font-size: 15px; color: #334155; margin: 0 0 16px;">
          Use this OTP to complete your user account registration:
        </p>
        <div style="font-size: 32px; letter-spacing: 8px; font-weight: 800; color: #073735; background: #f1f9f9; border: 1px dashed #0f8f8b; padding: 16px; border-radius: 12px; text-align: center;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">
          This OTP is valid for 10 minutes. If you did not request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  </div>
  `;
}

export async function sendUserSignupOtpEmail({ email, otp, userName }) {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return { ok: false, error: 'SMTP is not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to: email,
      subject: 'Your FindNearPG OTP for User Signup',
      html: buildUserOtpTemplate({ otp, userName }),
    });

    return { ok: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    return { ok: false, error: 'Failed to send OTP email' };
  }
}

export async function sendOwnerPasswordResetOtpEmail({ email, otp, ownerName }) {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return { ok: false, error: 'SMTP is not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to: email,
      subject: 'Your FindNearPG OTP for Password Reset',
      html: buildOtpTemplate({ otp, ownerName, purpose: 'password-reset' }),
    });

    return { ok: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    return { ok: false, error: 'Failed to send OTP email' };
  }
}

export async function sendAdminSigninOtpEmail({ email, otp, adminName }) {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return { ok: false, error: 'SMTP is not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to: email,
      subject: 'Your FindNearPG Admin Login OTP',
      html: buildAdminOtpTemplate({ otp, adminName }),
    });

    return { ok: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    return { ok: false, error: 'Failed to send OTP email' };
  }
}

function buildOwnerListingStatusTemplate({ ownerName, propertyTitle, statusLabel, reason }) {
  const greeting = ownerName ? `Hi ${ownerName},` : 'Hi Owner,';
  const reasonBlock = reason
    ? `<p style="font-size: 14px; color: #334155; margin: 12px 0 0;"><strong>Reason:</strong> ${reason}</p>`
    : '';
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f7fafc; padding: 24px;">
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #073735, #0c6764); color: #fff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800;">Listing Status Update</h2>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 10px;">${greeting}</p>
        <p style="font-size: 14px; color: #334155; margin: 0;">
          Your listing <strong>${propertyTitle}</strong> has been updated to:
        </p>
        <p style="margin: 12px 0; display: inline-block; background: #eef6ff; color: #1d4ed8; padding: 8px 12px; border-radius: 999px; font-weight: 700;">
          ${statusLabel}
        </p>
        ${reasonBlock}
        <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">
          You can check full details in your owner dashboard notifications section.
        </p>
      </div>
    </div>
  </div>
  `;
}

export async function sendOwnerListingStatusEmail({
  email,
  ownerName,
  propertyTitle,
  statusLabel,
  reason,
}) {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return { ok: false, error: 'SMTP is not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to: email,
      subject: `FindNearPG Listing Update: ${statusLabel}`,
      html: buildOwnerListingStatusTemplate({ ownerName, propertyTitle, statusLabel, reason }),
    });

    return { ok: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    return { ok: false, error: 'Failed to send status email' };
  }
}

function buildOwnerVerificationStatusTemplate({ ownerName, statusLabel, reason }) {
  const greeting = ownerName ? `Hi ${ownerName},` : 'Hi Owner,';
  const reasonBlock = reason
    ? `<p style="font-size: 14px; color: #334155; margin: 12px 0 0;"><strong>Reason:</strong> ${reason}</p>`
    : '';
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f7fafc; padding: 24px;">
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #073735, #0c6764); color: #fff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800;">Owner Verification Status</h2>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 10px;">${greeting}</p>
        <p style="font-size: 14px; color: #334155; margin: 0;">
          Your owner account verification status is:
        </p>
        <p style="margin: 12px 0; display: inline-block; background: #eef6ff; color: #1d4ed8; padding: 8px 12px; border-radius: 999px; font-weight: 700;">
          ${statusLabel}
        </p>
        ${reasonBlock}
        <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">
          You can check details from Owner Dashboard → Account Settings.
        </p>
      </div>
    </div>
  </div>
  `;
}

export async function sendOwnerVerificationStatusEmail({ email, ownerName, statusLabel, reason }) {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return { ok: false, error: 'SMTP is not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to: email,
      subject: `FindNearPG Owner Verification: ${statusLabel}`,
      html: buildOwnerVerificationStatusTemplate({ ownerName, statusLabel, reason }),
    });

    return { ok: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    return { ok: false, error: 'Failed to send verification status email' };
  }
}

function buildOwnerHelpQueryTemplate({
  ownerName,
  ownerEmail,
  ownerMobile,
  subject,
  category,
  message,
}) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f7fafc; padding: 24px;">
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f8f8b, #0c6764); color: #fff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800;">Owner Help Request</h2>
      </div>
      <div style="padding: 20px 24px;">
        <p style="margin: 0 0 12px; color: #334155;"><strong>Owner:</strong> ${ownerName || '-'}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Email:</strong> ${ownerEmail || '-'}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Mobile:</strong> ${ownerMobile || '-'}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Category:</strong> ${category || 'general'}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Subject:</strong> ${subject || '-'}</p>
        <div style="margin-top: 14px; padding: 14px; background: #f8fffe; border: 1px solid #d7ecea; border-radius: 10px;">
          <p style="margin: 0; color: #0f172a; white-space: pre-wrap;">${message || '-'}</p>
        </div>
      </div>
    </div>
  </div>`;
}

export async function sendOwnerHelpQueryEmail({
  ownerName,
  ownerEmail,
  ownerMobile,
  subject,
  category,
  message,
  to = 'Findnearpg@gmail.com',
}) {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return { ok: false, error: 'SMTP is not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to,
      replyTo: ownerEmail || undefined,
      subject: `Owner Help: ${subject || 'New Query'}`,
      html: buildOwnerHelpQueryTemplate({
        ownerName,
        ownerEmail,
        ownerMobile,
        subject,
        category,
        message,
      }),
    });
    return { ok: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    return { ok: false, error: 'Failed to send help request email' };
  }
}

function buildUserHelpQueryTemplate({
  userName,
  userEmail,
  userMobile,
  subject,
  category,
  message,
}) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f7fafc; padding: 24px;">
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f8f8b, #0c6764); color: #fff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800;">User Support Request</h2>
      </div>
      <div style="padding: 20px 24px;">
        <p style="margin: 0 0 12px; color: #334155;"><strong>User:</strong> ${userName || '-'}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Email:</strong> ${userEmail || '-'}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Mobile:</strong> ${userMobile || '-'}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Category:</strong> ${category || 'general'}</p>
        <p style="margin: 0 0 12px; color: #334155;"><strong>Subject:</strong> ${subject || '-'}</p>
        <div style="margin-top: 14px; padding: 14px; background: #f8fffe; border: 1px solid #d7ecea; border-radius: 10px;">
          <p style="margin: 0; color: #0f172a; white-space: pre-wrap;">${message || '-'}</p>
        </div>
      </div>
    </div>
  </div>`;
}

export async function sendUserHelpQueryEmail({
  userName,
  userEmail,
  userMobile,
  subject,
  category,
  message,
  to = 'Findnearpg@gmail.com',
}) {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return { ok: false, error: 'SMTP is not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to,
      replyTo: userEmail || undefined,
      subject: `User Support: ${subject || 'New Query'}`,
      html: buildUserHelpQueryTemplate({
        userName,
        userEmail,
        userMobile,
        subject,
        category,
        message,
      }),
    });
    return { ok: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    return { ok: false, error: 'Failed to send support request email' };
  }
}
