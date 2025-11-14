import { createClient, SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: These are the real credentials provided by the user.
// For production, it's highly recommended to use environment variables to keep your keys secure.
const SUPABASE_URL = 'https://hyrznpnzussnnovuufdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cnpucG56dXNzbm5vdnV1ZmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjE3MTMsImV4cCI6MjA3ODY5NzcxM30.ozFvi3wR4Pfq_H8ACOzPQtF6q7OXW-VMOIVJflj2rV4';

/**
 * A singleton instance of the Supabase client.
 * It will be null if the credentials have not been configured correctly.
 */
let supabaseClient: SupabaseClient | null = null;

// FIX: Removed redundant check `SUPABASE_URL !== 'YOUR_SUPABASE_URL'` which caused a
// TypeScript error because SUPABASE_URL is a constant. The check is unnecessary
// as the actual credentials are provided directly in the code.
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Supabase credentials are not configured. Please update lib/supabase.ts with your project's URL and Anon Key.");
}

export const supabase = supabaseClient;