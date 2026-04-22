# 🚀 DealTrack - GitHub Auto-Deploy Instructions

## 📋 Repository Setup

This repository is configured for **automatic deployment** to both Netlify and Vercel when you push to the main branch.

## 🛠️ Quick Setup Commands

```bash
# 1. Initialize your repository (if not done already)
git init
git add .
git commit -m "Initial commit: DealTrack BRRRR Investment Tracker"

# 2. Connect to your GitHub repository
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

## 🔧 Auto-Deploy Options

### Option A: Netlify Auto-Deploy 
1. **Go to** [netlify.com](https://netlify.com) → **New site from Git**
2. **Connect** your GitHub repository
3. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Deploy!** - Auto-deploys on every push to main

### Option B: Vercel Auto-Deploy
1. **Go to** [vercel.com](https://vercel.com) → **New Project**
2. **Import** your GitHub repository
3. **Framework**: Detect automatically (React/Vite)
4. **Deploy!** - Auto-deploys on every push to main

### Option C: GitHub Actions (Advanced)
- Pre-configured workflow in `.github/workflows/deploy.yml`
- Requires Netlify auth tokens in repository secrets
- Fully automated CI/CD pipeline

## 📁 Repository Structure

```
your-repo/
├── src/                 # React source code
├── public/              # Static assets
├── dist/                # Built files (auto-generated)
├── package.json         # Dependencies & scripts
├── vite.config.js       # Build configuration
├── netlify.toml         # Netlify deployment config
├── vercel.json          # Vercel deployment config
└── .github/workflows/   # GitHub Actions (optional)
```

## 🎨 DealTrack Features Included

✅ **DealTrack** professional branding throughout
✅ **White theme** with teal and orange accents
✅ **BRRRR deal tracker** with calculations
✅ **Deal sourcing engine** for distressed properties
✅ **SE Florida market intelligence**
✅ **Mobile PWA** (installable as app)
✅ **Export/Import** backup system
✅ **Professional SEO** optimization

## 🚀 Deploy Commands

### Development
```bash
npm install      # Install dependencies
npm run dev      # Start development server
```

### Production
```bash
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📱 Mobile App

When deployed, users can install as a mobile app:
- **iOS**: Share → Add to Home Screen
- **Android**: Menu → Install App
- **Desktop**: Address bar install icon

## 🔗 Custom Domain (Optional)

After deployment:
1. **Netlify**: Site settings → Domain management
2. **Vercel**: Project → Domains
3. **Suggested domains**:
   - `dealtrack.com`
   - `app.dealtrack.com`
   - `brrrr.dealtrack.com`

---

## ✅ Ready to Deploy!

Your **DealTrack BRRRR Investment Tracker** is ready for professional use! 🎯📈
