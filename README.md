# 🦕 Jagesaurus - Exam Timetable Manager

A modern, web-based application for school administrators to create, manage, and distribute exam timetables with drag-and-drop scheduling and automated data persistence.

## ✨ Features

- **📝 Exam Card Management** - Create and manage exam cards with paper names, numbers, classes, and durations
- **🎯 Drag & Drop Calendar** - Visual scheduling with intuitive drag-and-drop interface
- **📊 Real-time Preview** - See your timetable as you build it
- **📄 PDF Export** - Generate professional student timetables and exam summaries
- **💾 Data Persistence** - Automatic saving and manual backup options
- **🔄 File Sharing** - Save and load timetables for sharing with others
- **🌐 Web & Desktop** - Available as both web application and desktop app

## 🚀 Quick Start

### Web Version (Recommended)
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/jagesaurus.git
   cd jagesaurus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Desktop Version
1. **Follow steps 1-2 above**

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Run the desktop app:**
   ```bash
   npx electron build/electron.js
   ```

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Step-by-step Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/jagesaurus.git
   cd jagesaurus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

## 🎮 Usage

### Creating Exam Cards
1. Use the left sidebar to create exam cards
2. Fill in:
   - **Paper Name** (e.g., "Mathematics")
   - **Paper Number** (e.g., "MATH101")
   - **Class** (e.g., "Grade 10A")
   - **Duration** (in minutes)
   - **Student Count**
   - **Start Time** and **End Time**

### Scheduling Exams
1. **Drag exam cards** from the left sidebar to the calendar
2. **Drop them** on your desired date and time
3. **View the preview** in the right sidebar
4. **Multiple exams** can be scheduled at the same time

### Exporting Timetables
1. **Student Timetable** - Export a student-friendly timetable
2. **Exam Summary** - Export a detailed exam summary
3. **PDF Format** - Professional, printable documents

### Data Persistence (Desktop Version)
- **Automatic Save** - Your work is saved automatically
- **Manual Save** - Use the green "Save" button for backups
- **Manual Load** - Use the blue "Load" button to open saved files
- **File Sharing** - Share `.json` files with other users

## 🛠️ Development

### Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build the production version
- `npm run electron` - Run the desktop app
- `npm run electron-dev` - Run desktop app in development mode
- `npm test` - Run tests

### Project Structure

```
jagesaurus/
├── public/                 # Static files
│   ├── electron.js        # Electron main process
│   ├── preload.js         # Electron preload script
│   └── index.html         # Main HTML file
├── src/                   # Source code
│   ├── components/        # React components
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── App.tsx           # Main application component
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🎯 Features in Detail

### Exam Card Management
- Create, edit, and delete exam cards
- Assign colors automatically
- Validate input data
- Support for multiple classes

### Calendar Interface
- Drag-and-drop scheduling
- Visual feedback
- Conflict detection (optional)
- Dynamic calendar expansion

### Export Functionality
- **Student Timetable PDF** - Clean, student-friendly format
- **Exam Summary PDF** - Detailed administrative view
- **Professional formatting** - Ready for printing

### Data Persistence
- **Web Version**: Browser localStorage
- **Desktop Version**: File system + localStorage backup
- **Auto-save**: Automatic data protection
- **Manual backup**: File-based saving and loading

## 🌐 Deployment

### Web Deployment
1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy the `build/` folder** to your web server

### Desktop Distribution
1. **Build the executable:**
   ```bash
   npm run build
   npx electron-builder --win --publish=never
   ```

2. **Distribute the `dist/` folder**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Jagesaurus** - *Exam Timetable Management System*

## 🙏 Acknowledgments

- React.js for the frontend framework
- Electron for desktop application capabilities
- Tailwind CSS for styling
- jsPDF for PDF generation
- React DnD for drag-and-drop functionality

---

**Built with ❤️ for educational institutions**
