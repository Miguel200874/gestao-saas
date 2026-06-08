import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ivmdcsjfcoogpmafodev.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bWRjc2pmY29vZ3BtYWZvZGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4OTU1NzgsImV4cCI6MjA5NjQ3MTU3OH0.bSzxbJDO-a0XrFThimnVAa5841_6TL-wJ1IjIQYF_r8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
