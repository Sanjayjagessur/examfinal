# 🚀 GitHub Deployment Guide

This guide shows you how to run your Jagesaurus Exam Timetable Manager on GitHub.

## 🌐 **Option 1: GitHub Pages (Recommended)**

### **Automatic Deployment (GitHub Actions)**
Your repository is already set up with GitHub Actions for automatic deployment!

1. **Enable GitHub Pages:**
   - Go to your repository: https://github.com/Sanjayjagessur/examfinal
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

2. **Deploy automatically:**
   - Every time you push to the `main` branch, GitHub Actions will automatically build and deploy your app
   - Your app will be available at: **https://sanjayjagessur.github.io/examfinal**

### **Manual Deployment**
If you prefer manual control:

```bash
# Build and deploy to GitHub Pages
npm run deploy
```

## 🖥️ **Option 2: GitHub Codespaces (Online Development)**

### **Run in Browser:**
1. Go to your repository: https://github.com/Sanjayjagessur/examfinal
2. Click the **Code** button → **Codespaces** → **Create codespace on main**
3. Wait for the environment to load
4. In the terminal, run:
   ```bash
   npm install
   npm start
   ```
5. Your app will run in the browser!

## 🔧 **Option 3: GitHub Actions (CI/CD)**

### **Automated Testing & Building:**
The repository includes GitHub Actions that:
- ✅ Install dependencies
- ✅ Build the application
- ✅ Deploy to GitHub Pages
- ✅ Run on every push to main branch

## 📱 **Live Demo URLs**

Once deployed, your app will be available at:
- **GitHub Pages**: https://sanjayjagessur.github.io/examfinal
- **Repository**: https://github.com/Sanjayjagessur/examfinal

## 🛠️ **Features Available Online**

### **Web Version Features:**
- ✅ **Exam Card Management** - Create and manage exam cards
- ✅ **Drag & Drop Calendar** - Visual scheduling interface
- ✅ **Timetable Preview** - Real-time preview
- ✅ **PDF Export** - Generate student timetables
- ✅ **Data Persistence** - Browser localStorage
- ✅ **AI Guardian** - Invigilation assistance (requires API key)

### **Desktop-Only Features:**
- ❌ **File System Access** - Save/load from files
- ❌ **Electron Features** - Native desktop integration

## 🔑 **AI Features Setup**

To enable AI features in the web version:

1. **Get OpenAI API Key:**
   - Visit: https://platform.openai.com/api-keys
   - Create a new API key

2. **Configure in Browser:**
   - Open the web app
   - Go to **AI Guardian** tab
   - Enter your API key when prompted

## 📊 **Performance Notes**

### **Web Version:**
- ✅ Fast loading and responsive
- ✅ Works on all modern browsers
- ✅ Mobile-friendly interface
- ⚠️ Data stored in browser (clears if cache is cleared)

### **Desktop Version:**
- ✅ Full file system access
- ✅ Better performance for large datasets
- ✅ Offline functionality
- ✅ Native OS integration

## 🚀 **Quick Start Commands**

```bash
# Clone the repository
git clone https://github.com/Sanjayjagessur/examfinal.git
cd examfinal

# Install dependencies
npm install

# Run web version
npm start

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🔄 **Updating Your Live App**

1. **Make changes** to your code
2. **Commit and push** to main branch:
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```
3. **GitHub Actions** will automatically deploy the update
4. **Your live app** will be updated in a few minutes

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **App not loading:**
   - Check if GitHub Pages is enabled
   - Verify the repository URL is correct

2. **Build fails:**
   - Check GitHub Actions logs
   - Ensure all dependencies are in package.json

3. **AI features not working:**
   - Verify OpenAI API key is valid
   - Check browser console for errors

## 📞 **Support**

- **Repository**: https://github.com/Sanjayjagessur/examfinal
- **Issues**: Create an issue on GitHub
- **Documentation**: Check README.md for detailed setup

---

**🎉 Your Jagesaurus Exam Timetable Manager is now live on GitHub!**
