ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_legal_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_tax_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_commercial_registration TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS zatca_qr_payload TEXT;

UPDATE invoices i
SET supplier_legal_name = w.name,
    supplier_address = w.address,
    supplier_tax_number = w.tax_number,
    supplier_commercial_registration = w.commercial_registration
FROM workshops w
WHERE i.workshop_id = w.id
  AND i.supplier_legal_name IS NULL;
