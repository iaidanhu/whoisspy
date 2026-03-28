'use client'

import * as React from 'react'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			const result = await authClient.requestPasswordReset({
				email,
				redirectTo: '/auth/reset-password',
			})

			if (result.error) {
				setError(result.error.message || 'Failed to send reset link. Please try again.')
			} else {
				setSuccess(true)
				setEmail('')
			}
		} catch {
			setError('An error occurred. Please try again later.')
		} finally {
			setLoading(false)
		}
	}

	if (success) {
		return (
			<section className="bg-background flex min-h-screen px-4 py-16 md:py-24">
				<div className="m-auto w-full max-w-sm">
					<Card className="text-center">
						<CardHeader className="pb-4">
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
								<CheckCircle className="h-6 w-6 text-green-600" />
							</div>
							<CardTitle className="text-2xl">Check your email</CardTitle>
							<CardDescription>
								We&apos;ve sent a password reset link to your email address.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								variant="outline"
								className="w-full"
								onClick={() => setSuccess(false)}
							>
								Resend email
							</Button>
						</CardContent>
					</Card>
					<div className="mt-6 text-center">
						<Link
							href="/auth/sign-in"
							className="text-muted-foreground inline-flex items-center gap-2 text-sm hover:underline"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to sign in
						</Link>
					</div>
				</div>
			</section>
		)
	}

	return (
		<section className="bg-background flex min-h-screen px-4 py-16 md:py-24">
			<div className="m-auto w-full max-w-sm">
				<Link
					href="/auth/sign-in"
					className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to sign in
				</Link>

				<Card>
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl">Forgot password?</CardTitle>
						<CardDescription>
							Enter your email address and we&apos;ll send you a reset link
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<div className="relative">
									<Mail className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
									<Input
										id="email"
										type="email"
										placeholder="you@example.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										disabled={loading}
										className="pl-10"
									/>
								</div>
							</div>

							{error && (
								<div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
									{error}
								</div>
							)}

							<Button
								type="submit"
								className="w-full"
								disabled={loading || !email}
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sending...
									</>
								) : (
									'Send reset link'
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				<p className="text-muted-foreground mt-6 text-center text-sm">
					Remember your password?
					<Link
						href="/auth/sign-in"
						className="text-primary hover:underline"
					>
						Sign in
					</Link>
				</p>
			</div>
		</section>
	)
}
