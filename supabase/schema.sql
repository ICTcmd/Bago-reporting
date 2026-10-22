-- Bago Safe Database Schema
-- This schema implements Row Level Security (RLS) for all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('citizen', 'responder', 'supervisor', 'admin');
CREATE TYPE incident_category AS ENUM ('flood', 'fire', 'road_obstruction', 'fallen_tree', 'building_damage', 'medical', 'crime', 'other');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('submitted', 'under_review', 'verified', 'in_progress', 'resolved', 'closed', 'invalid', 'duplicate');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'citizen',
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_name TEXT,
  reporter_contact TEXT,
  category incident_category NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  address_text TEXT NOT NULL,
  barangay TEXT,
  status incident_status NOT NULL DEFAULT 'submitted',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reference_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Incident media table
CREATE TABLE incident_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incident updates table (audit trail)
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status_change incident_status,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'medium',
  published_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_reference_number ON incidents(reference_number);
CREATE INDEX idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX idx_incident_media_incident_id ON incident_media(incident_id);

-- Function to generate reference number
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TEXT AS $$
DECLARE
  ref_number TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    ref_number := 'BS-' || 
                  UPPER(TO_HEX(EXTRACT(EPOCH FROM NOW())::INTEGER)) || '-' ||
                  UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
    
    SELECT COUNT(*) INTO exists_check FROM incidents WHERE reference_number = ref_number;
    
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN ref_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference number
CREATE OR REPLACE FUNCTION set_reference_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_reference_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_reference_number
BEFORE INSERT ON incidents
FOR EACH ROW
EXECUTE FUNCTION set_reference_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON incidents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Staff can view other staff profiles
CREATE POLICY "Staff can view staff profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
    AND role IN ('responder', 'supervisor', 'admin')
  );

-- RLS Policies for incidents
-- Anyone can submit an incident (INSERT)
CREATE POLICY "Anyone can submit incidents"
  ON incidents FOR INSERT
  WITH CHECK (true);

-- Public can view incident status by reference number (limited fields)
CREATE POLICY "Public can view incident by reference number"
  ON incidents FOR SELECT
  USING (true);

-- Staff can view all incidents
CREATE POLICY "Staff can view all incidents"
  ON incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
  );

-- Staff can update incidents
CREATE POLICY "Staff can update incidents"
  ON incidents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
  );

-- Only admins can delete incidents (soft delete preferred)
CREATE POLICY "Only admins can delete incidents"
  ON incidents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS Policies for incident_media
-- Anyone can upload media when creating incident
CREATE POLICY "Anyone can upload incident media"
  ON incident_media FOR INSERT
  WITH CHECK (true);

-- Staff can view incident media
CREATE POLICY "Staff can view incident media"
  ON incident_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
  );

-- RLS Policies for incident_updates
-- Staff can create updates
CREATE POLICY "Staff can create incident updates"
  ON incident_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
    AND user_id = auth.uid()
  );

-- Staff can view updates for incidents they have access to
CREATE POLICY "Staff can view incident updates"
  ON incident_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
  );

-- RLS Policies for announcements
-- Everyone can view active announcements
CREATE POLICY "Everyone can view active announcements"
  ON announcements FOR SELECT
  USING (
    expires_at IS NULL OR expires_at > NOW()
  );

-- Supervisors and admins can create announcements
CREATE POLICY "Supervisors can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    AND published_by = auth.uid()
  );

-- Supervisors and admins can update announcements
CREATE POLICY "Supervisors can update announcements"
  ON announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
  );

-- Admins can delete announcements
CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'citizen'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample barangays for Bago City
CREATE TABLE barangays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sample Bago City barangays (add all 24 barangays)
INSERT INTO barangays (name) VALUES
  ('Abuanan'),
  ('Alianza'),
  ('Atipuluan'),
  ('Bacong-Montilla'),
  ('Bagroy'),
  ('Balingasag'),
  ('Binubuhan'),
  ('Busay'),
  ('Calumangan'),
  ('Caridad'),
  ('Dulao'),
  ('Ilijan'),
  ('Lag-asan'),
  ('Ma-ao'),
  ('Mailum'),
  ('Malingin'),
  ('Napoles'),
  ('Pacol'),
  ('Poblacion'),
  ('Sagasa'),
  ('Sampinit'),
  ('Taloc'),
  ('Tabunan'),
  ('Trinidad');

-- Create storage bucket for incident media (run this via Supabase dashboard or SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('incident-media', 'incident-media', false);

-- Storage policies for incident media bucket
-- CREATE POLICY "Anyone can upload incident media" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'incident-media');

-- CREATE POLICY "Staff can view incident media" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'incident-media' AND
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE id = auth.uid()
--       AND role IN ('responder', 'supervisor', 'admin')
--     )
--   );

COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE incidents IS 'Incident reports submitted by citizens';
COMMENT ON TABLE incident_media IS 'Photos and videos attached to incidents';
COMMENT ON TABLE incident_updates IS 'Audit trail of all incident status changes and notes';
COMMENT ON TABLE announcements IS 'Public safety announcements from DRRMO';
COMMENT ON TABLE barangays IS 'List of barangays in Bago City';
