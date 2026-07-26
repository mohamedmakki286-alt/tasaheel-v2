CREATE TABLE IF NOT EXISTS service_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    icon VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    category_id BIGINT NOT NULL REFERENCES service_categories(id),
    default_duration VARCHAR(255),
    description TEXT,
    icon VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS category_id BIGINT;
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS service_template_id BIGINT;
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS uuid VARCHAR(36);
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS price_type VARCHAR(50) DEFAULT 'fixed';
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(255);
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS icon VARCHAR(255);
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE workshop_service_listings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE workshop_service_listings ALTER COLUMN service_type_id DROP NOT NULL;

INSERT INTO service_categories (name, name_en, icon, display_order, is_active)
SELECT
    CASE st.category
        WHEN 'periodic' THEN 'الصيانة الدورية'
        WHEN 'engine' THEN 'المحرك'
        WHEN 'transmission' THEN 'ناقل الحركة'
        WHEN 'suspension' THEN 'الإطارات والتعليق'
        WHEN 'electrical' THEN 'الكهرباء'
        WHEN 'ac' THEN 'التكييف'
        WHEN 'bodywork' THEN 'السمكرة والدهان'
        WHEN 'emergency' THEN 'الطوارئ'
        WHEN 'inspection' THEN 'الفحص والتقييم'
        ELSE st.category
    END,
    st.category,
    CASE st.category
        WHEN 'periodic' THEN 'car'
        WHEN 'engine' THEN 'cog'
        WHEN 'transmission' THEN 'settings'
        WHEN 'suspension' THEN 'disc'
        WHEN 'electrical' THEN 'zap'
        WHEN 'ac' THEN 'snowflake'
        WHEN 'bodywork' THEN 'paintbrush'
        WHEN 'emergency' THEN 'triangle-alert'
        WHEN 'inspection' THEN 'search-check'
        ELSE 'wrench'
    END,
    CASE st.category
        WHEN 'periodic' THEN 1
        WHEN 'engine' THEN 2
        WHEN 'transmission' THEN 3
        WHEN 'suspension' THEN 4
        WHEN 'electrical' THEN 5
        WHEN 'ac' THEN 6
        WHEN 'bodywork' THEN 7
        WHEN 'emergency' THEN 8
        WHEN 'inspection' THEN 9
        ELSE 99
    END,
    TRUE
FROM service_types st
WHERE st.category IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM service_categories c WHERE LOWER(c.name_en) = LOWER(st.category)
  )
GROUP BY st.category;

INSERT INTO service_templates (
    name, name_en, category_id, default_duration, description, icon, is_active
)
SELECT
    st.name,
    st.name_en,
    c.id,
    st.estimated_duration,
    st.description,
    st.icon,
    st.is_active
FROM service_types st
JOIN service_categories c ON LOWER(c.name_en) = LOWER(st.category)
WHERE NOT EXISTS (
    SELECT 1
    FROM service_templates t
    WHERE t.category_id = c.id
      AND LOWER(t.name) = LOWER(st.name)
);
