
# 🔐 Abnormal File Vault

A production-grade file hosting application with smart deduplication, secure authentication, and advanced search capabilities.

## ✨ Features

- **🔐 Secure Authentication**: Email/password authentication with Supabase
- **📁 File Upload & Management**: Drag-and-drop file uploads with real-time progress
- **🚀 Smart Deduplication**: Automatic duplicate detection using SHA256 hashing
- **🔍 Advanced Search**: Search by filename, type, and upload date
- **📊 Analytics Dashboard**: File statistics and storage insights
- **🎨 Modern UI**: Responsive design with Tailwind CSS and shadcn/ui
- **☁️ Cloud Storage**: Secure file storage with Supabase Storage
- **🔒 Row Level Security**: Database-level security policies

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Build Tool**: Vite
- **Package Manager**: Bun

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ or Bun
- A Supabase account

### 1. unzip the folder

```bash
cd abnormal-file-vault
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Set Up Supabase

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Configure the database** by running the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create files table
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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own files" ON public.files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" ON public.files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON public.files  
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON public.files
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', false);

-- Create storage policies
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. **Update your Supabase configuration** in `src/integrations/supabase/client.ts`:
   - Replace the URL and anon key with your project's credentials

4. **Configure Authentication URLs** in your Supabase dashboard:
   - Go to Authentication > URL Configuration
   - Set Site URL to your app's URL
   - Add your app's URL to Redirect URLs

### 4. Run the Development Server

```bash
# Using Bun
bun run dev

# Or using npm
npm run dev
```

The app will be available at `http://localhost:8080`

## 📖 Usage Guide

### 1. **Sign Up / Login**
- Create a new account or login with existing credentials
- Email verification is required for new accounts

### 2. **Upload Files**
- Click "Upload Files" button
- Drag and drop files or click to browse
- Files are automatically deduplicated using SHA256 hashes
- Real-time upload progress is displayed

### 3. **Manage Files**
- View all your uploaded files in the dashboard
- Search files by name or type
- Download files by clicking the download button
- Delete files with confirmation dialog

### 4. **File Deduplication**
- Duplicate files are automatically detected
- Only one copy is stored, saving storage space
- Each user maintains their own file list

## 🏗️ Architecture

### Database Schema

```
profiles
├── id (UUID, references auth.users)
├── username (TEXT, unique)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

files
├── id (UUID, primary key)
├── name (TEXT)
├── size (BIGINT)
├── type (TEXT)
├── hash (TEXT, for deduplication)
├── user_id (UUID, references auth.users)
├── storage_path (TEXT)
└── created_at (TIMESTAMP)
```

### File Deduplication Logic

1. When a file is uploaded, calculate SHA256 hash
2. Check if hash already exists in database
3. If exists: Create new file record pointing to existing storage
4. If new: Upload to storage and create new file record

### Security

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: Supabase handles secure authentication
- **File Storage**: Secure file storage with access controls
- **Input Validation**: Client and server-side validation



### Environment Variables

The app uses Supabase configuration from `src/integrations/supabase/client.ts`. Update the following:

```typescript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_ANON_KEY";
```

### Supabase Configuration

1. **Authentication**:
   - Enable Email authentication
   - Configure email templates
   - Set up redirect URLs

2. **Storage**:
   - Create 'files' bucket
   - Configure storage policies
   - Set up file size limits

3. **Database**:
   - Run the provided SQL migrations
   - Set up RLS policies
   - Configure database backups

## 🔍 Troubleshooting

### Common Issues

1. **"User not found" error**:
   - Ensure user is authenticated
   - Check RLS policies are correctly configured

2. **File upload fails**:
   - Check storage bucket exists
   - Verify storage policies are set up
   - Ensure file size is within limits

3. **Authentication not working**:
   - Verify Supabase URLs are correct
   - Check authentication settings
   - Ensure redirect URLs are configured

### Debug Mode

Enable debug mode by adding this to your browser console:
```javascript
localStorage.setItem('debug', 'supabase:*');
```


**Happy file hosting! 🚀**
