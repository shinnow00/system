'use server'

import { createClient } from '@supabase/supabase-js'

export async function deleteUser(userId: string) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )

    // Delete from Auth (Cascades to profiles)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
        console.error('Delete Error:', error)
        return { success: false, message: error.message }
    }

    return { success: true }
}
