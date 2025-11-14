import { createClient, SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these placeholder values with your actual Supabase credentials.
// For production, it's highly recommended to use environment variables to keep your keys secure.
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Example: 'https://xyz.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

/**
 * A singleton instance of the Supabase client.
 * It will be null if the credentials have not been configured correctly.
 */
let supabaseClient: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Supabase credentials are not configured. Please update lib/supabase.ts with your project's URL and Anon Key.");
}

export const supabase = supabaseClient;
