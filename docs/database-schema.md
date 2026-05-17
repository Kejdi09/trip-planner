# Database schema (source of truth)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username varchar UNIQUE,
  full_name varchar,
  avatar_url text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamp DEFAULT now(),
  CONSTRAINT no_self_friend CHECK (requester_id != receiver_id),
  UNIQUE(requester_id, receiver_id)
);

CREATE TABLE places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar,
  description text,
  city varchar,
  country varchar,
  created_at timestamp DEFAULT now()
);

CREATE TABLE wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  place_id uuid REFERENCES places(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  place_id uuid REFERENCES places(id) ON DELETE CASCADE,
  rating int CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar UNIQUE
);

CREATE TABLE review_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(review_id, tag_id)
);

CREATE TABLE review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  image_url text
);

CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar,
  description text,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('planning','active','completed')),
  voting_deadline timestamp,
  destination_place_id uuid REFERENCES places(id),
  start_date date,
  end_date date,
  min_budget int,
  max_budget int,
  created_at timestamp DEFAULT now()
);

CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamp DEFAULT now(),
  UNIQUE(group_id, user_id)
);
```
