# RAG Pipeline & RLS Implementation Guide

## Prerequisites ✅
- Supabase project set up and running
- Local development environment connected to Supabase
- Backup of current database (recommended)

## Implementation Order

### Step 1: Apply RAG Pipeline Migration
```sql
-- File: create_rag_pipeline.sql
-- This creates the new tables and enums for RAG functionality
```

### Step 2: Apply RLS Policies  
```sql
-- File: rag_rls_policies.sql
-- This secures the new RAG tables with Row Level Security
```

## Method 1: Supabase Dashboard (Recommended)

### 1. Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### 2. Apply RAG Pipeline Migration
1. Copy the entire content of `create_rag_pipeline.sql`
2. Paste into SQL Editor
3. Click **Run** to execute
4. Verify tables were created successfully

### 3. Apply RLS Policies
1. Copy the entire content of `rag_rls_policies.sql`
2. Paste into SQL Editor  
3. Click **Run** to execute
4. Verify policies were applied

## Method 2: Supabase CLI

### 1. Apply Migrations via CLI
```bash
# Navigate to your project root
cd /Users/rihan/Downloads/ai-code-reviewer

# Apply the RAG pipeline migration
supabase db push

# Or apply specific migration files
npx supabase db push --file supabase/migrations/create_rag_pipeline.sql
npx supabase db push --file supabase/migrations/rag_rls_policies.sql
```

## Method 3: Direct SQL Execution

### 1. Connect to Database
```bash
# Get your database connection details from Supabase dashboard
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

### 2. Execute Migration Files
```sql
-- Apply RAG pipeline
\i /path/to/create_rag_pipeline.sql

-- Apply RLS policies
\i /path/to/rag_rls_policies.sql
```

## Verification Steps

### 1. Check Tables Created
```sql
-- Verify RAG tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('review_requests', 'cr_messages', 'cr_embeddings', 'review_analytics');
```

### 2. Check Enums Created
```sql
-- Verify enums exist
SELECT typname FROM pg_type 
WHERE typname IN ('review_status', 'message_type', 'ai_model_type');
```

### 3. Verify RLS Policies
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('review_requests', 'cr_messages', 'cr_embeddings', 'review_analytics');

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('review_requests', 'cr_messages', 'cr_embeddings', 'review_analytics');
```

### 4. Test Helper Functions
```sql
-- Test helper function
SELECT can_access_project_for_review('your-project-uuid-here');
```

## Post-Implementation

### 1. Update Prisma Schema
```bash
# Regenerate Prisma client with new tables
pnpm prisma db pull
pnpm prisma generate
```

### 2. Test Application
1. Start development server: `pnpm dev`
2. Test RAG pipeline functionality
3. Verify security policies work correctly

### 3. Deploy Edge Function
```bash
# Deploy the RAG pipeline Edge Function
supabase functions deploy rag-pipeline
```

## Troubleshooting

### Common Issues

**1. Permission Errors**
- Ensure you have sufficient database privileges
- Check if you're using service role key for admin operations

**2. Dependency Errors**
- Apply migrations in correct order (RAG pipeline first, then RLS)
- Ensure core tables (profiles, projects, teams) exist first

**3. Function Errors**
- Verify `get_current_profile_id()` function exists from previous RLS setup
- Check if all referenced tables and columns exist

## Success Indicators ✅

- [ ] All 4 RAG tables created successfully
- [ ] 3 new enums created (review_status, message_type, ai_model_type)  
- [ ] RLS enabled on all RAG tables
- [ ] Security policies applied and functional
- [ ] Helper functions working correctly
- [ ] No errors in Supabase logs
- [ ] Application connects successfully to new tables

## Next Steps After Implementation

1. **Test RAG Pipeline**: Submit a test code review to verify end-to-end flow
2. **Monitor Performance**: Check query performance and optimize if needed
3. **Test Security**: Verify RLS policies prevent unauthorized access
4. **Deploy Edge Function**: Enable the RAG pipeline endpoint
5. **Update Frontend**: Add UI components to display RAG metadata

## Support

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify all prerequisite tables exist
3. Ensure proper permissions are set
4. Test with a simple query first

---

**Ready to implement?** Choose your preferred method above and follow the steps!
