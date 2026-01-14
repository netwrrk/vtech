// frontend/app/user-dashboard/data/dashboardData.js

export const CATEGORIES = [
  { key: "overview", label: "Overview" },
  { key: "devices", label: "Devices" },
  { key: "network", label: "Network" },
  { key: "security", label: "Security" },
  { key: "sessions", label: "Sessions" },
  { key: "tickets", label: "Tickets" },
  { key: "messages", label: "Messages" },
];

// dummy device cards (swap later)
export const DEVICES = [
  { key: "primary", title: "My Device", sub: "Healthy • Ready", featured: true },
  { key: "wifi", title: "Wi-Fi", sub: "Connected • Strong" },
  { key: "browser", title: "Browser", sub: "Protected • Clean" },
  { key: "accounts", title: "Accounts", sub: "2 alerts • Review" },
];
