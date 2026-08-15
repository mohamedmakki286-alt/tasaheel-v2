CREATE TABLE IF NOT EXISTS business_number_sequences (
    id BIGSERIAL PRIMARY KEY,
    document_type VARCHAR(20) NOT NULL,
    sequence_year INTEGER NOT NULL,
    last_value BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ux_business_number_sequences_type_year UNIQUE (document_type, sequence_year)
);

ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS request_number VARCHAR(30);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_number VARCHAR(30);
ALTER TABLE inspection_reports ADD COLUMN IF NOT EXISTS report_number VARCHAR(30);

UPDATE maintenance_requests
SET request_number = 'REQ-' || EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT || '-' || LPAD(id::TEXT, 6, '0')
WHERE request_number IS NULL;

UPDATE quotes
SET quote_number = 'QUO-' || EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT || '-' || LPAD(id::TEXT, 6, '0')
WHERE quote_number IS NULL;

UPDATE inspection_reports
SET report_number = 'RPT-' || EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT || '-' || LPAD(id::TEXT, 6, '0')
WHERE report_number IS NULL;

UPDATE invoices
SET invoice_number = 'INV-' || EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT || '-' || LPAD(id::TEXT, 6, '0');

INSERT INTO business_number_sequences(document_type, sequence_year, last_value)
SELECT 'REQUEST', EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT, MAX(id)
FROM maintenance_requests GROUP BY EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT
ON CONFLICT (document_type, sequence_year) DO UPDATE
SET last_value = GREATEST(business_number_sequences.last_value, EXCLUDED.last_value);

INSERT INTO business_number_sequences(document_type, sequence_year, last_value)
SELECT 'QUOTE', EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT, MAX(id)
FROM quotes GROUP BY EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT
ON CONFLICT (document_type, sequence_year) DO UPDATE
SET last_value = GREATEST(business_number_sequences.last_value, EXCLUDED.last_value);

INSERT INTO business_number_sequences(document_type, sequence_year, last_value)
SELECT 'REPORT', EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT, MAX(id)
FROM inspection_reports GROUP BY EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT
ON CONFLICT (document_type, sequence_year) DO UPDATE
SET last_value = GREATEST(business_number_sequences.last_value, EXCLUDED.last_value);

INSERT INTO business_number_sequences(document_type, sequence_year, last_value)
SELECT 'INVOICE', EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT, MAX(id)
FROM invoices GROUP BY EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INT
ON CONFLICT (document_type, sequence_year) DO UPDATE
SET last_value = GREATEST(business_number_sequences.last_value, EXCLUDED.last_value);

ALTER TABLE maintenance_requests ALTER COLUMN request_number SET NOT NULL;
ALTER TABLE quotes ALTER COLUMN quote_number SET NOT NULL;
ALTER TABLE inspection_reports ALTER COLUMN report_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_maintenance_requests_request_number ON maintenance_requests(request_number);
CREATE UNIQUE INDEX IF NOT EXISTS ux_quotes_quote_number ON quotes(quote_number);
CREATE UNIQUE INDEX IF NOT EXISTS ux_inspection_reports_report_number ON inspection_reports(report_number);
