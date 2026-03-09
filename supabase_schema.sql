-- 1. Tabla de USUARIOS (Para Auth personalizada del sistema POS)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- En producción se recomienda hash, pero para este POS simple lo dejaremos texto plano
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'waiter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar usuario admin por defecto
INSERT INTO users (username, password, name, role) 
VALUES ('admin', 'admin123', 'Administrador', 'admin')
ON CONFLICT DO NOTHING;

-- 2. Tabla de PRODUCTOS (Menú)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image TEXT, -- Emoji o URL de imagen
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  max_stock INTEGER DEFAULT 100,
  has_tax BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de VENTAS (Cabecera)
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'transfer'
  customer_name TEXT,
  table_id INTEGER, -- Número de mesa
  user_id UUID REFERENCES users(id), -- Quién hizo la venta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de DETALLE DE VENTA (Items)
CREATE TABLE sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL, -- Guardamos nombre por si cambia luego en menú
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL, -- Precio al momento de la venta
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de MESAS (Estado actual)
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  status TEXT DEFAULT 'available', -- 'available', 'occupied', 'reserved'
  current_order JSONB, -- Guardamos la orden actual como JSON temporalmente
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inicializar 12 mesas
INSERT INTO tables (table_number) 
SELECT generate_series(1, 12)
ON CONFLICT DO NOTHING;

-- Habilitar RLS (Row Level Security) pero permitir acceso público para simplificar
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso abierto (Para desarrollo rápido)
CREATE POLICY "Public Access Users" ON users FOR ALL USING (true);
CREATE POLICY "Public Access Products" ON products FOR ALL USING (true);
CREATE POLICY "Public Access Sales" ON sales FOR ALL USING (true);
CREATE POLICY "Public Access Sale Items" ON sale_items FOR ALL USING (true);
CREATE POLICY "Public Access Tables" ON tables FOR ALL USING (true);
