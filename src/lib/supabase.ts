import { createClient } from '@supabase/supabase-js';

// 1. Usamos las variables de entorno de Vercel/Vite directamente
// Estos nombres DEBEN coincidir con los que pusiste en el panel de Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Si no existen las variables (por si olvidaste configurarlas), lanzamos un error claro
if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Las credenciales de Supabase no están configuradas en Vercel.");
}

// 3. Exportamos el cliente conectado permanentemente a tu base de datos
export const supabase = createClient(supabaseUrl, supabaseKey);

// Ya no necesitas la función initSupabase porque ahora es automático para todos
