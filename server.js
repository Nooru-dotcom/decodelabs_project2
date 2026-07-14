const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock database for Neurons
let neurons = [
  { id: 1, name: "Cortex-Alpha", type: "Sensory", charge: 75, status: "Active", x: 150, y: 200 },
  { id: 2, name: "Motor-Beta", type: "Motor", charge: 40, status: "Inactive", x: 450, y: 350 },
  { id: 3, name: "Inter-Gamma", type: "Relay", charge: 90, status: "Active", x: 300, y: 280 }
];
let nextId = 4;

// System State configurations
let systemConfig = {
  dbHealth: true,        // Simulates DB status (for circuit breaker demonstration)
  latency: 50,           // Configurable latency in milliseconds
  rateLimitThreshold: 10,// Limit of requests per 10 seconds
  authRequired: false    // If token verification is active
};

// Internal stats tracker
let systemStats = {
  totalRequests: 0,
  successRequests: 0,
  clientErrors: 0,
  serverErrors: 0,
  currentCircuitBreakerState: "CLOSED", // CLOSED, OPEN, HALF-OPEN
  circuitBreakerFailureCount: 0
};

// Rate limiter helper
let requestLog = [];

// Latency Simulation Middleware
app.use((req, res, next) => {
  systemStats.totalRequests++;
  if (systemConfig.latency > 0) {
    setTimeout(next, systemConfig.latency);
  } else {
    next();
  }
});

// Circuit Breaker Middleware
app.use((req, res, next) => {
  // If simulated database is unhealthy, count failures and transition circuit breaker
  if (!systemConfig.dbHealth) {
    systemStats.circuitBreakerFailureCount++;
    if (systemStats.circuitBreakerFailureCount >= 3) {
      systemStats.currentCircuitBreakerState = "OPEN";
    }
    
    systemStats.serverErrors++;
    return res.status(500).json({
      error: {
        code: 500,
        message: "Internal Server Error: Circuit Breaker is " + systemStats.currentCircuitBreakerState + ". Simulated Database Connection Failure.",
        status: "INTERNAL_ERROR"
      }
    });
  }

  // Self-Healing Logic (if breaker was open but DB is restored)
  if (systemStats.currentCircuitBreakerState === "OPEN") {
    systemStats.currentCircuitBreakerState = "HALF-OPEN";
  } else if (systemStats.currentCircuitBreakerState === "HALF-OPEN") {
    systemStats.currentCircuitBreakerState = "CLOSED";
    systemStats.circuitBreakerFailureCount = 0;
  }

  next();
});

// Rate Limiting Middleware
app.use((req, res, next) => {
  const now = Date.now();
  // Clean logs older than 10 seconds
  requestLog = requestLog.filter(t => now - t < 10000);
  
  if (requestLog.length >= systemConfig.rateLimitThreshold) {
    systemStats.clientErrors++;
    return res.status(429).json({
      error: {
        code: 429,
        message: "Too Many Requests. Rate limit of " + systemConfig.rateLimitThreshold + " requests per 10 seconds exceeded. (Gatekeeper autoprotect active)",
        status: "RESOURCE_EXHAUSTED"
      }
    });
  }
  requestLog.push(now);
  next();
});

// Authentication and Authorization Middleware (AuthN & AuthZ)
const authMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (!systemConfig.authRequired) {
      return next();
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      systemStats.clientErrors++;
      return res.status(401).json({
        error: {
          code: 401,
          message: "Unauthorized: Missing or invalid authentication token (Expected format: Bearer token-value)",
          status: "UNAUTHENTICATED"
        }
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Simulate token verification
    if (token === "invalid-token-neuro") {
      systemStats.clientErrors++;
      return res.status(401).json({
        error: {
          code: 401,
          message: "Unauthorized: Token verification failed.",
          status: "UNAUTHENTICATED"
        }
      });
    }

    // Role verification (Authorization AuthZ)
    if (requiredRole && requiredRole === 'admin') {
      if (token !== "token-admin-neuro") {
        systemStats.clientErrors++;
        return res.status(403).json({
          error: {
            code: 403,
            message: "Forbidden: You do not have permissions to perform this operation. Admin credentials required.",
            status: "PERMISSION_DENIED"
          }
        });
      }
    }

    next();
  };
};

// --- API ENDPOINTS ---

// GET /api/neurons (Retrieval)
app.get('/api/neurons', authMiddleware('user'), (req, res) => {
  systemStats.successRequests++;
  res.status(200).json(neurons);
});

// GET /api/neurons/:id (Retrieve Single Node)
app.get('/api/neurons/:id', authMiddleware('user'), (req, res) => {
  const id = parseInt(req.params.id);
  const neuron = neurons.find(n => n.id === id);
  if (!neuron) {
    systemStats.clientErrors++;
    return res.status(404).json({
      error: {
        code: 404,
        message: `Neuron with ID ${id} not found in the synaptic map.`,
        status: "NOT_FOUND"
      }
    });
  }
  systemStats.successRequests++;
  res.status(200).json(neuron);
});

// POST /api/neurons (Creation - Demonstrating Syntactic & Semantic Validation)
app.post('/api/neurons', authMiddleware('admin'), (req, res) => {
  const { name, type, charge, status, x, y } = req.body;

  // 1. Syntactic Validation (Format checks)
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    systemStats.clientErrors++;
    return res.status(400).json({
      error: {
        code: 400,
        message: "Syntactic Validation Failed: 'name' is required and must be a non-empty string.",
        field: "name",
        status: "INVALID_ARGUMENT"
      }
    });
  }

  const validTypes = ["Sensory", "Motor", "Relay"];
  if (!type || !validTypes.includes(type)) {
    systemStats.clientErrors++;
    return res.status(400).json({
      error: {
        code: 400,
        message: `Syntactic Validation Failed: 'type' must be one of: ${validTypes.join(', ')}.`,
        field: "type",
        status: "INVALID_ARGUMENT"
      }
    });
  }

  if (charge === undefined || typeof charge !== 'number' || charge < 0 || charge > 100) {
    systemStats.clientErrors++;
    return res.status(400).json({
      error: {
        code: 400,
        message: "Syntactic Validation Failed: 'charge' must be a number between 0 and 100.",
        field: "charge",
        status: "INVALID_ARGUMENT"
      }
    });
  }

  if (x === undefined || typeof x !== 'number' || y === undefined || typeof y !== 'number') {
    systemStats.clientErrors++;
    return res.status(400).json({
      error: {
        code: 400,
        message: "Syntactic Validation Failed: 'x' and 'y' coordinates are required numerical fields.",
        field: "coordinates",
        status: "INVALID_ARGUMENT"
      }
    });
  }

  // 2. Semantic Validation (Business Logic Checks)
  // Rule: Neuron name must be unique
  const nameExists = neurons.some(n => n.name.toLowerCase() === name.toLowerCase());
  if (nameExists) {
    systemStats.clientErrors++;
    return res.status(400).json({
      error: {
        code: 400,
        message: `Semantic Validation Failed: A neuron named '${name}' already exists in this network. Name must be unique.`,
        field: "name",
        status: "ALREADY_EXISTS"
      }
    });
  }

  // Rule: Coordinates must not overlap completely (within 20px radius)
  const overlap = neurons.some(n => Math.hypot(n.x - x, n.y - y) < 25);
  if (overlap) {
    systemStats.clientErrors++;
    return res.status(400).json({
      error: {
        code: 400,
        message: "Semantic Validation Failed: Neurons cannot overlap in the synaptic mapping. Choose distinct coordinates.",
        field: "coordinates",
        status: "FAILED_PRECONDITION"
      }
    });
  }

  const newNeuron = {
    id: nextId++,
    name,
    type,
    charge,
    status: status || "Active",
    x,
    y
  };

  neurons.push(newNeuron);
  systemStats.successRequests++;
  res.status(201).json(newNeuron);
});

// PUT /api/neurons/:id (Update / Replacement)
app.put('/api/neurons/:id', authMiddleware('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const neuronIndex = neurons.findIndex(n => n.id === id);

  if (neuronIndex === -1) {
    systemStats.clientErrors++;
    return res.status(404).json({
      error: {
        code: 404,
        message: `Neuron with ID ${id} not found. Cannot perform PUT update.`,
        status: "NOT_FOUND"
      }
    });
  }

  const { name, type, charge, status, x, y } = req.body;

  // Syntactic Checks
  if (!name || !type || charge === undefined || x === undefined || y === undefined) {
    systemStats.clientErrors++;
    return res.status(400).json({
      error: {
        code: 400,
        message: "Syntactic Validation Failed: PUT updates require complete representations. 'name', 'type', 'charge', 'x', and 'y' must all be provided.",
        status: "INVALID_ARGUMENT"
      }
    });
  }

  // Semantic unique check (excluding self)
  const nameExists = neurons.some(n => n.name.toLowerCase() === name.toLowerCase() && n.id !== id);
  if (nameExists) {
    systemStats.clientErrors++;
    return res.status(400).json({
      error: {
        code: 400,
        message: `Semantic Validation Failed: A neuron named '${name}' already exists in this network.`,
        field: "name",
        status: "ALREADY_EXISTS"
      }
    });
  }

  neurons[neuronIndex] = {
    id,
    name,
    type,
    charge,
    status: status || "Active",
    x,
    y
  };

  systemStats.successRequests++;
  res.status(200).json(neurons[neuronIndex]);
});

// DELETE /api/neurons/:id (Removal - Returns 204 No Content)
app.delete('/api/neurons/:id', authMiddleware('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const index = neurons.findIndex(n => n.id === id);
  if (index === -1) {
    systemStats.clientErrors++;
    return res.status(404).json({
      error: {
        code: 404,
        message: `Cannot delete: Neuron with ID ${id} does not exist.`,
        status: "NOT_FOUND"
      }
    });
  }
  neurons.splice(index, 1);
  systemStats.successRequests++;
  res.status(204).end(); // 204 No Content
});

// System settings/control routes
app.get('/api/system/stats', (req, res) => {
  res.status(200).json({
    stats: systemStats,
    config: systemConfig
  });
});

app.post('/api/system/control', (req, res) => {
  const { dbHealth, latency, rateLimitThreshold, authRequired } = req.body;

  if (dbHealth !== undefined) systemConfig.dbHealth = dbHealth;
  if (latency !== undefined && typeof latency === 'number') systemConfig.latency = latency;
  if (rateLimitThreshold !== undefined && typeof rateLimitThreshold === 'number') systemConfig.rateLimitThreshold = rateLimitThreshold;
  if (authRequired !== undefined) systemConfig.authRequired = authRequired;

  // Reset breaker state if DB is restored health manually
  if (systemConfig.dbHealth) {
    systemStats.currentCircuitBreakerState = "CLOSED";
    systemStats.circuitBreakerFailureCount = 0;
  }

  res.status(200).json({ message: "System configurations updated.", config: systemConfig, stats: systemStats });
});

// Error handling for unmatched routes (404)
app.use((req, res, next) => {
  systemStats.clientErrors++;
  res.status(404).json({
    error: {
      code: 404,
      message: "Resource not found. The path: " + req.originalUrl + " is not mapped on the API.",
      status: "NOT_FOUND"
    }
  });
});

app.listen(PORT, () => {
  console.log(`NeuroAPI Server is running on port ${PORT}`);
});
