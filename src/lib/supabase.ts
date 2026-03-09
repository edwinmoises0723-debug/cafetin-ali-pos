
import { createClient } from '@supabase/supabase-js';

// Intentar leer credenciales guardadas
const storedUrl = localStorage.getItem('supabase_url');
const storedKey = localStorage.getItem('supabase_key');

// Crear cliente solo si existen credenciales, sino null
export const supabase = (storedUrl && storedKey) 
  ? createClient(storedUrl, storedKey) 
  : null;

// Función auxiliar para re-inicializar si cambian las credenciales
export const initSupabase = (url: string, key: string) => {
  if (!url || !key) return null;
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
  window.location.reload(); // Recargar para aplicar cambios
  return createClient(url, key);
};
