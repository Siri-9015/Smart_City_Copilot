Smart City AI — Urban Intelligence & Operations Platform

An AI-powered Smart City Operations Center built using React, TypeScript, Node.js, and Gemini AI for real-time traffic monitoring, pollution forecasting, emergency alerting, and intelligent urban analytics.

This project simulates a futuristic metropolitan command center capable of monitoring live telemetry streams, detecting anomalies, generating alerts, and assisting city operators using an AI Copilot powered by Gemini.

Features
Smart City Monitoring
Real-time traffic analytics
Live congestion monitoring
Pollution & AQI forecasting
Emergency incident detection
IoT telemetry visualization
Urban operational dashboard
Gemini AI Copilot
AI-powered city assistant
Traffic bottleneck analysis
Smart routing recommendations
Pollution insight generation
Executive operational reports
Emergency response assistance
Alerting & Notifications
Automated traffic alerts
Toxic pollution warnings
Sensor failure detection
Smart incident dispatch system
Email & push notification simulation
IoT Simulation Engine
Simulated city sensor streams
Traffic camera telemetry
AQI monitoring stations
Urban activity simulation
Pipeline ingestion logs
Tech Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
Backend
Node.js
Express.js
TypeScript
AI & Cloud
Gemini API
Google Generative AI SDK
Project Architecture
IoT Sensors / Simulator
          ↓
Telemetry Pipeline
          ↓
Node.js Backend Server
          ↓
AI Analytics Engine
          ↓
Gemini AI Copilot
          ↓
Smart Dashboard UI
Folder Structure
smart-city-ai/
│
├── src/
├── components/
├── server.ts
├── package.json
├── vite.config.ts
├── .env
└── README.md
Installation
Prerequisites
Node.js installed
npm installed
Gemini API Key
Setup Instructions
1. Clone Repository
git clone <repository-url>
cd smart-city-ai
2. Install Dependencies
npm install
3. Configure Environment Variables

Create a .env file in the root directory:

GEMINI_API_KEY=your_gemini_api_key

Get your Gemini API key from:

Google AI Studio

Running the Project
Start Development Server
npm run dev

Server will start at:

http://localhost:3000

Open browser and visit:

http://localhost:3000
Gemini Model Configuration

Recommended model:

model: "gemini-2.5-flash"

Example:

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
});
Example Smart Alerts
Toxic air pollution detected in Downtown Core
Severe traffic congestion identified
Sensor telemetry anomaly detected
Emergency incident response triggered
Available Dashboard Modules
System Overview
Traffic Analytics
Pollution Forecast
Decision Support
IoT Simulator
Alerting Hub
Gemini Copilot
AI Advisory Reports
Future Enhancements
Google Maps integration
Real-time CCTV analytics
Predictive emergency management
AI traffic optimization
Smart citizen reporting
Cloud deployment on GCP
NVIDIA RAPIDS acceleration
Use Cases
Smart City Operations
Urban Intelligence Systems
AI Governance Platforms
Traffic Monitoring Centers
Environmental Monitoring
Emergency Response Systems
Author

Likhitha Siri Meghana Killani
B.Tech CSE — Smart City AI Project

License

MIT License
