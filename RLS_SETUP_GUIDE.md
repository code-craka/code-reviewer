# 🔒 Row Level Security (RLS) Setup Guide

## 🚨 **CRITICAL SECURITY FIX**

Your database currently has **NO security protection** - all tables are publicly accessible! This guide will secure your database with proper Row Level Security policies.

## 📋 **What We're Fixing**

The database linter found these security vulnerabilities:
- ❌ **Profile** - User data exposed
- ❌ **Project** - Code projects exposed  
- ❌ **Team** - Team data exposed
- ❌ **Review/ReviewResult** - Code reviews exposed
- ❌ **BillingDetail/Subscription** - Payment info exposed
- ❌ **ApiKey** - API credentials exposed
- ❌ **Notification** - User notifications exposed

## 🛡️ **Security Model Implemented**

### **Access Control Rules:**
1. **Profile**: Users can only see their own profile
2. **Projects**: Access based on ownership OR team membership
3. **Teams**: Access for team members with role-based permissions
4. **Reviews**: Access for project stakeholders only
5. **Billing**: Strictly personal - no sharing
6. **API Keys**: Personal access only
7. **Notifications**: Personal access only

### **Team Hierarchy:**
- **Owner**: Full control (create, read, update, delete)
- **Admin**: Manage members and projects
- **Member**: Read/write access to team resources
- **Viewer**: Read-only access

## 🚀 **How to Apply the Security Policies**

### **Option 1: Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   ```

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar

3. **Run the Migration**
   - Copy content from `enable_rls_security.sql`
   - Paste into SQL Editor
   - Click "Run" to execute

### **Option 2: Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db reset
# Then apply the migration
psql -h YOUR_DB_HOST -p 5432 -U postgres -d postgres -f enable_rls_security.sql
```

### **Option 3: Direct Database Connection**

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres"

# Run the migration
\i enable_rls_security.sql
```

## 🔍 **Verification Steps**

After applying the policies, test security:

### **1. Test Profile Access**
```sql
-- Should only return current user's profile
SELECT * FROM "Profile";
```

### **2. Test Project Access**
```sql
-- Should only return user's projects + team projects
SELECT * FROM "Project";
```

### **3. Test Team Access**
```sql  
-- Should only return teams user belongs to
SELECT * FROM "Team";
```

### **4. Test Unauthorized Access**
```sql
-- These should return empty results or errors
SELECT * FROM "BillingDetail" WHERE "profileId" != auth.uid();
SELECT * FROM "ApiKey" WHERE "profileId" != auth.uid();
```

## 🛠️ **Helper Functions Created**

The migration creates these utility functions:

1. **`get_current_profile_id()`** - Gets authenticated user's ID
2. **`is_team_member_with_role(team_id, role)`** - Checks team membership
3. **`can_access_project(project_id)`** - Validates project access

## 📝 **Policy Summary**

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| Profile | Own only | Own only | Own only | - |
| Project | Owner/Team | Owner | Owner/Admin | Owner |
| Team | Member | Owner | Owner | Owner |
| Review | Project access | Author | Author | Author |
| BillingDetail | Own only | Own only | Own only | Own only |
| ApiKey | Own only | Own only | Own only | Own only |

## 📁 **Storage Bucket Security (Avatars)**

Your `avatars` storage bucket is now secured with these policies:

### **File Path Structure**
```
avatars/
├── {user-id-1}/
│   └── avatar.jpg
├── {user-id-2}/
│   └── avatar.png
└── {user-id-3}/
    └── avatar.webp
```

### **Access Rules**
- **Upload**: Users can only upload to their own folder (`{user_id}/`)
- **View**: Public read access (for displaying avatars in UI)
- **Update**: Users can only update their own avatar files
- **Delete**: Users can only delete their own avatar files

### **Implementation in Code**
```typescript
// Upload avatar example
const uploadAvatar = async (file: File) => {
  const user = await supabase.auth.getUser();
  const filePath = `${user.data.user?.id}/avatar.${file.name.split('.').pop()}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
    
  return { data, error };
};

// Get avatar URL example
const getAvatarUrl = (userId: string) => {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/avatar.jpg`);
    
  return data.publicUrl;
};
```

## ⚠️ **Important Notes**

1. **Backup First**: Always backup your database before applying
2. **Test Thoroughly**: Verify all app functionality after applying
3. **Team Access**: Existing team memberships determine access
4. **No Breaking Changes**: Policies preserve existing functionality
5. **Prisma Migrations**: The `_prisma_migrations` table is intentionally excluded

## 🔧 **Troubleshooting**

### **Policy Conflicts**
If you get policy errors:
```sql
-- Drop all policies for a table
DROP POLICY IF EXISTS policy_name ON table_name;
-- Then re-run the migration
```

### **Missing Permissions**
If users can't access data they should:
1. Check team memberships in `TeamMember` table
2. Verify project ownership in `Project` table
3. Ensure user is properly authenticated

### **Debug Access Issues**
```sql
-- Check current user
SELECT auth.uid();

-- Check team memberships
SELECT * FROM "TeamMember" WHERE "userId" = auth.uid();

-- Check project ownership
SELECT * FROM "Project" WHERE "ownerId" = auth.uid();
```

## 📞 **Support**

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify user authentication is working
3. Test policies individually
4. Review team and project relationships

## ✅ **After Successful Application**

Your database will be secured with:
- ✅ RLS enabled on all tables
- ✅ User-based access control
- ✅ Team-based permissions
- ✅ Role-based authorization
- ✅ Data isolation and privacy

**Your database security vulnerabilities will be resolved!** 🎉
