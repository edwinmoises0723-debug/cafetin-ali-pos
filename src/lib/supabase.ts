import { createClient } from '@supabase/supabase-js';

// Usamos las variables con el prefijo VITE_ para que funcionen en Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificación de seguridad en la consola
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Las credenciales de Supabase no están configuradas en Vercel/Vite.");
}

// Exportamos el cliente conectado
export const supabase = createClient(supabaseUrl, supabaseKey);
