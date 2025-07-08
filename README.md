# SafeValley Map

> **SafeValley Map** is a web app for reporting and visualizing local safety hazards (crime, load shedding, potholes, illegal dumping) in Makers Valley, Johannesburg. Built for the EWB Digital Design Challenge, it lets residents report hazards, view them on a map, and filter by travel mode. Admins can moderate reports via a secure panel.

---

## Features
- **Report hazards** with type, description, radius, and duration
- **Visualize hazards** as color-coded markers and circles on a custom map
- **Filter by travel mode** (walking, cycling, car, taxi)
- **Admin panel** for approving/rejecting reports
- **Auto-expiry**: Hazards disappear after their set duration
- **Responsive UI** (mobile-friendly, modern design)

## Tech Stack
- React (frontend)
- Leaflet.js (map rendering)
- Tailwind CSS (styling)
- Firebase Firestore (database)
- Jest (testing)

## Screenshots
<!-- Add screenshots or GIFs here -->
![Screenshot Placeholder](docs/screenshot-placeholder.png)

## Live Demo
[Live Demo](https://synoptic-d71d9.web.app)

> The app is live and accessible from anywhere via Firebase Hosting.

## Project Status
- Core features are functional and tested.
- Some features (e.g., photo upload) are stubbed or planned for future updates due to Firebase billing limits.

## Getting Started
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run locally:**
   ```bash
   npm start
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```
4. **Run tests:**
   ```bash
   npm test
   ```

## Deployment
- Deploy for free using Firebase Hosting, Vercel, or Netlify.
- Ensure `public/map.png` exists and update Firebase config in `src/services/firebase.js` if needed.

## Usage
- Click the map to report a hazard
- Fill in the form and submit
- Admins review/approve reports in the admin panel
- Approved hazards appear on the map for the set duration

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

---

For EWB marking scheme details, see [docs/ewb-details.md](docs/ewb-details.md)
