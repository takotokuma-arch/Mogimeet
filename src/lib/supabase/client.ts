import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Export a factory function to match usage in Server Actions and Components
export function createClient() {
    return createSupabaseClient(supabaseUrl, supabaseKey)
}
