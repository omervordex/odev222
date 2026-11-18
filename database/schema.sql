-- Optical store database schema.
--
-- How to apply:
-- 1. Open the Supabase dashboard for this project.
-- 2. Go to SQL Editor → New query.
-- 3. Paste this file and run it.
--
-- The script creates missing tables. It does not delete existing rows.
-- Run it again only after reading the comments: CREATE TABLE IF NOT EXISTS
-- will not alter a table that already exists.
--
-- Access model:
-- - The Express server uses SUPABASE_SECRET_KEY.
-- - That key connects as the service_role role, which bypasses these policies.
-- - anon and authenticated (the publishable key and any future browser client)
--   receive no table privileges and an explicit deny policy.
-- - Do not query these tables from frontend JavaScript.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admins_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT admins_email_format CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  CONSTRAINT admins_email_unique UNIQUE (email),
  CONSTRAINT admins_password_hash_present CHECK (char_length(password_hash) >= 20)
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_present CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT categories_slug_unique UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  category_id UUID NOT NULL,
  price NUMERIC(10, 2),
  image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_name_present CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT products_slug_unique UNIQUE (slug),
  CONSTRAINT products_price_nonnegative CHECK (price IS NULL OR price >= 0),
  CONSTRAINT products_brand_present CHECK (brand IS NULL OR char_length(btrim(brand)) > 0),
  CONSTRAINT products_category_fk
    FOREIGN KEY (category_id)
    REFERENCES public.categories (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  product_id UUID,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inquiries_name_present CHECK (char_length(btrim(customer_name)) > 0),
  CONSTRAINT inquiries_email_format CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  CONSTRAINT inquiries_phone_length CHECK (
    phone IS NULL OR char_length(btrim(phone)) BETWEEN 5 AND 30
  ),
  CONSTRAINT inquiries_message_present CHECK (char_length(btrim(message)) > 0),
  CONSTRAINT inquiries_status_values CHECK (
    status IN ('new', 'read', 'answered', 'closed')
  ),
  CONSTRAINT inquiries_product_fk
    FOREIGN KEY (product_id)
    REFERENCES public.products (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS products_category_id_idx
  ON public.products (category_id);

CREATE INDEX IF NOT EXISTS products_featured_idx
  ON public.products (is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS products_created_at_idx
  ON public.products (created_at DESC);

CREATE INDEX IF NOT EXISTS inquiries_product_id_idx
  ON public.inquiries (product_id);

CREATE INDEX IF NOT EXISTS inquiries_status_idx
  ON public.inquiries (status);

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx
  ON public.inquiries (created_at DESC);

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.admins FORCE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries FORCE ROW LEVEL SECURITY;

-- Public API roles lose their default Supabase table grants.
-- service_role keeps full access for the Express server.
REVOKE ALL ON TABLE public.admins FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.categories FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.products FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.inquiries FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.admins TO service_role;
GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.products TO service_role;
GRANT ALL ON TABLE public.inquiries TO service_role;

-- Visible deny rules for the public Data API.
-- service_role bypasses these policies, so no allow policy is created.
DROP POLICY IF EXISTS admins_deny_public_api ON public.admins;
CREATE POLICY admins_deny_public_api
  ON public.admins
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS categories_deny_public_api ON public.categories;
CREATE POLICY categories_deny_public_api
  ON public.categories
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS products_deny_public_api ON public.products;
CREATE POLICY products_deny_public_api
  ON public.products
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS inquiries_deny_public_api ON public.inquiries;
CREATE POLICY inquiries_deny_public_api
  ON public.inquiries
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
