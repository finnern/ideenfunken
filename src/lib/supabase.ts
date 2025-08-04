import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tdrrwgarryjjyoviktgf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcnJ3Z2FycnlqanlvdmlrdGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MTg3ODEsImV4cCI6MjA0OTQ5NDc4MX0.C-gOY2RWMO3wGAuupznbT5m2A81yPwIFkmq597XlHrs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)