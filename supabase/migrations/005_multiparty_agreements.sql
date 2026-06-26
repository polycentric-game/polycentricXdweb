-- Multi-party agreements: store all party role IDs on each agreement.
-- Legacy party_a_role_id / party_b_role_id remain as the first two parties for backward compatibility.

ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS party_role_ids UUID[] NOT NULL DEFAULT '{}';

-- Backfill from bilateral columns
UPDATE agreements
SET party_role_ids = ARRAY[party_a_role_id, party_b_role_id]
WHERE cardinality(party_role_ids) = 0
  AND party_a_role_id IS NOT NULL
  AND party_b_role_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agreements_party_role_ids
  ON agreements USING GIN (party_role_ids);
