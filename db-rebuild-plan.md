# Database Rebuild Plan (Desvio)

## Goal
Completely reset the database schema and authentication, then repopulate with 20 fresh mock users.

## Tasks
- [ ] **Task 1: Auth Cleanup (User Action)** 
    - Delete all users in Supabase Dashboard > Authentication > Users.
    - Verify: Table is empty.
- [ ] **Task 2: Schema Reset (User Action)** 
    - Run the SQL script from `NUKE_AND_REBUILD_DATABASE.md` in the Supabase SQL Editor.
    - Verify: Tables `users`, `likes`, `matches`, etc., are recreated.
- [ ] **Task 3: Mock Generation (Agent Action)** 
    - Run `node scripts/generate_mocks.js`.
    - Verify: 20 users appear in `auth.users` and `public.users`.
- [ ] **Task 4: Final Verification** 
    - Run `node scripts/test_counts.js` (if exists) or check counts via query.

## Done When
- [ ] Database is clean and follows the new schema.
- [ ] 20 mock users are active and ready for testing.
