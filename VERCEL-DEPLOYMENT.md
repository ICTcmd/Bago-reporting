# Vercel Deployment Guide - Bago Safe

## 🚀 Quick Deploy to Vercel

### Step 1: Push Code to GitHub ✅
Your code is already on GitHub at: https://github.com/ICTcmd/Bago-reporting

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/
2. Click **"Add New"** → **"Project"**
3. Select **"Import Git Repository"**
4. Choose your GitHub account and select **"Bago-reporting"**
5. Vercel will auto-detect Next.js settings
6. Click **"Deploy"** (Don't add environment variables yet - we'll add them after)

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd "c:\Users\OJTBEEG\Desktop\bago city reporting app\bago-safe"
vercel --prod
```

---

## 🔐 Step 3: Add Environment Variables

After your first deployment, add these environment variables in Vercel:

### In Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable below:

### Required Variables:

```env
# Supabase Configuration (from your Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_EMERGENCY_HOTLINE=911
NEXT_PUBLIC_DRRMO_CONTACT=+63-xxx-xxx-xxxx

# Map Configuration (Bago City coordinates)
NEXT_PUBLIC_MAP_CENTER_LAT=10.5380
NEXT_PUBLIC_MAP_CENTER_LNG=122.8424
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=13
```

### ⚠️ Important:
- Replace `your-project.vercel.app` with your actual Vercel domain
- Get Supabase keys from: Supabase Dashboard → Settings → API
- Add real DRRMO contact number

---

## ✅ Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the **"..."** menu on latest deployment
3. Click **"Redeploy"**

---

## 🔒 Step 5: Configure Supabase for Production

### Update Supabase Auth Settings:
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL**: `https://your-project.vercel.app`
3. Add to **Redirect URLs**:
   - `https://your-project.vercel.app/auth/callback`
   - `https://your-project.vercel.app/login`
   - `https://your-project.vercel.app/dashboard`

### Update Supabase Storage CORS:
1. Go to **Storage** → **Policies**
2. Ensure bucket `incident-media` allows access from your Vercel domain

---

## 🎯 Step 6: Test Production Deployment

Visit your Vercel URL and test:
- ✅ Homepage loads
- ✅ Report submission works
- ✅ Track report works
- ✅ Staff login works
- ✅ Dashboard loads with map
- ✅ Map markers display correctly
- ✅ Bottom navigation works

---

## 📱 Custom Domain (Optional)

### Add Custom Domain:
1. Go to Vercel project → **Settings** → **Domains**
2. Add your domain (e.g., `bagosafe.bagocity.gov.ph`)
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` environment variable
5. Update Supabase redirect URLs with new domain

---

## 🐛 Troubleshooting

### Issue: "Environment variables not found"
**Solution:** Make sure you clicked "Redeploy" after adding environment variables

### Issue: "Supabase connection failed"
**Solution:** 
- Verify Supabase URL and keys are correct
- Check Supabase project is running
- Verify no extra spaces in environment variables

### Issue: "Auth redirect not working"
**Solution:** 
- Add Vercel URL to Supabase redirect URLs
- Update `NEXT_PUBLIC_APP_URL` to match Vercel domain

### Issue: "Map not loading"
**Solution:**
- Clear browser cache
- Check browser console for errors
- Verify Leaflet CSS is imported in globals.css

### Issue: "Photos not uploading"
**Solution:**
- Verify storage bucket `incident-media` exists in Supabase
- Check bucket permissions and RLS policies

---

## 📊 Monitoring & Analytics

### Enable Vercel Analytics:
1. Go to project → **Analytics** tab
2. Click **"Enable Analytics"**
3. Monitor page views, performance, and errors

### Enable Vercel Speed Insights:
1. Go to project → **Speed Insights** tab
2. Click **"Enable Speed Insights"**
3. Monitor Core Web Vitals

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Your commit message"
git push origin main

# Vercel will automatically:
# 1. Detect the push
# 2. Build the project
# 3. Deploy to production
# 4. Takes ~2-3 minutes
```

---

## 🚦 Deployment Checklist

Before going live:
- [ ] GitHub repository is public or Vercel has access
- [ ] All environment variables added in Vercel
- [ ] Supabase database schema is applied
- [ ] Supabase redirect URLs include Vercel domain
- [ ] Storage bucket `incident-media` exists
- [ ] Test staff account created in Supabase
- [ ] Emergency hotline number is correct
- [ ] DRRMO contact number is correct
- [ ] Tested report submission on production
- [ ] Tested staff login on production
- [ ] Tested dashboard and map view
- [ ] Mobile responsiveness tested
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)

---

## 📞 Production URLs

After deployment, you'll have:
- **Production URL:** https://your-project.vercel.app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/your-project
- **GitHub Repo:** https://github.com/ICTcmd/Bago-reporting
- **Vercel Dashboard:** https://vercel.com/your-username/your-project

---

## 🎉 Post-Deployment

After successful deployment:
1. Share production URL with DRRMO staff for testing
2. Create staff accounts in Supabase
3. Submit test reports to verify workflow
4. Monitor Vercel logs for errors
5. Set up error tracking (optional: Sentry)
6. Create user documentation for DRRMO staff
7. Train staff on system usage

---

## 🔐 Security Reminders

- ✅ Never commit `.env.local` to GitHub
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- ✅ Use environment variables for all sensitive data
- ✅ Enable Vercel authentication for production deployment previews
- ✅ Regularly update dependencies for security patches
- ✅ Monitor Supabase auth logs for suspicious activity
- ✅ Set up rate limiting in Supabase if needed

---

## 📝 Next Steps After Deployment

1. **Build Incident Detail Page** - Allow staff to manage incidents
2. **Add Status Updates** - Workflow for updating incident status
3. **Implement Filtering** - Search and filter incidents
4. **Add Notifications** - Email/SMS alerts
5. **Analytics Dashboard** - Reports and metrics
6. **Mobile App** - React Native app (future)

---

**Deployment Date:** October 22, 2026  
**Status:** Ready for Vercel Deployment  
**Contact:** ICT Command, Bago City
