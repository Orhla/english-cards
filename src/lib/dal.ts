import 'server-only'
import { auth } from '@/auth'
import { redirect } from 'next/navigation';

export async function requireAdmin() {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        redirect('/login')
    }
    
    return session
}


export async function requireLogin() {
    const session = await auth();
    if (!session || !session.user) {
        redirect('/login')
    }
    
    return session
}