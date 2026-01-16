# Morse Walker - Russian Edition 🇷🇺

<p align="center">
  <img src="src/img/morsewalker-logo.png" alt="Morse Walker Logo" width="200"/>
</p>

<p align="center">
  <strong>CW Training Simulator with Russian Language Support</strong>
</p>

<p align="center">
  <a href="https://morse.r9o.ru" target="_blank">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-Beta_Testing-blue?style=for-the-badge" alt="Live Demo"/>
  </a>
  <a href="https://morse.r9o.ru" target="_blank">
    <img src="https://img.shields.io/badge/Status-Beta-yellow?style=for-the-badge" alt="Beta Status"/>
  </a>
</p>

---

## 🚀 **Try it Now!**

**Live Beta Version:** **[https://morse.r9o.ru](https://morse.r9o.ru)** 🎵

> ⚠️ **Currently in Beta Testing** - Your feedback is invaluable! Please report any bugs or suggestions.

---

## 🌟 Enhanced Features

This is an enhanced version of Morse Walker with:

- 🇷🇺 **Full Russian language support** (EN/RU switcher)
- 📻 **RDA Contest mode** with 85 Russian regions
- 🎯 **500+ Russian callsigns** generator
- 🇷🇺 **Russian Only Callsigns** option
- 📖 **Translated Help modal**
- 🎨 **Improved UI** with language switcher

**Original by** [W6NYC](https://github.com/sc0tfree/morsewalker)  
**Enhanced by** [R9OGL](https://qrz.com/db/R9OGL)

---

## 🚀 What is Morse Walker?

Morse Walker is a web-based Morse code training simulator that helps you improve your CW skills through realistic contest scenarios. Practice copying callsigns, exchanges, and handling pile-ups just like in real contests!

### Original Features:
- ✅ Multiple contest modes (CWT, SST, Basic Contest, POTA)
- ✅ Adjustable speed (WPM) and Farnsworth spacing
- ✅ Realistic QSB and QRN effects
- ✅ Variable tones and volumes
- ✅ Cut numbers support
- ✅ US callsign database

### New in Russian Edition:
- ✅ **RDA Contest mode** with authentic Russian region codes (AL-01, BA-23, etc.)
- ✅ **Russian callsign generator** with realistic prefixes (R, UA, RA, RU, etc.)
- ✅ **Bilingual interface** - switch between English and Russian instantly
- ✅ **Localized Help system** with Russian instructions
- ✅ **Beta warning banner** with bug reporting options

---

## 🎮 How to Use

1. **Select a mode** (Single Caller, Contest, POTA, RDA, CWT, SST)
2. **Configure your station** (callsign, speed, tone)
3. **Click CQ** to start calling
4. **Type the callsign** of the station you want to work
5. **Fill in exchange fields** (name, state, serial number)
6. **Click Send** to respond
7. **Click TU** to complete the QSO

### RDA Mode Special:
- Russian stations will send their RDA region (e.g., "R3ABC AL-23")
- Respond with your region code
- Track your RDA progress!

---

## 🌐 Language Switching

Click **EN** or **RU** buttons in the top-right corner to switch interface language.

All elements are translated:
- Mode names and descriptions
- Form labels and placeholders
- Button texts
- Help modal content
- Results table headers

---

## 🛠️ Installation

### Online Version
Visit: **[https://loloka.github.io/morsewalker](https://loloka.github.io/morsewalker)**

### Local Development

```bash
# Clone the repository
git clone https://github.com/loloka/morsewalker.git
cd morsewalker

# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build


📁 Project Structure
morsewalker/
├── src/
│   ├── localization/          # 🆕 Localization system
│   │   ├── index.js          # LocalizationManager
│   │   ├── en.js             # English translations
│   │   └── ru.js             # Russian translations
│   ├── data/
│   │   └── russianCallsigns.js  # 🆕 500+ Russian callsigns
│   ├── js/
│   │   ├── app.js            # Main application
│   │   ├── modes.js          # Contest modes logic
│   │   ├── rda-regions.js    # 🆕 85 RDA regions
│   │   └── stationGenerator.js
│   ├── css/
│   │   ├── style.css
│   │   └── language-switcher.css  # 🆕 Language buttons
│   └── index.html
└── dist/                     # Built files

files
🐛 Bug Reports & Feedback
This project is in beta and your feedback is invaluable!

Report Issues:
GitHub Issues: https://github.com/sc0tfree/morsewalker/issues/new/choose
Email (Original): henry@w6nyc.com
Email (Russian version): admin@r9o.ru
What to Report:
🐛 Bugs or errors
💡 Feature requests
🌐 Translation improvements
📻 RDA mode suggestions
🤝 Contributing
Contributions are welcome! If you'd like to improve Morse Walker:

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
📜 License
This project is based on Morse Walker by W6NYC.

🙏 Credits
Original Author: W6NYC (Henry) - Created Morse Walker
Russian Enhancement: R9OGL - Added Russian localization and RDA mode
RDA Database: Russian District Award
Callsign Data: Various amateur radio databases

📊 Technical Details
Technologies Used:
Vanilla JavaScript (ES6+)
Web Audio API for Morse code generation
Bootstrap 5 for UI
Webpack for bundling
Prettier for code formatting

Browser Support:
Chrome/Edge (recommended)
Firefox
Safari
Opera

Features:
Localization: Full i18n system with hot-swapping
Audio Engine: Real-time Morse code synthesis
State Management: LocalStorage for settings persistence
QSB/QRN Effects: Realistic propagation simulation

🔗 Links
Original Project: https://github.com/sc0tfree/morsewalker
Russian Fork: https://github.com/loloka/morsewalker
W6NYC QRZ: https://qrz.com/db/W6NYC
R9OGL QRZ: https://qrz.com/db/R9OGL

📸 Screenshots

...

73 de W6NYC & R9OGL
Crafted with 🧡 and "·-"

