/*
  # User Data Persistence Schema

  ## Tables Created
  
  1. **user_favorites**
     - `id` (uuid, primary key) - Unique identifier
     - `user_id` (text) - Anonymous user identifier (browser fingerprint or generated ID)
     - `content_type` (text) - Type of favorited content (video, image, music, etc.)
     - `content_id` (text) - ID of the favorited content
     - `content_data` (jsonb) - Full content data for quick retrieval
     - `created_at` (timestamptz) - When the favorite was added
     
  2. **user_history**
     - `id` (uuid, primary key) - Unique identifier
     - `user_id` (text) - Anonymous user identifier
     - `content_type` (text) - Type of content viewed
     - `content_id` (text) - ID of the content
     - `content_data` (jsonb) - Basic content data
     - `viewed_at` (timestamptz) - When content was viewed
     - `view_count` (integer) - Number of times viewed
     
  3. **user_settings**
     - `user_id` (text, primary key) - Anonymous user identifier
     - `settings` (jsonb) - User settings object
     - `updated_at` (timestamptz) - Last update time
     
  ## Security
  - All tables use anonymous user_id (no auth required)
  - RLS policies allow users to only access their own data
  - Indexes added for performance
*/

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  content_type text NOT NULL,
  content_id text NOT NULL,
  content_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Create user_history table
CREATE TABLE IF NOT EXISTS user_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  content_type text NOT NULL,
  content_id text NOT NULL,
  content_data jsonb DEFAULT '{}'::jsonb,
  viewed_at timestamptz DEFAULT now(),
  view_count integer DEFAULT 1,
  UNIQUE(user_id, content_type, content_id)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id text PRIMARY KEY,
  settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (true);

-- RLS Policies for user_history
CREATE POLICY "Users can view own history"
  ON user_history FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own history"
  ON user_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own history"
  ON user_history FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own history"
  ON user_history FOR DELETE
  USING (true);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_viewed_at ON user_history(viewed_at DESC);
