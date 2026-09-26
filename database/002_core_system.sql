CREATE TABLE locales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(10) NOT NULL UNIQUE,
 hreflang varchar(20) NOT NULL, name varchar(100) NOT NULL, native_name varchar(100) NOT NULL,
 direction varchar(3) NOT NULL DEFAULT 'ltr' CHECK(direction IN ('ltr','rtl')),
 is_default boolean NOT NULL DEFAULT false, is_enabled boolean NOT NULL DEFAULT true,
 sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_locales_one_default ON locales(is_default) WHERE is_default;
CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email citext NOT NULL UNIQUE, password_hash text NOT NULL,
 first_name text, last_name text, display_name text, avatar_media_id uuid,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled','locked')),
 last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, description text, is_system boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, module text NOT NULL, description text);
CREATE TABLE user_roles (user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE, PRIMARY KEY(user_id,role_id));
CREATE TABLE role_permissions (role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE, permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE, PRIMARY KEY(role_id,permission_id));
CREATE TABLE audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL, action text NOT NULL, entity_type text NOT NULL, entity_id uuid, locale_id uuid REFERENCES locales(id) ON DELETE SET NULL, old_data jsonb, new_data jsonb, ip_address inet, user_agent text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE site_settings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), singleton_key boolean NOT NULL DEFAULT true UNIQUE CHECK(singleton_key), site_name text NOT NULL, primary_domain text NOT NULL, default_locale_id uuid NOT NULL REFERENCES locales(id), logo_media_id uuid, favicon_media_id uuid, company_email citext, company_phone text, timezone text NOT NULL DEFAULT 'UTC', ga_measurement_id text, search_console_property text, enable_indexing boolean NOT NULL DEFAULT false, default_og_image_id uuid, settings_json jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE site_setting_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), site_setting_id uuid NOT NULL REFERENCES site_settings(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), site_title text, company_name text, company_description text, footer_description text, customer_service_welcome text, copyright_text text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(site_setting_id,locale_id));
