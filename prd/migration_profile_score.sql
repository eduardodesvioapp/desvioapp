-- Migration: Add profile_score and city columns and auto-update trigger

-- 1. Add columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_score INT DEFAULT 0;

-- 2. Create calculation function
CREATE OR REPLACE FUNCTION calculate_profile_score()
RETURNS TRIGGER AS $$
DECLARE
    score INT := 0;
BEGIN
    -- Name: 20%
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN
        score := score + 20;
    END IF;

    -- Age: 20%
    IF NEW.age IS NOT NULL THEN
        score := score + 20;
    END IF;

    -- Bio: 20%
    IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN
        score := score + 20;
    END IF;

    -- City: 10%
    IF NEW.city IS NOT NULL AND NEW.city != '' THEN
        score := score + 10;
    END IF;

    -- Gender: 10%
    IF NEW.gender IS NOT NULL AND NEW.gender != '' THEN
        score := score + 10;
    END IF;

    -- Interests: 10% (Checks if array has elements)
    IF NEW.interested_in IS NOT NULL AND array_length(NEW.interested_in, 1) > 0 THEN
        score := score + 10;
    END IF;

    -- Location: 10%
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        score := score + 10;
    END IF;

    NEW.profile_score := score;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger
DROP TRIGGER IF EXISTS tr_update_profile_score ON users;
CREATE TRIGGER tr_update_profile_score
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION calculate_profile_score();

-- 4. Initial update for existing users
UPDATE users SET name = name;
