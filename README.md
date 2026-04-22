# DealTrack - BRRRR Investment Tracker

Professional real estate investment tracker for SE Florida BRRRR deals. Analyze properties, track deals, find distressed listings, and manage your rental portfolio.

## 🚀 Quick Deploy (Recommended)

### Option 1: Deploy to Vercel (FREE)
1. **Install Vercel CLI**: `npm i -g vercel`
2. **Deploy**: `npm run deploy`
3. **Follow prompts** to connect your GitHub and deploy
4. **Done!** Your app is live at `https://your-app.vercel.app`

### Option 2: Deploy to Netlify (FREE)
1. **Build**: `npm run build`
2. **Drag `dist/` folder** to [netlify.com/drop](https://netlify.com/drop)
3. **Done!** Your app is live instantly

### Option 3: GitHub Pages (FREE)
1. **Push to GitHub**
2. **Enable Pages** in Settings → Pages → Source: GitHub Actions
3. **Done!** Live at `https://username.github.io/repo-name`

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📱 Mobile App Experience

This app works as a **Progressive Web App (PWA)**:
- **iOS**: Safari → Share → "Add to Home Screen"
- **Android**: Chrome → Menu → "Add to Home Screen"
- **Desktop**: Chrome → Install button in address bar

## 🔧 Configuration

### API Setup (Required for Deal Sourcing)
1. Go to [RapidAPI Realtor Data](https://rapidapi.com/s.mahmoud97/api/realtor16)
2. Sign up (FREE - 100 requests/month)
3. Copy your API key
4. Paste in the app's "API Configuration" panel

### Customization
Edit these files to customize:
- `src/App.jsx` - Main app logic and styling
- `public/manifest.json` - App name, colors, icons
- `index.html` - Meta tags, title, description

## 📊 Features

### ✅ Deal Tracker
- **Letter Grades** (A+ to F) for every deal
- **70% Rule** validation with MAO calculations  
- **Exit Strategy Comparison**: Flip vs BRRRR-LTR vs BRRRR-STR
- **Cash Flow Projections** with detailed expense modeling
- **Pipeline Management** from prospecting to rented

### ✅ Deal Sourcing Engine  
- **Distressed Property Search** across Miami-Dade, Broward, Palm Beach
- **AI-Powered Scoring** for renovation potential
- **MLS Integration** via RapidAPI (100 free searches/month)
- **One-Click Import** to deal tracker

### ✅ SE Florida Market Intel
- **40+ Cities** with STR regulations and ADR benchmarks
- **BRRRR Suitability Scores** for each market
- **Distressed Property Sources** and due diligence checklists
- **FL-Specific Guidance** (4-point inspections, wind mit, insurance)

### ✅ Advanced Analytics
- **Portfolio Dashboard** with equity tracking
- **Refinance Modeling** (DSCR loans, cash-out scenarios)  
- **STR vs LTR Comparison** with occupancy and ADR modeling
- **Deal Scoring Algorithm** weighted by fundamentals

## 🏗️ Architecture

- **Frontend**: React 18 + Vite
- **Storage**: Browser localStorage (persistent across sessions)
- **Styling**: Custom CSS with design system
- **Icons**: Lucide React
- **APIs**: RapidAPI Realtor Data (optional)

## 📁 Project Structure

```
brrrr-app/
├── src/
│   ├── App.jsx           # Main React component
│   └── main.jsx          # Entry point
├── public/
│   ├── manifest.json     # PWA manifest
│   └── favicon.svg       # App icon
├── package.json          # Dependencies
├── vite.config.js        # Build config
└── index.html            # HTML shell
```

## 🔒 Privacy & Security

- **No Server**: Runs entirely in your browser
- **Local Storage**: All deals stored locally on your device
- **API Keys**: Stored locally, never sent to our servers
- **No Tracking**: No analytics or data collection

## 🚨 Production Checklist

Before deploying:
- [ ] Update `author` in `package.json`
- [ ] Set your domain in `index.html` OpenGraph tags
- [ ] Test API functionality with your RapidAPI key
- [ ] Verify mobile responsiveness 
- [ ] Test offline functionality (PWA)

## 🛠️ Troubleshooting

**Deal Sourcing not working?**
- Check your RapidAPI key is valid
- Ensure you're not over the 100/month limit
- Try a different SE Florida city

**App not loading?**
- Clear browser cache and localStorage
- Check browser console for errors
- Try incognito/private mode

**Mobile issues?**
- Use modern browser (Chrome, Safari, Edge)
- Enable JavaScript
- Check internet connection for API calls

## 📈 Roadmap

- **Multi-market expansion** (Atlanta, Dallas, Phoenix)
- **Team collaboration** features
- **Advanced reporting** and analytics
- **Mobile app** (React Native)
- **CRM integration** (PipeDrive, HubSpot)

---

**Need help?** Open an issue or contact support.

**Built for real estate investors by real estate investors.**
