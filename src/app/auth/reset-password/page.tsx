'use client'

import * as React from 'react'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

function ResetPasswordForm() {
	const searchParams = useSearchParams()
	const token = searchParams.get('token')

	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		if (password !== confirmPassword) {
			setError('Passwords do not match')
			setLoading(false)
			return
		}

		if (password.length < 8) {
			setError('Password must be at least 8 characters')
			setLoading(false)
			return
		}

		try {
			const result = await authClient.resetPassword({
				newPassword: password,
			})

			if (result.error) {
				setError(result.error.message || 'Failed to reset password')
			} else {
				setSuccess(true)
				setPassword('')
				setConfirmPassword('')
			}
		} catch {
			setError('An error occurred. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	if (!token) {
		return (
			<Card className="text-center">
				<CardHeader>
					<CardTitle className="text-destructive text-2xl">Invalid Link</CardTitle>
					<CardDescription>
						The password reset link is invalid or has expired. Please request a new one.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild className="w-full">
						<Link href="/auth/forgot-password">Request new link</Link>
					</Button>
				</CardContent>
			</Card>
		)
	}

	if (success) {
		return (
			<Card className="text-center">
				<CardHeader className="pb-4">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
						<CheckCircle className="h-6 w-6 text-green-600" />
					</div>
					<CardTitle className="text-2xl">Password Reset Successful</CardTitle>
					<CardDescription>
						Your password has been reset successfully. You can now sign in with your new password.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Button asChild className="w-full">
						<Link href="/auth/sign-in">Sign in</Link>
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl">Reset password</CardTitle>
				<CardDescription>Create a new password for your account</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="password">New password</Label>
						<div className="relative">
							<Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								placeholder="Enter new password (min 8 chars)"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
								disabled={loading}
								className="pl-10 pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground"
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirm password</Label>
						<div className="relative">
							<Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
							<Input
								id="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								placeholder="Confirm your new password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								disabled={loading}
								className="pl-10 pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground"
							>
								{showConfirmPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
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
						disabled={loading || !password || !confirmPassword}
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Resetting...
							</>
						) : (
							'Reset password'
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}

export default function ResetPasswordPage() {
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

				<Suspense fallback={<Card className="p-8 text-center">Loading...</Card>}>
					<ResetPasswordForm />
				</Suspense>

				<p className="text-muted-foreground mt-6 text-center text-sm">
					Remember your password?{' '}
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
