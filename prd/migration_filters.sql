-- Migration: Add extra filter columns to users table

-- 1. Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS height INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hair_color TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS eyes_color TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifestyle TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation TEXT;

-- 2. Create a distance function (Haversine)
-- This allows us to filter by distance in KM
CREATE OR REPLACE FUNCTION get_users_within_distance(
  user_lat FLOAT, 
  user_lon FLOAT, 
  max_dist_km FLOAT,
  min_age INT,
  max_age INT
)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM users
  WHERE 
    (6371 * acos(
      cos(radians(user_lat)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(user_lon)) + 
      sin(radians(user_lat)) * sin(radians(latitude))
    )) <= max_dist_km
    AND age >= min_age
    AND age <= max_age;
END;
$$ LANGUAGE plpgsql STABLE;
