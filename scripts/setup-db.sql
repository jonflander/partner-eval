-- SEVN Partner Evaluation Storage Schema
-- Create evaluations table to store completed partner evaluations

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Decision & scoring metadata
  decision VARCHAR(50),
  total_weighted_score DECIMAL(10, 1),
  max_possible_score INT,
  normalized_score DECIMAL(5, 1),
  
  -- Tier weights used in this evaluation
  tier1_weight INT DEFAULT 3,
  tier2_weight INT DEFAULT 2,
  tier3_weight INT DEFAULT 1,
  
  -- Full evaluation data stored as JSONB for flexibility
  criteria_data JSONB,
  key_risks TEXT[],
  key_upsides TEXT[],
  summary_narrative TEXT,
  
  -- For querying & sorting
  created_by_user VARCHAR(255),
  notes TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_evaluations_partner_name ON evaluations(partner_name);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_decision ON evaluations(decision);
