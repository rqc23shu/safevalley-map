# SafeValley Map

> **SafeValley Map** is a web app for the EWB Digital Design Challenge, designed to help residents of Makers Valley, Johannesburg, report and visualize local safety hazards (crime, load shedding, potholes, illegal dumping) on a static map. The app supports hazard reporting, visualization, travel mode filters, and manual moderation via an admin panel.

---

## Features
- **Static Map Visualization:** Hazards are shown as color-coded markers and translucent circles on a custom map image.
- **Hazard Reporting:** Residents can report hazards with type, description, radius, and duration.
- **Travel Mode Filters:** Users can filter hazards by travel mode (walking, cycling, car, taxi).
- **Admin Panel:** Password-protected interface for approving/rejecting reports.
- **Auto-Expiry:** Hazards disappear after their set duration.
- **Responsive UI:** Clean, modern, and mobile-friendly design using Tailwind CSS.

## Tech Stack
- **React** (frontend framework)
- **Leaflet.js** (map rendering)
- **Tailwind CSS** (styling)
- **Firebase Firestore** (database)
- **Jest** (basic testing)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install # Installs all required packages
   ```
2. **Run the app locally:**
   ```bash
   npm start # Starts the development server
   ```
3. **Build for production:**
   ```bash
   npm run build # Creates an optimized production build
   ```
4. **Run tests:**
   ```bash
   npm test # Runs Jest tests (Node 20.x recommended)
   ```

## Deployment
- The app can be deployed to any static hosting (e.g., Vercel, Netlify, Firebase Hosting).
- Ensure your `map.png` is in the `public/` directory.
- Update Firebase config in `src/services/firebase.js` if needed.

## Marking Scheme Alignment
- **Problem Identification:** Focused on real safety needs in Makers Valley.
- **Design:** Modern, intuitive UI; clear navigation; responsive layout.
- **Implementation:** Clean, well-commented code; modular React components; real-time Firestore integration.
- **Sustainability:** Easy to maintain/extend; clear documentation; scalable structure.
- **Testing:** Includes a basic Jest test for demonstration.
- **Teamwork & Presentation:** Code and documentation are structured for clarity and demo-readiness.

---

For more details, see code comments in each file. For admin access, use the password set in `AdminPanel.js` (default: `admin123`).

## Setup Instructions

### 1. Prerequisites
- Node.js and npm installed ([Download here](https://nodejs.org))
- Firebase account ([Sign up here](https://firebase.google.com))

### 2. Clone the Repository
```
git clone <your-repo-url>
cd safevalley-map
```

### 3. Install Dependencies
```
npm install
```

### 4. Configure Tailwind CSS
- Already set up in this project. If you need to re-init:
```
npx tailwindcss init -p
```

### 5. Set Up Firebase
- Go to the [Firebase Console](https://console.firebase.google.com/)
- Create a new project
- Enable Firestore Database
- Register a web app and copy the config
- Replace the config in `src/services/firebase.js`

### 6. Add Map Image
- Place your static map image as `public/map.png`

### 7. Start the App
```
npm start
```
- Open [http://localhost:3000](http://localhost:3000)

### 8. Build and Deploy
```
npm run build
firebase deploy
```

## Usage
- Click on the map to report a hazard
- Fill in the form and submit
- Admins can review and approve/reject reports in the admin panel
- Approved hazards appear on the map for the specified duration

## Testing
- Run unit tests:
```
npm test
```

## Project Structure
```
safevalley-map/
├── public/
│   ├── index.html
│   ├── map.png
├── src/
│   ├── components/
│   │   ├── Map/MapComponent.js
│   │   ├── Forms/ReportForm.js
│   │   ├── Forms/AdminPanel.js
│   ├── services/firebase.js
│   ├── App.js
│   ├── index.js
│   ├── index.css
├── package.json
```

## Credits
- Built with React, Leaflet.js, Tailwind CSS, and Firebase
- Inspired by StackOverflow and EWB Digital Design Challenge
