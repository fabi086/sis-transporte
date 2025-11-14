import { createClient, SupabaseClient } from '@supabase/supabase-js';

// This approach uses a singleton pattern for the Supabase client,
// which is re-initialized when credentials change.
let supabaseClient: SupabaseClient | null = null;

/**
 * Retrieves the Supabase client instance.
 * Initializes the client if it hasn't been created yet, using credentials from localStorage.
 * @returns {SupabaseClient | null} The Supabase client instance or null if credentials are not set.
 */
export const getSupabase = (): SupabaseClient | null => {
    if (supabaseClient) {
        return supabaseClient;
    }

    try {
        const supabaseUrl = localStorage.getItem('reboque360_supabaseUrl');
        const supabaseKey = localStorage.getItem('reboque360_supabaseKey');

        if (supabaseUrl && supabaseKey) {
            supabaseClient = createClient(supabaseUrl, supabaseKey);
            return supabaseClient;
        }
    } catch (error) {
        console.error("Error retrieving Supabase credentials from localStorage:", error);
    }
    
    return null;
};

/**
 * Sets new Supabase credentials, stores them in localStorage, and re-initializes the client.
 * @param {string} url - The Supabase project URL.
 * @param {string} key - The Supabase anon key.
 * @returns {SupabaseClient | null} The newly created Supabase client instance.
 */
export const setSupabaseCredentials = (url: string, key: string): SupabaseClient | null => {
    try {
        localStorage.setItem('reboque360_supabaseUrl', url);
        localStorage.setItem('reboque360_supabaseKey', key);
    } catch (error) {
        console.error("Error saving Supabase credentials to localStorage:", error);
    }
    
    // Invalidate the existing client so it gets recreated with new credentials on the next getSupabase() call.
    supabaseClient = null; 
    return getSupabase();
};