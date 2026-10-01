import nodemailer from 'nodemailer';

// Create Nodemailer Transporter
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS not configured in .env. Email notifications will be logged to console in dev mode.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || `"FoodLink System" <noreply@foodlink.org>`;

    if (!transporter) {
      console.log(`\n📧 [DEV EMAIL MOCK]\nTo: ${to}\nSubject: ${subject}\nText: ${text || 'HTML email content'}\n`);
      return { success: true, mocked: true };
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent successfully to ${to} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Base HTML Template Wrapper
const getHtmlTemplate = (title, content, actionUrl, actionText) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #059669; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; line-height: 1.6; font-size: 15px; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 20px; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FoodLink</h1>
    </div>
    <div class="content">
      <h2 style="color: #0f172a; margin-top: 0;">${title}</h2>
      ${content}
      ${actionUrl ? `<div style="text-align: center; margin-top: 28px;"><a href="${actionUrl}" class="btn">${actionText || 'View Details'}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FoodLink — Smart Surplus Food Redistribution System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// Helper Exported Functions
export const sendRegistrationSuccessEmail = async (user) => {
  const title = `Welcome to FoodLink, ${user.name}!`;
  const content = `
    <p>Thank you for registering as a <strong>${user.role?.toUpperCase()}</strong> on FoodLink.</p>
    <p>Together, we are bridging the gap between food surplus and hunger alleviation through real-time donation tracking and efficient logisics.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: 'Welcome to FoodLink!',
    html: getHtmlTemplate(title, content, `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`, 'Log In to Account'),
  });
};

export const sendDonationCreatedEmail = async (donor, donation) => {
  const title = 'Donation Published Successfully';
  const content = `
    <p>Hi ${donor.name},</p>
    <p>Your food donation <strong>"${donation.title}"</strong> (${donation.quantity} ${donation.unit}) has been posted successfully and is now visible to verified NGOs in your area.</p>
  `;
  return sendEmail({
    to: donor.email,
    subject: `Donation Created: ${donation.title}`,
    html: getHtmlTemplate(title, content, `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/donations/${donation._id}`, 'View Donation'),
  });
};

export const sendDonationAcceptedEmail = async (donor, ngo, donation) => {
  const title = 'Your Donation Has Been Claimed!';
  const content = `
    <p>Great news, ${donor.name}!</p>
    <p><strong>${ngo.name}</strong> has claimed your food donation <strong>"${donation.title}"</strong>.</p>
    <p>A volunteer driver will be dispatched shortly to pick up the items within your scheduled window.</p>
  `;
  return sendEmail({
    to: donor.email,
    subject: `Donation Claimed by ${ngo.name}`,
    html: getHtmlTemplate(title, content, `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/donations/${donation._id}`, 'Track Progress'),
  });
};

export const sendVolunteerAssignedEmail = async (volunteer, donation, ngo) => {
  const title = 'New Delivery Task Assigned';
  const content = `
    <p>Hi ${volunteer.name},</p>
    <p>You have been assigned to transport food donation <strong>"${donation.title}"</strong> for <strong>${ngo.name}</strong>.</p>
    <p>Please check your delivery dashboard for pickup location details and schedules.</p>
  `;
  return sendEmail({
    to: volunteer.email,
    subject: `New Task Assigned: ${donation.title}`,
    html: getHtmlTemplate(title, content, `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/volunteer/deliveries`, 'View Task'),
  });
};

export const sendDeliveryCompletedEmail = async (recipient, donation, isDonor = true) => {
  const title = 'Food Delivery Completed!';
  const content = `
    <p>Hi ${recipient.name},</p>
    <p>Food donation <strong>"${donation.title}"</strong> has been successfully delivered and verified.</p>
    <p>${isDonor ? 'Thank you for your generous contribution in combating food waste!' : 'We hope this surplus food aids your organization in serving the community.'}</p>
  `;
  return sendEmail({
    to: recipient.email,
    subject: `Delivery Completed: ${donation.title}`,
    html: getHtmlTemplate(title, content, `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/donations/${donation._id}`, 'View Summary'),
  });
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  const title = 'Password Reset Request';
  const content = `
    <p>Hi ${user.name},</p>
    <p>We received a request to reset your FoodLink password. Click the button below to specify a new password. This link is valid for 1 hour.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: 'FoodLink Password Reset',
    html: getHtmlTemplate(title, content, resetUrl, 'Reset Password'),
  });
};

export default {
  sendEmail,
  sendRegistrationSuccessEmail,
  sendDonationCreatedEmail,
  sendDonationAcceptedEmail,
  sendVolunteerAssignedEmail,
  sendDeliveryCompletedEmail,
  sendPasswordResetEmail,
};
