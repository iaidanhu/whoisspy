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
import { Mail, Lock, Eye, EyeOff, Loader2, User } from 'lucide-react'

// 项目配置：从环境变量读取是否需要邮箱验证
const requireEmailVerification = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true'

export default function SignUpPage() {
	const router = useRouter()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [showVerificationMessage, setShowVerificationMessage] = useState(false)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		if (password.length < 8) {
			setError('Password must be at least 8 characters')
			setLoading(false)
			return
		}

		try {
			const result = await authClient.signUp.email({
				email,
				password,
				name,
			})

			if (result.error) {
				setError(result.error.message || 'Failed to create account')
			} else {
				// 基于项目配置决定是否显示验证邮件提示
				if (requireEmailVerification) {
					// 项目配置了需要邮件验证
					setShowVerificationMessage(true)
				} else {
					// 项目配置了不需要邮件验证，直接跳转到首页
					router.push('/')
					router.refresh()
				}
			}
		} catch {
			setError('An error occurred during sign up')
		} finally {
			setLoading(false)
		}
	}

	// 显示验证邮件提示（仅当项目配置需要验证时）
	if (showVerificationMessage) {
		return (
			<section className="bg-background flex min-h-screen px-4 py-16 md:py-24">
				<div className="m-auto w-full max-w-sm">
					<Card className="text-center">
						<CardHeader>
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
								<Mail className="h-6 w-6 text-green-600" />
							</div>
							<CardTitle className="text-2xl">Check your email</CardTitle>
							<CardDescription>
								We&apos;ve sent a verification link to {email}. Please check your inbox and verify your email address.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild variant="outline" className="w-full">
								<Link href="/auth/sign-in">Go to Sign in</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</section>
		)
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
						<h1 className="font-serif text-4xl font-medium">Create account</h1>
					</Link>
				</div>

				<Card className="mt-8">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl">Get started</CardTitle>
						<CardDescription>
							Create your account to get started
							{!requireEmailVerification && (
								<span className="text-muted-foreground block text-xs mt-1">
									(No email verification required)
								</span>
							)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="signup-name">Full Name</Label>
								<div className="relative">
									<User className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
									<Input
										id="signup-name"
										type="text"
										placeholder="John Doe"
										value={name}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
										required
										disabled={loading}
										className="pl-10"
										autoComplete="name"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="signup-email">Email</Label>
								<div className="relative">
									<Mail className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
									<Input
										id="signup-email"
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
								<Label htmlFor="signup-password">Password</Label>
								<div className="relative">
									<Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
									<Input
										id="signup-password"
										type={showPassword ? 'text' : 'password'}
										placeholder="Create a password (min 8 chars)"
										value={password}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
										required
										minLength={8}
										disabled={loading}
										className="pl-10 pr-10"
										autoComplete="new-password"
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
										Creating account...
									</>
								) : (
									'Create account'
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				<p className="text-muted-foreground mt-6 text-center text-sm">
					Already have an account?{' '}
					<Link
						href="/auth/sign-in"
						className="text-primary font-medium hover:underline"
					>
						Sign in
					</Link>
				</p>
			</div>
		</section>
	)
}
