// app/api/users/[id]/videos/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(
    req: Request,
    context: { params: { id: string } | Promise<{ id: string }> },
) {
    try {
        const params =
            'then' in context.params ? await context.params : context.params
        const { id } = params
        const { searchParams } = new URL(req.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

        const result = await pool.query(
            `SELECT 
                v.id,
                v.title,
                v.thumbnail_url,
                v.video_url,
                v.category,
                v.views_count,
                v.likes_count,
                v.comments_count,
                v.created_at
             FROM videos v
             WHERE v.user_id = $1
             ORDER BY v.created_at DESC
             LIMIT $2`,
            [id, limit],
        )

        return NextResponse.json({
            ok: true,
            data: { items: result.rows },
        })
    } catch (err) {
        console.error('[GET /api/users/[id]/videos]', err)
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 },
        )
    }
}
