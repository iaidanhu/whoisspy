import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

if (!process.env.RESEND_API_KEY) {
	throw new Error('RESEND_API_KEY is not defined')
}

interface EmailUser {
	email: string
	name?: string
}

export async function sendResetPasswordEmail({
	user,
	url,
}: {
	user: EmailUser
	url: string
}) {
	await resend.emails.send({
		from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
		to: user.email,
		subject: 'Reset Your Password',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
				<h1 style="color: #0070f3;">Reset Your Password</h1>
				<p>Hi ${user.name || user.email},</p>
				<p>We received a request to reset your password. Click the button below to create a new password:</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
				</div>
				<p>Or copy and paste this link into your browser:</p>
				<p style="word-break: break-all; color: #666;">${url}</p>
				<p>If you did not request a password reset, please ignore this email.</p>
				<p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
			</div>
		`,
	})
}

export async function sendVerificationEmail({
	user,
	url,
}: {
	user: EmailUser
	url: string
}) {
	await resend.emails.send({
		from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
		to: user.email,
		subject: 'Verify Your Email Address',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
				<h1 style="color: #0070f3;">Email Verification</h1>
				<p>Hi ${user.name || user.email},</p>
				<p>Thank you for signing up! Please click the button below to verify your email address:</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
				</div>
				<p>Or copy and paste this link into your browser:</p>
				<p style="word-break: break-all; color: #666;">${url}</p>
				<p>If you did not create an account, please ignore this email.</p>
				<p style="color: #999; font-size: 12px;">This link will expire in 24 hours.</p>
			</div>
		`,
	})
}
