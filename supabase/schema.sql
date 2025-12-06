-- Create contacts table
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Single-user prototype, so no user_id yet
  name text,
  linkedin_url text NOT NULL,
  company text,
  role text,
  where_we_met text,
  raw_notes text,       -- raw voice transcript or typed notes
  ai_summary text,      -- summarized context of who they are / why we met
  follow_up_goal text,  -- what I want from this relationship
  next_action text,     -- the next step
  message_draft text,   -- suggested DM / email
  due_date date,
  status text CHECK (status IN ('not_started', 'in_progress', 'done')) DEFAULT 'not_started'
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
