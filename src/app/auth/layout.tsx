'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const router = useRouter()
	const { data: session, isPending } = useSession()

	useEffect(() => {
		// 如果已登录，重定向到首页
		if (session?.user) {
			router.push('/')
		}
	}, [session, router])

	// 加载中显示空白或加载状态
	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		)
	}

	// 已登录不渲染子组件（会在 useEffect 中重定向）
	if (session?.user) {
		return null
	}

	// 未登录显示子组件
	return <>{children}</>
}
