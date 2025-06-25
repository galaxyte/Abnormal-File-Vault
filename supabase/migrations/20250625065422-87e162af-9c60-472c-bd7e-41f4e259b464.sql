
-- Create profiles table to store additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (id)
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create files table for file storage metadata
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  hash TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (id)
);

-- Enable RLS for files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create policies for files
CREATE POLICY "Users can view own files" ON public.files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" ON public.files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON public.files  
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON public.files
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for file deduplication
CREATE INDEX idx_files_hash ON public.files(hash);

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
