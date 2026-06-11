import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://trcbuiqdsycxugsqrirz.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyY2J1aXFkc3ljeHVnc3FyaXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTk2OTIsImV4cCI6MjA5NjA3NTY5Mn0.1iarhdM6vbkLQKdY7fukW72RBNYED1eZx5Tos4LOn94';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
