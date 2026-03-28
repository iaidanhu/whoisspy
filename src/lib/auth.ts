import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { sendResetPasswordEmail, sendVerificationEmail } from './email'

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not defined')
}

if (!process.env.BETTER_AUTH_SECRET) {
	throw new Error('BETTER_AUTH_SECRET is not defined')
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
	throw new Error('NEXT_PUBLIC_APP_URL is not defined')
}

// 读取环境变量，控制是否需要邮箱验证
// 设置为 false 时，注册不需要验证邮件
const requireEmailVerification = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true'

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: schema,
	}),
	secret: process.env.BETTER_AUTH_SECRET,
	baseUrl: process.env.NEXT_PUBLIC_APP_URL,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: requireEmailVerification,
		sendResetPassword: async ({ user, url }) => {
			await sendResetPasswordEmail({ user, url })
		},
	},
	emailVerification: requireEmailVerification
		? {
				sendOnSignUp: true,
				autoSignInAfterVerification: true,
				sendVerificationEmail: async ({ user, url }) => {
					await sendVerificationEmail({ user, url })
				},
			}
		: undefined,
})
