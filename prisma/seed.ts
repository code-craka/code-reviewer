
import { PrismaClient } from '@prisma/client';
import { createClient, User } from '@supabase/supabase-js'; // Imported User type

const prisma = new PrismaClient();

// Initialize Supabase client FOR SEEDING AUTH USERS ONLY
// Ensure these are set in your .env for the seeding script to run
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    'Supabase URL or Service Role Key is not set in environment variables. Skipping Supabase auth user seeding.'
  );
  // process.exit(1); // Optionally exit if Supabase seeding is critical
}

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

async function main() {
  console.log('Start seeding ...');

  let testUser1: User | undefined;
  let testUser2: User | undefined;

  if (supabaseAdmin) {
    // --- Seed Supabase Auth User 1 ---
    const testUser1Email = 'testuser1@example.com';
    const testUser1Password = 'password123'; // Change this for actual use

    console.log(`Attempting to ensure Supabase auth user ${testUser1Email} exists...`);
    let { data: user1CreateData, error: user1CreateError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser1Email,
      password: testUser1Password,
      email_confirm: true, // Auto-confirm email for seed user
      user_metadata: {
        user_name: 'TestUserOne',
        full_name: 'Test User One',
      },
    });

    if (user1CreateData?.user) {
      testUser1 = user1CreateData.user;
      console.log(`Created Supabase auth user ${testUser1Email} with ID: ${testUser1.id}`);
    } else if (user1CreateError && (user1CreateError.message.includes('User already registered') || (user1CreateError as any)?.message.includes('already registered') || (user1CreateError as any)?.status === 422)) {
      console.log(`Supabase auth user ${testUser1Email} already exists. Fetching...`);
      const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers(); // Consider pagination for large user bases
      if (listError) {
        console.error(`Error listing users to find ${testUser1Email}:`, listError);
      } else {
        testUser1 = usersList.users.find(u => u.email === testUser1Email);
        if (testUser1) {
          console.log(`Found existing Supabase auth user ${testUser1Email} with ID: ${testUser1.id}`);
        } else {
          console.error(`User ${testUser1Email} reported as existing by createUser, but not found in listUsers. This indicates a potential issue.`);
        }
      }
    } else if (user1CreateError) {
      console.error(`Error processing Supabase auth user ${testUser1Email}:`, user1CreateError);
    }

    // --- Seed Supabase Auth User 2 ---
    const testUser2Email = 'testuser2@example.com';
    const testUser2Password = 'password123'; // Change this

    console.log(`Attempting to ensure Supabase auth user ${testUser2Email} exists...`);
    let { data: user2CreateData, error: user2CreateError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser2Email,
      password: testUser2Password,
      email_confirm: true,
      user_metadata: {
        user_name: 'TestUserTwo',
        full_name: 'Test User Two',
      },
    });
    if (user2CreateData?.user) {
      testUser2 = user2CreateData.user;
      console.log(`Created Supabase auth user ${testUser2Email} with ID: ${testUser2.id}`);
    } else if (user2CreateError && (user2CreateError.message.includes('User already registered') || (user2CreateError as any)?.message.includes('already registered') || (user2CreateError as any)?.status === 422 )) {
      console.log(`Supabase auth user ${testUser2Email} already exists. Fetching...`);
      const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error(`Error listing users to find ${testUser2Email}:`, listError);
      } else {
        testUser2 = usersList.users.find(u => u.email === testUser2Email);
        if (testUser2) {
          console.log(`Found existing Supabase auth user ${testUser2Email} with ID: ${testUser2.id}`);
        } else {
          console.error(`User ${testUser2Email} reported as existing by createUser, but not found in listUsers.`);
        }
      }
    } else if (user2CreateError) {
      console.error(`Error processing Supabase auth user ${testUser2Email}:`, user2CreateError);
    }

  } else {
    console.warn("Supabase admin client not initialized. Skipping auth user creation/fetching. Profile seeding might fail or use placeholder IDs.");
  }


  // --- Seed Profiles (ensure these match Supabase auth user IDs if created) ---
  if (testUser1) {
    await prisma.profile.upsert({
      where: { id: testUser1.id },
      update: { // Ensure fields are updated if user was fetched and might have newer metadata
        email: testUser1.email!, // email should always exist for a Supabase user
        username: testUser1.user_metadata?.user_name || 'TestUserOne_updated',
        profilePictureUrl: testUser1.user_metadata?.avatar_url || `https://avatar.iran.liara.run/username?username=${testUser1.user_metadata?.user_name || 'TestUserOne'}`,
      },
      create: {
        id: testUser1.id,
        email: testUser1.email!,
        username: testUser1.user_metadata?.user_name || 'TestUserOne',
        profilePictureUrl: testUser1.user_metadata?.avatar_url || `https://avatar.iran.liara.run/username?username=${testUser1.user_metadata?.user_name || 'TestUserOne'}`,
      },
    });
    console.log(`Upserted profile for ${testUser1.email}`);
  } else {
    console.log('Skipped profile for testUser1 as Supabase user object is not available or could not be fetched.');
  }

  if (testUser2) {
    await prisma.profile.upsert({
      where: { id: testUser2.id },
      update: {
        email: testUser2.email!,
        username: testUser2.user_metadata?.user_name || 'TestUserTwo_updated',
        profilePictureUrl: testUser2.user_metadata?.avatar_url || `https://avatar.iran.liara.run/username?username=${testUser2.user_metadata?.user_name || 'TestUserTwo'}`,
      },
      create: {
        id: testUser2.id,
        email: testUser2.email!,
        username: testUser2.user_metadata?.user_name || 'TestUserTwo',
        profilePictureUrl: testUser2.user_metadata?.avatar_url || `https://avatar.iran.liara.run/username?username=${testUser2.user_metadata?.user_name || 'TestUserTwo'}`,
      },
    });
    console.log(`Upserted profile for ${testUser2.email}`);
  } else {
    console.log('Skipped profile for testUser2 as Supabase user object is not available or could not be fetched.');
  }

  // --- Seed Projects ---
  if (testUser1) {
    await prisma.project.upsert({
      where: { id: 'cl_seed_project_1' }, // Use a predictable ID for seed data if needed, or let Prisma generate
      update: {}, // No specific updates if it exists for this simple seed
      create: {
        id: 'cl_seed_project_1',
        userId: testUser1.id,
        name: 'My First JS Project',
        code: `function greet(name) {\n  console.log(\`Hello, \${name}!\`);\n}\ngreet('World');`,
      },
    });
    await prisma.project.upsert({
       where: { id: 'cl_seed_project_2' },
       update: {},
      create: {
        id: 'cl_seed_project_2',
        userId: testUser1.id,
        name: 'Python Data Analyzer',
        code: `import pandas as pd\n\ndef analyze_data(data):\n  df = pd.DataFrame(data)\n  print(df.describe())\n# TODO: Add more complex analysis`,
      },
    });
    console.log(`Seeded projects for ${testUser1.email}`);
  } else {
    console.log('Skipped projects for testUser1 as Supabase user object is not available.');
  }

  if (testUser2) {
    await prisma.project.upsert({
      where: { id: 'cl_seed_project_3' },
      update: {},
      create: {
        id: 'cl_seed_project_3',
        userId: testUser2.id,
        name: 'Next.js App Structure',
        code: `// app/layout.tsx\nexport default function RootLayout({ children }) {\n  return (\n    <html>\n      <body>{children}</body>\n    </html>\n  );\n}`,
      },
    });
    console.log(`Seeded projects for ${testUser2.email}`);
  } else {
    console.log('Skipped projects for testUser2 as Supabase user object is not available.');
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });