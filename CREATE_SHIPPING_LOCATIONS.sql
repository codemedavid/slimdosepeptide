-- ===================================================================
-- CREATE SHIPPING LOCATIONS TABLE
-- Run this script in the Supabase SQL Editor
-- ===================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS shipping_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE shipping_locations ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow publicly readable, but only admin can modify)
-- Note: Adjust 'authenticated' role as needed based on your auth setup. 
-- For now, we'll allow public read access so checkout works without login.
CREATE POLICY "Allow public read access" ON shipping_locations
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON shipping_locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON shipping_locations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON shipping_locations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shipping_locations_updated_at BEFORE UPDATE ON shipping_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default values
INSERT INTO shipping_locations (id, name, fee, is_active, order_index) VALUES
('LUZON', 'Luzon (J&T)', 150.00, true, 1),
('VISAYAS', 'Visayas (J&T)', 120.00, true, 2),
('MINDANAO', 'Mindanao (J&T)', 90.00, true, 3),
('MAXIM', 'Maxim Delivery (Booking fee paid by customer upon delivery)', 0.00, true, 4)
ON CONFLICT (id) DO NOTHING;
