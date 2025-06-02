# Pre-Implementation Checklist

## ✅ Required Prerequisites 

Before implementing RAG pipeline and RLS policies, verify these exist in your Supabase database:

### 1. Core Tables (Should Already Exist)
- [ ] `profiles` table
- [ ] `projects` table  
- [ ] `teams` table
- [ ] `team_members` table

### 2. Helper Functions (From Previous RLS Setup)
- [ ] `get_current_profile_id()` function
- [ ] Basic RLS policies on core tables

### 3. Extensions
- [ ] `vector` extension (for pgvector)
- [ ] `uuid-ossp` extension (for UUID generation)

## Quick Verification Queries

Run these in Supabase SQL Editor to verify prerequisites:

```sql
-- Check if core tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'projects', 'teams', 'team_members');

-- Check if helper function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_current_profile_id';

-- Check if vector extension exists
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## Ready to Proceed? ✅

If all prerequisites are met, you can proceed with the implementation using the main guide.

## Missing Prerequisites?

If any items are missing, you may need to:
1. Apply the core RLS policies first
2. Install required extensions
3. Create missing helper functions

**Based on your memories, you should have all prerequisites ready!**
