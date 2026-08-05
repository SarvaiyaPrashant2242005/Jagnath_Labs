/**
 * @file email.service.js
 * @description Nodemailer email transport service for credentials welcome mail and Forgot Password OTP.
 */
const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * Send Welcome Email to newly created user with login credentials.
 */
const sendWelcomeEmail = async ({ to, name, email, password, role }) => {
    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your_email')) {
        console.log(`[SMTP Notice] Skipped sending welcome email to ${to} (SMTP credentials not configured in .env). Credentials: ${email} / ${password}`);
        return false;
    }

    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.SMTP_FROM || `"Jagnath Labs" <${process.env.SMTP_USER}>`,
            to: to,
            subject: 'Welcome to Jagnath Labs - Your Account Credentials',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #22c55e;">
                        <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Welcome to Jagnath Labs!</h1>
                        <p style="color: #64748b; margin-top: 5px;">Your user account has been successfully created.</p>
                    </div>

                    <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
                        <p>Hello <strong>${name}</strong>,</p>
                        <p>An administrator has registered your account on the <strong>Jagnath Labs Portal</strong>. Below are your account access credentials:</p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #22c55e; padding: 15px 20px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 4px 0;"><strong>Role:</strong> ${role || 'User'}</p>
                            <p style="margin: 4px 0;"><strong>Email Address:</strong> <span style="color: #2563eb;">${email}</span></p>
                            <p style="margin: 4px 0;"><strong>Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #0f172a;">${password}</span></p>
                        </div>

                        <p style="color: #ef4444; font-size: 0.875rem;"><strong>Important:</strong> For security reasons, please log in and change your password upon your first access.</p>
                    </div>

                    <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Jagnath Labs. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP Success] Welcome email sent to ${to} (MessageId: ${info.messageId})`);
        return true;
    } catch (error) {
        console.error('[SMTP Error] Failed to send welcome email:', error.message);
        return false;
    }
};

/**
 * Send Forgot Password OTP email.
 */
const sendOtpEmail = async ({ to, name, otp }) => {
    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your_email')) {
        console.log(`[SMTP Notice] Skipped sending OTP email to ${to} (SMTP credentials not configured in .env). Generated OTP: ${otp}`);
        return false;
    }

    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.SMTP_FROM || `"Jagnath Labs" <${process.env.SMTP_USER}>`,
            to: to,
            subject: 'Password Reset Verification Code - Jagnath Labs',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #2563eb;">
                        <h2 style="color: #0f172a; margin: 0;">Password Reset Request</h2>
                    </div>

                    <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
                        <p>Hello <strong>${name || 'User'}</strong>,</p>
                        <p>We received a request to reset your password for your Jagnath Labs account. Use the 6-digit OTP code below to verify your identity:</p>
                        
                        <div style="text-align: center; margin: 25px 0;">
                            <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb; background: #eff6ff; padding: 10px 24px; border-radius: 8px; border: 1px dashed #bfdbfe; display: inline-block;">
                                ${otp}
                            </span>
                        </div>

                        <p style="font-size: 0.875rem; color: #64748b; text-align: center;">This OTP code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
                    </div>

                    <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Jagnath Labs</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP Success] OTP email sent to ${to} (MessageId: ${info.messageId})`);
        return true;
    } catch (error) {
        console.error('[SMTP Error] Failed to send OTP email:', error.message);
        return false;
    }
};

/**
 * Send Document Email (TRF / Test Report) with PDF Attachment.
 */
const sendDocumentEmail = async ({ to, subject, html, attachments = [] }) => {
    if (!to) {
        throw new Error("Recipient email address (to) is required.");
    }

    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your_email')) {
        console.log(`[SMTP Notice] Skipped sending document email to ${to} (SMTP credentials not configured in .env). Subject: ${subject}`);
        return {
            success: true,
            simulated: true,
            message: `SMTP not configured in server environment. Simulated email dispatch to ${to}.`
        };
    }

    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.SMTP_FROM || `"Jagnath Labs" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject || 'Document from Jagnath Labs',
            html: html || '<p>Please find attached document from Jagnath Labs.</p>',
            attachments: attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP Success] Document email sent to ${to} (MessageId: ${info.messageId})`);
        return {
            success: true,
            messageId: info.messageId,
            message: `Email sent successfully to ${to}.`
        };
    } catch (error) {
        console.error('[SMTP Error] Failed to send document email:', error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendOtpEmail,
    sendDocumentEmail
};
