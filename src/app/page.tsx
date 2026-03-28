'use client'

import Link from 'next/link'
import { useSession, authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, LogOut, Mail } from 'lucide-react'

export default function Home() {
	const { data: session, isPending } = useSession()

	const handleSignOut = async () => {
		await authClient.signOut()
		window.location.reload()
	}

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
			{session?.user ? (
				<Card className="w-full max-w-md">
					<CardHeader>
						<div className="flex items-center gap-4">
							<div className="bg-primary flex h-12 w-12 items-center justify-center rounded-full">
								<User className="text-primary-foreground h-6 w-6" />
							</div>
							<div>
								<CardTitle>Welcome, {session.user.name || 'User'}!</CardTitle>
								<CardDescription>You are signed in</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="text-muted-foreground flex items-center gap-2 text-sm">
								<Mail className="h-4 w-4" />
								{session.user.email}
							</div>
						</div>
						<Button variant="outline" className="w-full" onClick={handleSignOut}>
							<LogOut className="mr-2 h-4 w-4" />
							Sign out
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<CardTitle className="text-2xl">Welcome</CardTitle>
						<CardDescription>
							Sign in to access your account and manage your profile
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button asChild className="w-full">
							<Link href="/auth/sign-in">Sign in</Link>
						</Button>
						<Button asChild variant="outline" className="w-full">
							<Link href="/auth/sign-up">Create account</Link>
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
