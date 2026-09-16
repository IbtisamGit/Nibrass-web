-- ==========================================
-- AI Learning Materials Web - Database Schema
-- Day 1: Supabase Setup
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Links to auth.users and stores user-specific data
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. LESSONS TABLE
-- user_id is nullable to support guest sessions (anonymous users)
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty_level TEXT,
    summary_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. FLASHCARDS TABLE
-- Linked to lessons
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL
);

-- 4. MCQ QUESTIONS TABLE
-- Linked to lessons, stores options as JSONB
CREATE TABLE mcq_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL
);

-- 5. TEST RESULTS TABLE
-- user_id is nullable for guest sessions
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- Lessons Policies
-- Allows users to manage their own lessons, and allows everyone to manage anonymous lessons
CREATE POLICY "Manage lessons" 
    ON lessons FOR ALL USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Flashcards Policies
-- Access is granted if the user owns the parent lesson, or if the parent lesson is anonymous
CREATE POLICY "Manage flashcards" 
    ON flashcards FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = flashcards.lesson_id 
            AND (lessons.user_id = auth.uid() OR lessons.user_id IS NULL)
        )
    );

-- MCQ Questions Policies
CREATE POLICY "Manage mcq_questions" 
    ON mcq_questions FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = mcq_questions.lesson_id 
            AND (lessons.user_id = auth.uid() OR lessons.user_id IS NULL)
        )
    );

-- Test Results Policies
CREATE POLICY "Manage test results" 
    ON test_results FOR ALL USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (
      new.id, 
      new.raw_user_meta_data->>'username', -- Extracts username from metadata if provided during signup
      now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
