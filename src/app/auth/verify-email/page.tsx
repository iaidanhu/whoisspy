'use client'

import * as React from 'react'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function VerifyEmailContent() {
	const searchParams = useSearchParams()
	const token = searchParams.get('token')
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
	const [message, setMessage] = useState('')

	useEffect(() => {
		if (token) {
			verifyEmail()
		} else {
			setStatus('error')
			setMessage('Invalid verification link')
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token])

	const verifyEmail = async () => {
		try {
			const result = await authClient.verifyEmail({
				query: { token: token! },
			})

			if (result.error) {
				setStatus('error')
				setMessage(result.error.message || 'Verification failed')
			} else {
				setStatus('success')
				setMessage('Your email has been verified successfully.')
			}
		} catch {
			setStatus('error')
			setMessage('An error occurred during verification')
		}
	}

	if (status === 'loading') {
		return (
			<Card className="text-center">
				<CardHeader>
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
					<CardTitle className="text-2xl">Verifying...</CardTitle>
					<CardDescription>
						Please wait while we verify your email address
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	if (status === 'success') {
		return (
			<Card className="text-center">
				<CardHeader>
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
						<CheckCircle className="h-6 w-6 text-green-600" />
					</div>
					<CardTitle className="text-2xl">Email Verified!</CardTitle>
					<CardDescription>{message}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild className="w-full">
						<Link href="/auth/sign-in">Continue to Sign in</Link>
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="text-center">
			<CardHeader>
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
					<XCircle className="h-6 w-6 text-red-600" />
				</div>
				<CardTitle className="text-2xl">Verification Failed</CardTitle>
				<CardDescription>{message}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<Button asChild variant="outline" className="w-full">
					<Link href="/auth/sign-in">Go to Sign in</Link>
				</Button>
				<Button asChild variant="ghost" className="w-full">
					<Link href="/">Go Home</Link>
				</Button>
			</CardContent>
		</Card>
	)
}

export default function VerifyEmailPage() {
	return (
		<section className="bg-background flex min-h-screen px-4 py-16 md:py-24">
			<div className="m-auto w-full max-w-sm">
				<Suspense
					fallback={
						<Card className="text-center">
							<CardHeader>
								<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								</div>
								<CardTitle className="text-2xl">Loading...</CardTitle>
							</CardHeader>
						</Card>
					}
				>
					<VerifyEmailContent />
				</Suspense>
			</div>
		</section>
	)
}
