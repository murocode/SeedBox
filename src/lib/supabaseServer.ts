import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase server client created without URL or service key')
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)

export default supabaseServer
