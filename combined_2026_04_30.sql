-- ============================================================================
-- PEPTIDE PULSE - MASTER REPLICATION SCRIPT
-- ============================================================================
--
-- DESCRIPTION:
-- This script contains ALL necessary SQL to set up the Peptide Pulse database
-- from scratch. It includes:
-- 1. Tables (Categories, Products, Orders, etc.)
-- 2. RLS Policies & Security
-- 3. Storage Buckets (Images, Payment Proofs)
-- 4. Initial Seed Data (Products, Couriers, Shipping Rates)
-- 5. Helper Functions & RPCs
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Project -> SQL Editor
-- 2. Paste this entire file
-- 3. Click "RUN"
--
-- This script is idempotent: every INSERT uses ON CONFLICT, so it can be
-- re-run safely without "duplicate key" errors.
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TABLES & SCHEMA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2.2 Products
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Uncategorized',
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_price DECIMAL(10, 2),
    discount_start_date TIMESTAMP WITH TIME ZONE,
    discount_end_date TIMESTAMP WITH TIME ZONE,
    discount_active BOOLEAN DEFAULT false,
    purity_percentage DECIMAL(5, 2) DEFAULT 99.0,
    molecular_weight TEXT,
    cas_number TEXT,
    sequence TEXT,
    storage_conditions TEXT DEFAULT 'Store at -20°C',
    inclusions TEXT[],
    stock_quantity INTEGER DEFAULT 0,
    available BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    image_url TEXT,
    safety_sheet_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2.3 Product Variations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity_mg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_price DECIMAL(10, 2),
    discount_active BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_variations DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.product_variations TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2.4 Site Settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.site_settings TO anon, authenticated, service_role;

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2.5 Payment Methods
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    account_number TEXT,
    account_name TEXT,
    qr_code_url TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_methods DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.payment_methods TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2.6 Shipping Locations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.shipping_locations DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.shipping_locations TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS shipping_locations_order_idx ON public.shipping_locations (order_index ASC);

-- ----------------------------------------------------------------------------
-- 2.7 Couriers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.couriers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tracking_url_template TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.couriers DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.couriers TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2.8 Promo Codes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.promo_codes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.promo_codes TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2.9 Orders
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    contact_method TEXT DEFAULT 'phone',
    shipping_address TEXT NOT NULL,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip_code TEXT,
    shipping_country TEXT DEFAULT 'Philippines',
    shipping_barangay TEXT,
    shipping_region TEXT,
    shipping_location TEXT,
    courier_id UUID,
    shipping_fee DECIMAL(10, 2) DEFAULT 0,
    order_items JSONB NOT NULL,
    subtotal DECIMAL(10, 2),
    total_price DECIMAL(10, 2) NOT NULL,
    pricing_mode TEXT DEFAULT 'PHP',
    payment_method_id TEXT,
    payment_method_name TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_proof_url TEXT,
    promo_code_id UUID REFERENCES public.promo_codes(id),
    promo_code TEXT,
    discount_applied DECIMAL(10, 2) DEFAULT 0,
    order_status TEXT DEFAULT 'new',
    notes TEXT,
    admin_notes TEXT,
    tracking_number TEXT,
    tracking_courier TEXT,
    shipping_provider TEXT,
    shipping_note TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2.10 COA Reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coa_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    batch TEXT,
    test_date DATE NOT NULL,
    purity_percentage DECIMAL(5,3) NOT NULL,
    quantity TEXT NOT NULL,
    task_number TEXT NOT NULL,
    verification_key TEXT NOT NULL,
    image_url TEXT NOT NULL,
    featured BOOLEAN DEFAULT false,
    manufacturer TEXT DEFAULT 'Peptide Pulse',
    laboratory TEXT DEFAULT 'Janoshik Analytical',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.coa_reports DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.coa_reports TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2.11 FAQs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'GENERAL',
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.faqs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.faqs TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2.12 Protocols
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  notes TEXT[] DEFAULT '{}',
  storage TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  image_url TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE protocols ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS file_url TEXT;

ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active protocols" ON protocols;
CREATE POLICY "Public can read active protocols" ON protocols
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage protocols" ON protocols;
CREATE POLICY "Admins can manage protocols" ON protocols
  FOR ALL USING (true);

-- ============================================================================
-- 3. STORAGE BUCKETS
-- ============================================================================

DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('payment-proofs', 'payment-proofs', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('article-covers', 'article-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('protocol-files', 'protocol-files', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- General storage policies
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
CREATE POLICY "Public Select" ON storage.objects FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE TO public USING (true);

-- protocol-files specific policies
DROP POLICY IF EXISTS "Public can read protocol files" ON storage.objects;
CREATE POLICY "Public can read protocol files" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'protocol-files');

DROP POLICY IF EXISTS "Anyone can upload protocol files" ON storage.objects;
CREATE POLICY "Anyone can upload protocol files" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'protocol-files');

DROP POLICY IF EXISTS "Anyone can update protocol files" ON storage.objects;
CREATE POLICY "Anyone can update protocol files" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'protocol-files');

DROP POLICY IF EXISTS "Anyone can delete protocol files" ON storage.objects;
CREATE POLICY "Anyone can delete protocol files" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'protocol-files');

-- couriers policies
DROP POLICY IF EXISTS "Allow authenticated users to insert couriers" ON couriers;
DROP POLICY IF EXISTS "Allow authenticated users to update couriers" ON couriers;
DROP POLICY IF EXISTS "Allow authenticated users to delete couriers" ON couriers;
DROP POLICY IF EXISTS "Allow full access to couriers" ON couriers;
CREATE POLICY "Allow full access to couriers" ON couriers FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. SEED DATA
-- ============================================================================

-- 4.1 Site Settings
INSERT INTO public.site_settings (id, value, type, description) VALUES
('site_name', 'Peptide Pulse', 'text', 'The name of the website'),
('site_logo', '/assets/logo.jpeg', 'image', 'The logo image URL for the site'),
('site_description', 'Premium Peptide Solutions', 'text', 'Short description of the site'),
('currency', '₱', 'text', 'Currency symbol for prices'),
('hero_title_prefix', 'Premium', 'text', 'Hero title prefix'),
('hero_title_highlight', 'Peptides', 'text', 'Hero title highlighted word'),
('hero_title_suffix', '& Essentials', 'text', 'Hero title suffix'),
('coa_page_enabled', 'true', 'boolean', 'Enable/disable the COA page')
ON CONFLICT (id) DO NOTHING;

-- 4.2 Categories
INSERT INTO public.categories (id, name, sort_order, icon, active) VALUES
('c0a80121-0001-4e78-94f8-585d77059001', 'Peptides', 1, 'FlaskConical', true),
('c0a80121-0002-4e78-94f8-585d77059002', 'Weight Management', 2, 'Scale', true),
('c0a80121-0003-4e78-94f8-585d77059003', 'Beauty & Anti-Aging', 3, 'Sparkles', true),
('c0a80121-0004-4e78-94f8-585d77059004', 'Wellness & Vitality', 4, 'Heart', true),
('c0a80121-0005-4e78-94f8-585d77059005', 'GLP-1 Agonists', 5, 'Pill', true),
('c0a80121-0006-4e78-94f8-585d77059006', 'Insulin Pens', 6, 'Syringe', true),
('c0a80121-0007-4e78-94f8-585d77059007', 'Accessories', 7, 'Package', true),
('c0a80121-0008-4e78-94f8-585d77059008', 'Bundles & Kits', 8, 'Gift', true)
ON CONFLICT (id) DO NOTHING;

-- 4.3 Couriers
INSERT INTO public.couriers (code, name, tracking_url_template, is_active) VALUES
('lbc', 'LBC Express', 'https://www.lbcexpress.com/track/?tracking_no={tracking}', true),
('jnt', 'J&T Express', 'https://www.jtexpress.ph/index/query/gzquery.html?bills={tracking}', true),
('lalamove', 'Lalamove', NULL, true),
('grab', 'Grab Express', NULL, true),
('maxim', 'Maxim', NULL, true)
ON CONFLICT (code) DO NOTHING;

-- 4.4 Shipping Rates (courier-specific + generic regions)
-- Wipe and re-seed so re-runs never hit duplicate-key errors.
TRUNCATE TABLE public.shipping_locations;

INSERT INTO public.shipping_locations (id, name, fee, is_active, order_index) VALUES
('LBC_METRO_MANILA',  'LBC - Metro Manila',                150.00, true, 1),
('LBC_LUZON',         'LBC - Luzon (Provincial)',          200.00, true, 2),
('LBC_VISMIN',        'LBC - Visayas & Mindanao',          250.00, true, 3),
('JNT_METRO_MANILA',  'J&T - Metro Manila',                120.00, true, 4),
('JNT_PROVINCIAL',    'J&T - Provincial',                  180.00, true, 5),
('LALAMOVE_STANDARD', 'Lalamove (Book Yourself / Rider)',    0.00, true, 6),
('MAXIM_STANDARD',    'Maxim (Book Yourself / Rider)',       0.00, true, 7),
('NCR',               'NCR (Metro Manila)',                 75.00, true, 8),
('LUZON',             'Luzon (Outside NCR)',               100.00, true, 9),
('VISAYAS_MINDANAO',  'Visayas & Mindanao',                130.00, true, 10);

-- 4.5 Payment Methods
INSERT INTO public.payment_methods (id, name, account_number, account_name, active, sort_order) VALUES
('0a0b0001-0001-4e78-94f8-585d77059001', 'GCash', '', 'Peptide Pulse', true, 1),
('0a0b0002-0002-4e78-94f8-585d77059002', 'BDO', '', 'Peptide Pulse', true, 2),
('0a0b0003-0003-4e78-94f8-585d77059003', 'Security Bank', '', 'Peptide Pulse', true, 3)
ON CONFLICT (id) DO NOTHING;

-- 4.6 Seed Products (Sample Tirzepatide)
INSERT INTO public.products (id, name, description, base_price, category, image_url, featured, available, stock_quantity) VALUES
('a1a20001-0001-4e78-94f8-585d77059001', 'Tirzepatide 5mg', 'Lab tested for 99%+ purity.', 1800.00, 'c0a80121-0002-4e78-94f8-585d77059002', NULL, true, true, 50),
('a1a20002-0002-4e78-94f8-585d77059002', 'Tirzepatide 10mg', 'Double-strength formulation.', 3200.00, 'c0a80121-0002-4e78-94f8-585d77059002', NULL, true, true, 50),
('a1a20003-0003-4e78-94f8-585d77059003', 'Tirzepatide 15mg', 'High-potency formulation.', 4500.00, 'c0a80121-0002-4e78-94f8-585d77059002', NULL, true, true, 50)
ON CONFLICT (id) DO NOTHING;

-- 4.7 Seed Product Variations
INSERT INTO public.product_variations (product_id, name, price, stock_quantity) VALUES
('a1a20001-0001-4e78-94f8-585d77059001', 'Vials Only', 1800.00, 50),
('a1a20001-0001-4e78-94f8-585d77059001', 'Complete Set', 2300.00, 30),
('a1a20002-0002-4e78-94f8-585d77059002', 'Vials Only', 3200.00, 50),
('a1a20002-0002-4e78-94f8-585d77059002', 'Complete Set', 3700.00, 30)
ON CONFLICT DO NOTHING;

-- 4.8 Protocols (full reseed)
DELETE FROM protocols;
INSERT INTO protocols (name, category, dosage, frequency, duration, notes, storage, sort_order, active) VALUES

('Tirzepetide 15MG Protocol', 'Weight Management', '2.5mg - 7.5mg weekly (dose based on vial size)', 'Once weekly on the same day', '12-16 weeks per cycle',
 ARRAY['Start with 2.5mg for first 4 weeks', 'Increase by 2.5mg every 4 weeks as tolerated', 'This is the 15mg vial - yields multiple doses', 'Inject subcutaneously in abdomen, thigh, or upper arm', 'Take with or without food', 'Rotate injection sites'],
 'Refrigerate at 2-8°C. Once in use, can be kept at room temperature for up to 21 days.', 1, true),

('Tirzepetide 30MG Protocol', 'Weight Management', '5mg - 15mg weekly (higher dose vial)', 'Once weekly on the same day', '12-16 weeks per cycle',
 ARRAY['Start with 5mg for first 4 weeks if experienced', 'Increase by 2.5-5mg every 4 weeks as tolerated', 'Maximum dose is 15mg weekly', 'This larger vial offers more flexibility', 'Inject subcutaneously', 'May cause nausea initially - eat smaller meals'],
 'Refrigerate at 2-8°C.', 2, true),

('NAD+ 500MG Protocol', 'Longevity & Anti-Aging', '100mg - 250mg daily', 'Once daily, preferably morning', '8-12 weeks per cycle',
 ARRAY['Start with 100mg and increase gradually', 'Subcutaneous or intramuscular injection', 'Higher dose vial allows extended use', 'Take in morning to avoid sleep disruption', 'Supports cellular energy and repair', 'Some initial flushing is normal'],
 'Refrigerate after reconstitution. Protect from light.', 3, true),

('GHK CU 50MG Protocol', 'Beauty & Regeneration', '1mg - 2mg daily', 'Once daily', '8-12 weeks per cycle',
 ARRAY['Can be used topically or via injection', 'Promotes collagen synthesis', 'Supports skin elasticity and wound healing', 'Also used for hair regrowth', 'Copper peptide with many benefits', 'Safe for long-term use'],
 'Refrigerate after reconstitution.', 4, true),

('GHK CU 100MG Protocol', 'Beauty & Regeneration', '2mg - 3mg daily', 'Once daily', '8-12 weeks per cycle',
 ARRAY['Higher concentration for extended protocols', 'Excellent for anti-aging protocols', 'Can inject near treatment area', 'Supports tissue repair', 'Works synergistically with other peptides', 'Monitor for copper sensitivity'],
 'Refrigerate after reconstitution.', 5, true),

('DSIP 5MG Protocol', 'Sleep & Recovery', '100mcg - 300mcg before bed', 'Once daily, 30 min before sleep', '2-4 weeks per cycle',
 ARRAY['Start with 100mcg to assess tolerance', 'Promotes deep, restorative sleep', 'Do not combine with other sedatives', 'Effects build over several days', 'Take 2-4 week breaks between cycles', 'Subcutaneous injection preferred'],
 'Refrigerate after reconstitution.', 6, true),

('DSIP 15MG Protocol', 'Sleep & Recovery', '200mcg - 400mcg before bed', 'Once daily, 30 min before sleep', '4-6 weeks per cycle',
 ARRAY['Larger vial for extended sleep support', 'Gradually increase dose as needed', 'Supports natural sleep architecture', 'May help with stress-related insomnia', 'Avoid alcohol when using', 'Take breaks to prevent tolerance'],
 'Refrigerate after reconstitution.', 7, true),

('Glutathione 1500MG Protocol', 'Detox & Skin Brightening', '200mg - 500mg every other day', '3-4 times weekly', '8-12 weeks per cycle',
 ARRAY['Master antioxidant for detoxification', 'Skin brightening and evening tone', 'Can inject subcutaneously or intramuscularly', 'Often combined with Vitamin C', 'Supports liver function', 'Results visible after 4-6 weeks'],
 'Refrigerate. Protect from light and heat.', 8, true),

('Lipo C with B12 Protocol', 'Fat Burning & Energy', '1ml injection', '2-3 times weekly', 'Ongoing or 8-12 week cycles',
 ARRAY['Lipotropic injection for fat metabolism', 'Boosts energy and metabolism', 'Inject intramuscularly in thigh or buttock', 'Best combined with exercise program', 'Supports liver fat processing', 'B12 provides energy boost'],
 'Refrigerate. Protect from light.', 9, true),

('SS31 10MG Protocol', 'Mitochondrial Health', '5mg - 10mg daily', 'Once daily', '4-6 weeks per cycle',
 ARRAY['Targets inner mitochondrial membrane', 'Protects against oxidative stress', 'Supports cellular energy production', 'Inject subcutaneously', 'Best taken in morning', 'Take 4-week breaks between cycles'],
 'Refrigerate. Protect from light.', 10, true),

('SS31 50MG Protocol', 'Mitochondrial Health', '10mg - 20mg daily', 'Once daily', '4-8 weeks per cycle',
 ARRAY['Higher dose for intensive protocols', 'Advanced mitochondrial support', 'Anti-aging at cellular level', 'Monitor energy levels', 'May enhance exercise performance', 'Rotate injection sites'],
 'Refrigerate. Protect from light.', 11, true),

('MOTS C 10MG Protocol', 'Metabolic Health', '5mg twice weekly', 'Twice weekly (e.g., Mon/Thu)', '8-12 weeks per cycle',
 ARRAY['Mitochondrial-derived peptide', 'Improves insulin sensitivity', 'Enhances exercise capacity', 'Take before exercise for best results', 'Supports metabolic health', 'Intramuscular or subcutaneous'],
 'Refrigerate after reconstitution.', 12, true),

('MOTS C 40MG Protocol', 'Metabolic Health', '10mg twice weekly', 'Twice weekly (e.g., Mon/Thu)', '8-12 weeks per cycle',
 ARRAY['Higher dose for intensive protocols', 'Enhanced metabolic optimization', 'Great for athletes and active users', 'Best taken pre-workout', 'Supports weight management', 'Monitor blood glucose if diabetic'],
 'Refrigerate after reconstitution.', 13, true),

('KLOW (CU50+TB10+BC10+KPV10) Protocol', 'Healing & Anti-Inflammatory', 'As pre-mixed or follow component ratios', 'Once daily', '6-8 weeks per cycle',
 ARRAY['Powerful combination stack', 'GHK-Cu for regeneration', 'TB-500 for tissue repair', 'BPC-157 for healing', 'KPV for anti-inflammatory', 'All-in-one healing protocol'],
 'Refrigerate after reconstitution.', 14, true),

('Lemon Bottle 10MG Protocol', 'Fat Dissolving', 'Apply as directed to treatment area', 'Weekly treatments', '4-6 sessions typically',
 ARRAY['Lipolytic solution for fat reduction', 'Professional application recommended', 'Targets stubborn fat deposits', 'Massage after application', 'Results visible after 2-3 sessions', 'Avoid strenuous exercise 24hrs after'],
 'Refrigerate. Keep away from direct sunlight.', 15, true),

('KPV 10MG + GHKCu 50MG Protocol', 'Anti-Inflammatory & Regeneration', 'KPV: 200mcg + GHKCu: 1mg daily', 'Once daily', '6-8 weeks per cycle',
 ARRAY['Synergistic anti-inflammatory combo', 'KPV reduces inflammation', 'GHKCu promotes tissue repair', 'Great for skin and gut health', 'Subcutaneous injection', 'Can split doses AM/PM'],
 'Refrigerate after reconstitution.', 16, true),

('Snap-8 (Botox in a Bottle) Protocol', 'Anti-Wrinkle', 'Apply topically to wrinkle-prone areas', 'Twice daily', 'Ongoing use',
 ARRAY['Topical anti-wrinkle peptide', 'Apply to forehead, crows feet, frown lines', 'Works by relaxing facial muscles', 'Visible results in 2-4 weeks', 'Safe for daily use', 'Can layer under moisturizer'],
 'Store at room temperature. Keep sealed.', 17, true),

('GHKCu Cosmetic Grade (1 gram) Protocol', 'Professional Cosmetic Use', 'Mix into serums: 0.1-0.5% concentration', 'Daily as part of skincare routine', 'Ongoing use',
 ARRAY['High-grade copper peptide powder', 'Mix into your preferred serum base', 'Start with lower concentration', 'Store mixed serum in dark bottle', 'Promotes collagen and elastin', 'Professional skincare formulation'],
 'Store powder in freezer. Mixed serum refrigerate.', 18, true),

('Semax 10MG + Selank 10MG Protocol', 'Cognitive Enhancement', 'Semax: 300mcg + Selank: 250mcg daily', '1-2 times daily', '2-4 weeks per cycle',
 ARRAY['Powerful nootropic combination', 'Semax for focus and memory', 'Selank for anxiety and stress', 'Intranasal or subcutaneous', 'Best taken morning/early afternoon', 'Take breaks between cycles'],
 'Refrigerate. Use within 30 days.', 19, true),

('KPV 5MG Protocol', 'Anti-Inflammatory', '100mcg - 200mcg daily', 'Once daily', '4-8 weeks per cycle',
 ARRAY['Potent anti-inflammatory peptide', 'Alpha-MSH fragment', 'Gut health and skin conditions', 'Subcutaneous injection', 'No significant side effects', 'Works systemically'],
 'Refrigerate after reconstitution.', 20, true),

('KPV 10MG Protocol', 'Anti-Inflammatory', '200mcg - 400mcg daily', 'Once or twice daily', '4-8 weeks per cycle',
 ARRAY['Higher dose for stronger effect', 'Excellent for inflammatory conditions', 'Can split dose morning/evening', 'Supports gut barrier function', 'Anti-microbial properties', 'Safe for extended use'],
 'Refrigerate after reconstitution.', 21, true),

('Tesamorelin 5MG Protocol', 'Growth Hormone', '1mg daily', 'Once daily before bed on empty stomach', '12-26 weeks per cycle',
 ARRAY['FDA-approved GHRH analog', 'Reduces visceral fat', 'Inject subcutaneously in abdomen', 'No food 2 hours before/after', 'Stimulates natural GH release', 'Monitor IGF-1 levels'],
 'Refrigerate at 2-8°C.', 22, true),

('Tesamorelin 10MG Protocol', 'Growth Hormone', '1mg - 2mg daily', 'Once daily before bed on empty stomach', '12-26 weeks per cycle',
 ARRAY['Larger vial for extended use', 'Same protocol as 5MG', 'Consistent timing important', 'Best taken before bed', 'Avoid eating after injection', 'Results visible after 8-12 weeks'],
 'Refrigerate at 2-8°C.', 23, true),

('Epitalon 10MG Protocol', 'Longevity & Anti-Aging', '5mg - 10mg daily for 10-20 days', 'Once daily, preferably before bed', '10-20 day cycles, 4-6 months apart',
 ARRAY['Telomere elongation peptide', 'Short intense cycles', 'Promotes melatonin production', 'Anti-aging at DNA level', 'Take 2-3 cycles per year', 'Subcutaneous injection'],
 'Refrigerate. Stable for 6 months.', 24, true),

('Epitalon 50MG Protocol', 'Longevity & Anti-Aging', '10mg daily for 10-20 days', 'Once daily, preferably before bed', '10-20 day cycles, 4-6 months apart',
 ARRAY['Higher dose vial for multiple cycles', 'Ultimate longevity peptide', 'Resets biological clock', 'Improves sleep quality', 'Supports immune function', 'Visible anti-aging effects'],
 'Refrigerate. Stable for 6 months.', 25, true),

('PT141 10MG Protocol', 'Sexual Wellness', '500mcg - 2mg as needed', 'As needed, 1-2 hours before activity', 'Use as needed, 24hr minimum between doses',
 ARRAY['Also known as Bremelanotide', 'Start with 500mcg to assess tolerance', 'Effects last 24-72 hours', 'Inject subcutaneously 45min-2hrs before', 'May cause nausea initially', 'Maximum once per 24 hours'],
 'Refrigerate. Use within 30 days.', 26, true);

-- ============================================================================
-- 5. RPC FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_order_details(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', o.id,
        'customer_name', o.customer_name,
        'customer_email', o.customer_email,
        'customer_phone', o.customer_phone,
        'shipping_address', o.shipping_address,
        'shipping_city', o.shipping_city,
        'shipping_fee', o.shipping_fee,
        'total_price', o.total_price,
        'discount_applied', o.discount_applied,
        'promo_code', o.promo_code,
        'payment_status', o.payment_status,
        'order_status', o.order_status,
        'created_at', o.created_at,
        'items', o.order_items,
        'tracking_number', o.tracking_number,
        'shipping_provider', o.shipping_provider,
        'courier_code', c.code,
        'courier_name', c.name,
        'tracking_url_template', c.tracking_url_template
    ) INTO result
    FROM orders o
    LEFT JOIN couriers c ON o.courier_id = c.id
    WHERE o.id = p_order_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FINAL CLEANUP
-- ============================================================================

NOTIFY pgrst, 'reload schema';
