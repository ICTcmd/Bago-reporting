# Bago Safe - Incident Reporting System

**Bago Safe** is a web-based incident reporting and disaster information system for Bago City, Philippines. The platform enables citizens to report non-emergency incidents to the City Disaster Risk Reduction and Management Office (DRRMO).

## ⚠️ Important Notice

**This is NOT an emergency response system.** For life-threatening emergencies, always call **911** or contact Bago City DRRMO directly.

---

## 🎯 Features

### Public Features (No Account Required)
- ✅ Submit incident reports with photos
- ✅ Track report status using reference number
- ✅ Mobile-responsive design
- ✅ Anonymous reporting option

### Staff Features (Authentication Required)
- ✅ Dashboard with incident statistics
- ✅ View all submitted reports
- ✅ Role-based access control
- 🚧 Report assignment and status management (coming soon)
- 🚧 Internal notes and updates (coming soon)
- 🚧 Advanced analytics (coming soon)

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Maps:** Leaflet + OpenStreetMap
- **Deployment:** Vercel (recommended)

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.17 or later
- **npm** or **yarn**
- **Supabase account** (free tier is sufficient)
- **Vercel account** for deployment (optional)

---

## 🚀 Getting Started

### Step 1: Clone the Repository

```bash
cd "c:\Users\OJTBEEG\Desktop\bago city reporting app\bago-safe"
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize (2-3 minutes)
3. Go to **Project Settings** > **API**
4. Copy your:
   - **Project URL**
   - **anon/public key**
   - **service_role key** (keep this secret!)

### Step 4: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run** to create all tables, policies, and functions

### Step 5: Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **Create bucket**
3. Name: `incident-media`
4. Public bucket: **NO** (keep private)
5. Click **Create bucket**

### Step 6: Set Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_EMERGENCY_HOTLINE=911
   NEXT_PUBLIC_DRRMO_CONTACT=+63-xxx-xxx-xxxx

   # Bago City coordinates
   NEXT_PUBLIC_MAP_CENTER_LAT=10.5380
   NEXT_PUBLIC_MAP_CENTER_LNG=122.8424
   NEXT_PUBLIC_MAP_DEFAULT_ZOOM=13
   ```

### Step 7: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Creating Staff Accounts

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** > **Users** in Supabase dashboard
2. Click **Add user** > **Create new user**
3. Enter email and password
4. After creation, go to **Database** > **Table Editor** > `profiles`
5. Find the user row and change `role` from `citizen` to `responder`, `supervisor`, or `admin`

### Method 2: Via SQL

```sql
-- In Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('staff@bagocity.gov.ph', crypt('YourSecurePassword', gen_salt('bf')), NOW());

-- Update role in profiles table
UPDATE profiles 
SET role = 'responder', full_name = 'DRRMO Staff'
WHERE email = 'staff@bagocity.gov.ph';
```

---

## 🏗️ Project Structure

```
bago-safe/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home page
│   ├── report/                   # Incident reporting
│   │   ├── page.tsx              # Report form
│   │   └── success/page.tsx      # Confirmation page
│   ├── track/page.tsx            # Track report status
│   ├── login/page.tsx            # Staff login
│   ├── dashboard/page.tsx        # Staff dashboard
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── lib/
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   ├── types/
│   │   └── database.ts           # TypeScript types
│   └── utils.ts                  # Utility functions
├── supabase/
│   └── schema.sql                # Database schema
├── middleware.ts                 # Next.js middleware
├── .env.local.example            # Environment template
└── README.md                     # This file
```

---

## 🗄️ Database Schema

### Core Tables

- **profiles** - User profiles (extends auth.users)
- **incidents** - Incident reports
- **incident_media** - Photos/videos attached to incidents
- **incident_updates** - Audit trail of status changes
- **announcements** - Public safety announcements
- **barangays** - List of Bago City barangays

### Security

All tables use **Row Level Security (RLS)** policies:
- Public can submit and view their own reports
- Staff can view/update assigned or unassigned reports
- Supervisors have full access
- Admins have system-wide access

---

## 🚢 Deployment to Vercel

### Via Vercel Dashboard

1. Go to [https://vercel.com](https://vercel.com)
2. Click **Add New** > **Project**
3. Import your GitHub repository
4. Set **Framework Preset** to **Next.js**
5. Add environment variables from `.env.local`
6. Click **Deploy**

### Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts to deploy.

---

## 📱 User Guide

### For Citizens

1. **Submit a Report**
   - Go to homepage → Click "Submit Report"
   - Select incident type and severity
   - Fill in details and location
   - Optionally add photos (max 3, 5MB each)
   - Provide contact information
   - Submit and save your reference number

2. **Track Report Status**
   - Go to homepage → Click "Track Status"
   - Enter your reference number
   - View current status and timeline

### For DRRMO Staff

1. **Login**
   - Go to homepage → Click "Staff Login"
   - Enter your email and password

2. **View Dashboard**
   - See statistics: total reports, new, in progress, resolved
   - View recent incidents table

3. **Manage Reports** (Coming Soon)
   - Assign reports to team members
   - Update status (Under Review → Verified → In Progress → Resolved → Closed)
   - Add internal notes
   - Upload response photos

---

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all database tables
- ✅ Server-side authentication with Supabase Auth
- ✅ Protected routes with middleware
- ✅ Private file storage (photos not publicly accessible)
- ✅ Input validation on client and server
- ✅ Rate limiting on Supabase (100 requests/second)
- ✅ Audit logging of all actions
- ✅ HTTPS encryption (automatic on Vercel)

---

## 🐛 Troubleshooting

### "Report not found" when tracking

- Verify the reference number is correct (format: BS-XXXXX-XXXX)
- Ensure the database schema was applied correctly
- Check Supabase RLS policies are enabled

### Photos not uploading

- Verify storage bucket `incident-media` exists
- Check bucket is **private** (not public)
- Ensure file size is under 5MB
- Check browser console for errors

### Can't login as staff

- Verify email is confirmed in Supabase Auth dashboard
- Check `profiles` table has correct `role` value
- Ensure `.env.local` has correct Supabase credentials

### Database errors

- Re-run the schema SQL in Supabase SQL Editor
- Check all tables were created successfully
- Verify RLS policies are enabled

---

## 📞 Support

For technical support or questions:

- **Email:** ictcmd@bagocity.gov.ph (placeholder)
- **Phone:** +63-xxx-xxx-xxxx (placeholder)
- **Office:** Bago City Hall, Negros Occidental

---

## 📄 License

This project is proprietary software developed for Bago City Government. Unauthorized copying, modification, or distribution is prohibited.

---

## 🙏 Acknowledgments

- Bago City DRRMO
- ICT Command, Bago City
- Inspired by LyfSaver (Quezon City)

---

## 🔮 Roadmap

### Phase 1 (Current - MVP)
- [x] Public incident submission
- [x] Report tracking
- [x] Basic staff dashboard
- [x] Database with RLS
- [x] Photo uploads

### Phase 2 (Next)
- [ ] Full report management (assign, update, notes)
- [ ] Email notifications
- [ ] Advanced filtering and search
- [ ] Map view of incidents
- [ ] Analytics and reporting

### Phase 3 (Future)
- [ ] SMS notifications
- [ ] Mobile app (React Native)
- [ ] Barangay official access
- [ ] Public statistics dashboard
- [ ] Integration with existing city systems
- [ ] AI-powered report categorization

---

**Built with ❤️ for Bago City**
