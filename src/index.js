// index.js
// Entry point for SafeValley Map React app
// Renders the App component and applies global styles (Tailwind CSS)

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind CSS and global styles
import App from './App';
import reportWebVitals from './reportWebVitals';

// Render the main App inside React.StrictMode for highlighting potential problems
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
