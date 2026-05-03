-- Create guide_topics table for admin article manager (SmartGuide)

CREATE TABLE IF NOT EXISTS guide_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  preview TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author TEXT NOT NULL DEFAULT 'SlimDose Team',
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  related_product_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_topics_display_order ON guide_topics(display_order);
CREATE INDEX IF NOT EXISTS idx_guide_topics_is_enabled ON guide_topics(is_enabled);

-- Reuse existing updated_at trigger function (created by other migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_guide_topics_updated_at ON guide_topics;
CREATE TRIGGER update_guide_topics_updated_at
  BEFORE UPDATE ON guide_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: match the rest of the app (admin auth is handled in-app, not via DB auth)
ALTER TABLE guide_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to guide_topics" ON guide_topics;

CREATE POLICY "Allow public full access to guide_topics"
  ON guide_topics
  FOR ALL
  USING (true)
  WITH CHECK (true);
