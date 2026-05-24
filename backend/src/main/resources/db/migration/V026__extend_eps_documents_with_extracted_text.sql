ALTER TABLE eps.equipment_documents
    ADD COLUMN IF NOT EXISTS extracted_text TEXT;

CREATE INDEX IF NOT EXISTS idx_eps_eq_docs_file_name
    ON eps.equipment_documents(file_name);
