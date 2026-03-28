'use client'

import * as React from 'react'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignInPage() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			const result = await authClient.signIn.email({
				email,
				password,
				callbackURL: '/',
			})

			if (result.error) {
				setError(result.error.message || 'Invalid email or password')
			} else {
				router.push('/')
				router.refresh()
			}
		} catch {
			setError('An error occurred during sign in')
		} finally {
			setLoading(false)
		}
	}

	return (
		<section className="bg-background flex min-h-screen px-4 py-16 md:py-24">
			<div className="m-auto w-full max-w-sm">
				<div className="text-center">
					<Link
						href="/"
						aria-label="go home"
						className="inline-block py-3"
					>
						<h1 className="font-serif text-4xl font-medium">Sign in</h1>
					</Link>
				</div>

				<Card className="mt-8">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl">Welcome back</CardTitle>
						<CardDescription>
							Enter your email and password to sign in
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="signin-email">Email</Label>
								<div className="relative">
									<Mail className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
									<Input
										id="signin-email"
										type="email"
										placeholder="you@example.com"
										value={email}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
										required
										disabled={loading}
										className="pl-10"
										autoComplete="email"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="signin-password">Password</Label>
								<div className="relative">
									<Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
									<Input
										id="signin-password"
										type={showPassword ? 'text' : 'password'}
										placeholder="Enter your password"
										value={password}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
										required
										disabled={loading}
										className="pl-10 pr-10"
										autoComplete="current-password"
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

							{error && (
								<div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
									{error}
								</div>
							)}

							<Button
								type="submit"
								className="w-full"
								disabled={loading}
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Signing in...
									</>
								) : (
									'Sign in'
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				<div className="mt-6 text-center">
					<Link
						href="/auth/forgot-password"
						className="text-muted-foreground text-sm hover:underline"
					>
						Forgot password?
					</Link>
				</div>

				<p className="text-muted-foreground mt-6 text-center text-sm">
					New here?{' '}
					<Link
						href="/auth/sign-up"
						className="text-primary font-medium hover:underline"
					>
						Create an account
					</Link>
				</p>
			</div>
		</section>
	)
}
