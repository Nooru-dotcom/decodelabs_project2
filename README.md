# 🧠 NeuroAPI Platform

> **A full-stack interactive API sandbox that teaches HTTP request/response lifecycles through the lens of a biological nervous system.**

Built for **DecodeLabs Project 2** — this platform transforms abstract API concepts (routing, validation, middleware, error handling) into a living, breathing neural network you can see, touch, and break.

---

## ✨ Features

### 🎛️ Nerve Center (Control Panel)
- **Database Health Toggle** — Flip the database online/offline to trigger Circuit Breaker state transitions (`CLOSED → OPEN → HALF-OPEN`)
- **Latency Simulator** — Drag a slider to inject artificial network delay (0–2000ms)
- **Auth Gate Toggle** — Enable/disable authentication with selectable token types (Admin / User / Invalid)
- **Rate Limiter Threshold** — Adjust the request-per-10-second threshold in real time

### 🧪 API Sandbox
- Send **GET / POST / PUT / DELETE** requests to `/api/neurons` directly from the dashboard
- View color-coded response status pills (**2xx** green, **4xx** orange, **5xx** red)
- Inspect raw JSON response bodies
- Watch the **Gatekeeper Validation Pipeline** show syntactic and semantic check results live

### 📊 Live Telemetry
- Real-time counters: Total Requests, Successes, Client Errors, Server Errors
- Circuit Breaker state indicator with color transitions

### 🎆 Synaptic Canvas (HTML5 Visualization)
- Neural network nodes and synaptic links rendered on HTML5 Canvas
- **Request pulses** fire from the Client Cortex to the Brain Stem on every API call
- **Response pulses** fire back with color reflecting the HTTP status code
- Particles, glow effects, and electrical signal animations

### ⚡ One-Click Demo Scenarios
| Button | What It Does |
|--------|-------------|
| `GET 200` | Fetches all neurons — happy path |
| `POST 201` | Creates a new neuron with random coordinates |
| `POST 400` | Sends a duplicate neuron to trigger Semantic Validation failure |
| `🔥 Rate Flood` | Fires 12 rapid requests to trigger 429 Too Many Requests |

### 📖 Interactive Intern Guide
Tabbed reference panel covering:
- HTTP Status Code families with color indicators
- Middleware pipeline explanation
- Circuit Breaker state machine documentation

---

## 🏗️ Architecture

```
Client Cortex (Browser)
        │
        ▼
   Synaptic Void (Network + Latency Simulation)
        │
        ▼
   Brain Stem / API Gateway (Express.js)
        │
        ├── Rate Limiter Middleware
        ├── Circuit Breaker Middleware
        ├── Auth Gate Middleware (AuthN + AuthZ)
        │
        ▼
   Gatekeeper (Validation Layer)
        ├── Syntactic Checks (type, range, required fields)
        └── Semantic Checks (uniqueness, coordinate overlap)
        │
        ▼
   Synaptic Memory Node (In-Memory Database)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16+)
- **npm**

### Installation

```bash
# Clone the repository
git clone https://github.com/nooru-dotcom/decodelabs_project2.git
cd decodelabs_project2

# Install dependencies
npm install

# Start the server
npm start
```

Open your browser at **http://localhost:3000** and start exploring!

---

## 📁 Project Structure

```
decodelabs_project2/
├── server.js                  # Express backend with all middleware & routes
├── package.json               # Project dependencies
├── .gitignore
├── README.md
└── public/
    ├── index.html             # Dashboard UI
    ├── css/
    │   └── style.css          # Glassmorphism dark-theme styles
    └── js/
        ├── app.js             # Frontend controller & API communication
        └── neuro-canvas.js    # HTML5 Canvas neural visualization engine
```

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/neurons` | Retrieve all neurons |
| `GET` | `/api/neurons/:id` | Retrieve a specific neuron |
| `POST` | `/api/neurons` | Create a new neuron (with validation) |
| `PUT` | `/api/neurons/:id` | Update a neuron |
| `DELETE` | `/api/neurons/:id` | Delete a neuron |
| `GET` | `/api/system/stats` | Get server telemetry & config |
| `POST` | `/api/system/control` | Update system configuration |

---

## 🔥 Edge Cases Covered

| Scenario | Status Code | Trigger |
|----------|------------|---------|
| Successful retrieval | `200 OK` | GET with valid data |
| Resource created | `201 Created` | POST with valid body |
| Missing required fields | `400 Bad Request` | POST without `name` |
| Invalid data types | `400 Bad Request` | POST with string `charge` |
| Duplicate coordinates | `400 Bad Request` | POST overlapping neuron |
| Invalid auth token | `401 Unauthorized` | Request with bad Bearer token |
| Insufficient permissions | `403 Forbidden` | User token on admin route |
| Resource not found | `404 Not Found` | GET `/api/neurons/999` |
| Rate limit exceeded | `429 Too Many Requests` | Rapid-fire requests |
| Database crash | `500 Internal Server Error` | Toggle DB offline |

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **Visualization**: HTML5 Canvas API
- **Design**: Glassmorphism, dark mode, neon accent palette

---

## 👨‍💻 Author

**nooru-dotcom** — Built for DecodeLabs Full Stack Project 2

---

## 📄 License

This project is for educational purposes.
