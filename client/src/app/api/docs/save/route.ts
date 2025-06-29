import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { title, content } = await req.json()

    try {
        const existing = await prisma.document.findFirst({ where: { title } })
        if (!existing) {
            await prisma.document.create({
                data: { title, content, owner_id: Number(session.user.id) }
            })
        } else {
            await prisma.document.update({
                where: { title },
                data: { content }
            })
            return NextResponse.json({ message: "Document updated successfully" })
        }
        return NextResponse.json({ message: "Document saved successfully" })
    } catch (err) {
        console.error("Error saving doc:", err)
        return NextResponse.json({ message: "Error saving doc" }, { status: 500 })
    }
}