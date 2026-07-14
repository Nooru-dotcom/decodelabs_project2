document.addEventListener('DOMContentLoaded', () => {
  // Initialize Synapse Canvas
  const neuroVisualizer = new window.NeuroCanvas('synapse-canvas');

  // DOM Elements
  const btnSendRequest = document.getElementById('btn-send-request');
  const requestMethodSelect = document.getElementById('request-method');
  const requestUrlInput = document.getElementById('request-url');
  const requestBodyTextarea = document.getElementById('request-body');
  const bodyContainer = document.getElementById('body-container');

  const responseStatusPill = document.getElementById('response-status');
  const responseBodyOut = document.getElementById('response-body-out');

  const statTotal = document.getElementById('stat-total');
  const statSuccess = document.getElementById('stat-success');
  const statClientErr = document.getElementById('stat-client-err');
  const statServerErr = document.getElementById('stat-server-err');

  const stepSyntactic = document.getElementById('step-syntactic');
  const stepSemantic = document.getElementById('step-semantic');

  const consoleOutput = document.getElementById('console-output');
  const btnClearConsole = document.getElementById('btn-clear-console');

  const btnToggleDb = document.getElementById('btn-toggle-db');
  const dbHealthBadge = document.getElementById('db-health-badge');
  const toggleAuth = document.getElementById('toggle-auth');
  const authSelectors = document.getElementById('auth-selectors');
  const authTokenSelect = document.getElementById('auth-token-select');
  const latencyRange = document.getElementById('latency-range');
  const latencyVal = document.getElementById('latency-val');
  const rateRange = document.getElementById('rate-range');
  const rateVal = document.getElementById('rate-val');

  const cbStateLabel = document.getElementById('cb-state-label');

  // Guide Tabs
  const guideTabs = document.querySelectorAll('.guide-tab');
  const guideContents = document.querySelectorAll('.guide-tab-content');

  // Demo Quick actions
  const demoGet200 = document.getElementById('demo-get-200');
  const demoPost201 = document.getElementById('demo-post-201');
  const demoPost400 = document.getElementById('demo-post-400');
  const demoFlood = document.getElementById('demo-flood');

  // State configurations
  let isDbHealthy = true;
  let simulatedLatency = 50;
  let simulatedRateLimit = 10;
  let isAuthActive = false;

  // Render method-based Body container toggle
  requestMethodSelect.addEventListener('change', () => {
    const val = requestMethodSelect.value;
    if (val === 'POST' || val === 'PUT') {
      bodyContainer.style.display = 'block';
    } else {
      bodyContainer.style.display = 'none';
    }
  });

  // Load backend stats
  async function fetchServerStats() {
    try {
      const res = await fetch('/api/system/stats');
      if (res.ok) {
        const data = await res.json();
        updateStatsUI(data);
      }
    } catch (err) {
      console.error("Failed to query API statistics", err);
    }
  }

  // Update Statistics UI
  function updateStatsUI(serverData) {
    const stats = serverData.stats;
    const config = serverData.config;

    statTotal.textContent = stats.totalRequests;
    statSuccess.textContent = stats.successRequests;
    statClientErr.textContent = stats.clientErrors;
    statServerErr.textContent = stats.serverErrors;

    // Breaker State
    cbStateLabel.textContent = stats.currentCircuitBreakerState;
    cbStateLabel.className = ''; // clear class
    if (stats.currentCircuitBreakerState === 'CLOSED') {
      cbStateLabel.classList.add('cb-closed');
    } else if (stats.currentCircuitBreakerState === 'OPEN') {
      cbStateLabel.classList.add('cb-open');
    } else {
      cbStateLabel.classList.add('cb-half');
    }

    // Settings sync
    isDbHealthy = config.dbHealth;
    simulatedLatency = config.latency;
    simulatedRateLimit = config.rateLimitThreshold;
    isAuthActive = config.authRequired;

    // Update controls buttons classes
    if (isDbHealthy) {
      dbHealthBadge.textContent = 'HEALTHY';
      dbHealthBadge.className = 'status-dot green';
      btnToggleDb.textContent = 'Database Online';
      btnToggleDb.className = 'btn btn-success';
    } else {
      dbHealthBadge.textContent = 'CRASHED';
      dbHealthBadge.className = 'status-dot red';
      btnToggleDb.textContent = 'Restore Database';
      btnToggleDb.className = 'btn btn-danger';
    }

    toggleAuth.checked = isAuthActive;
    authSelectors.style.display = isAuthActive ? 'flex' : 'none';
    latencyRange.value = simulatedLatency;
    latencyVal.textContent = simulatedLatency;
    rateRange.value = simulatedRateLimit;
    rateVal.textContent = simulatedRateLimit;
  }

  // Set Control Configurations to Server
  async function sendSystemControl(payload) {
    try {
      const res = await fetch('/api/system/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        updateStatsUI(data);
        logToTerminal(`[SYSTEM] Configurations updated. Current config: ` + JSON.stringify(data.config), 'system');
      }
    } catch (err) {
      logToTerminal(`[SYSTEM] Failed to push parameters to server: ` + err.message, 'server-err');
    }
  }

  // Control Events
  btnToggleDb.addEventListener('click', () => {
    sendSystemControl({ dbHealth: !isDbHealthy });
  });

  toggleAuth.addEventListener('change', () => {
    sendSystemControl({ authRequired: toggleAuth.checked });
  });

  latencyRange.addEventListener('change', () => {
    sendSystemControl({ latency: parseInt(latencyRange.value) });
  });

  rateRange.addEventListener('change', () => {
    sendSystemControl({ rateLimitThreshold: parseInt(rateRange.value) });
  });

  // Custom logging to Synaptic Terminal Console
  function logToTerminal(message, type = '') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.classList.add('log-line');
    if (type) div.classList.add(type);
    div.textContent = `[${time}] ${message}`;
    consoleOutput.appendChild(div);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  btnClearConsole.addEventListener('click', () => {
    consoleOutput.innerHTML = '';
  });

  // Run Request Process
  async function fireSignalRequest(method, url, requestBody = null) {
    // Start canvas pulse animation
    neuroVisualizer.fireRequest(method, async () => {
      // Create headers
      const headers = { 'Content-Type': 'application/json' };
      
      // Handle Authorization header if config active
      if (isAuthActive) {
        const tokenType = authTokenSelect.value;
        if (tokenType === 'invalid') {
          headers['Authorization'] = 'Bearer invalid-token-neuro';
        } else if (tokenType === 'user') {
          headers['Authorization'] = 'Bearer token-user-neuro';
        } else if (tokenType === 'admin') {
          headers['Authorization'] = 'Bearer token-admin-neuro';
        }
      }

      const options = { method, headers };
      if (requestBody && (method === 'POST' || method === 'PUT')) {
        options.body = requestBody;
      }

      // Reset validation report UI
      stepSyntactic.className = 'step active';
      stepSyntactic.querySelector('.step-icon').textContent = '○';
      stepSemantic.className = 'step';
      stepSemantic.querySelector('.step-icon').textContent = '○';

      const startTime = Date.now();
      logToTerminal(`[API INGRESS] Dispatching ${method} ${url}`, 'system');

      try {
        const response = await fetch(url, options);
        const latencyTime = Date.now() - startTime;
        const statusCode = response.status;
        
        let responseColor = '--neon-green';
        let isSuccess = response.ok;
        let styleClass = 'status-2xx';

        if (statusCode >= 200 && statusCode < 300) {
          responseColor = '#34d399'; // green
        } else if (statusCode >= 400 && statusCode < 500) {
          responseColor = '#f97316'; // orange
          styleClass = 'status-4xx';
        } else if (statusCode >= 500) {
          responseColor = '#ef4444'; // red
          styleClass = 'status-5xx';
        }

        // Fire back particle animation
        neuroVisualizer.fireResponse(responseColor, isSuccess);

        // Parse body
        let bodyData = null;
        if (statusCode !== 204) {
          try {
            bodyData = await response.json();
          } catch (e) {
            bodyData = { error: "Failed to parse JSON response body" };
          }
        }

        // Render response results
        responseStatusPill.textContent = `${statusCode} ${response.statusText || getStatusText(statusCode)}`;
        responseStatusPill.className = `status-code-pill ${styleClass}`;
        responseBodyOut.textContent = bodyData ? JSON.stringify(bodyData, null, 2) : '(No Content)';

        // Log results
        logToTerminal(`[API OUTGRESS] Server response: ${statusCode} in ${latencyTime}ms`, isSuccess ? 'success' : (statusCode >= 500 ? 'server-err' : 'client-err'));

        // Handle Gatekeeper Validation Report based on validation errors
        if (statusCode === 400 && bodyData && bodyData.error) {
          const isSemantic = bodyData.error.message.includes("Semantic");
          const isSyntactic = bodyData.error.message.includes("Syntactic");

          if (isSyntactic) {
            stepSyntactic.className = 'step active failed';
            stepSyntactic.querySelector('.step-icon').textContent = '✗';
            stepSemantic.className = 'step';
          } else if (isSemantic) {
            stepSyntactic.className = 'step active passed';
            stepSyntactic.querySelector('.step-icon').textContent = '✓';
            stepSemantic.className = 'step active failed';
            stepSemantic.querySelector('.step-icon').textContent = '✗';
          }
        } else if (isSuccess) {
          // If successful and it was a validation endpoint
          if (method === 'POST' || method === 'PUT') {
            stepSyntactic.className = 'step active passed';
            stepSyntactic.querySelector('.step-icon').textContent = '✓';
            stepSemantic.className = 'step active passed';
            stepSemantic.querySelector('.step-icon').textContent = '✓';
          }
        }

        // Refresh stats
        fetchServerStats();

      } catch (err) {
        logToTerminal(`[NETWORK FAILURE] Failed to connect: ` + err.message, 'server-err');
        responseStatusPill.textContent = "503 Network Error";
        responseStatusPill.className = "status-code-pill status-5xx";
        responseBodyOut.textContent = JSON.stringify({ error: err.message }, null, 2);
        neuroVisualizer.fireResponse('#ef4444', false);
      }
    });
  }

  // Get semantic response message helper
  function getStatusText(code) {
    const statuses = {
      200: "OK", 201: "Created", 204: "No Content",
      400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
      404: "Not Found", 429: "Too Many Requests", 500: "Internal Server Error"
    };
    return statuses[code] || "Status Code";
  }

  // Bind main Sandbox form
  btnSendRequest.addEventListener('click', () => {
    const method = requestMethodSelect.value;
    const url = requestUrlInput.value;
    const bodyContent = requestBodyTextarea.value;
    fireSignalRequest(method, url, bodyContent);
  });

  // Tab switching logic for Intern Guide
  guideTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      guideTabs.forEach(t => t.classList.remove('active'));
      guideContents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Bind Quick Simulation Demo buttons
  demoGet200.addEventListener('click', () => {
    requestMethodSelect.value = 'GET';
    requestUrlInput.value = '/api/neurons';
    bodyContainer.style.display = 'none';
    fireSignalRequest('GET', '/api/neurons');
  });

  demoPost201.addEventListener('click', () => {
    requestMethodSelect.value = 'POST';
    requestUrlInput.value = '/api/neurons';
    bodyContainer.style.display = 'block';
    // Generate distinct random name to bypass Semantic unique check
    const idSeed = Math.floor(Math.random() * 1000);
    const bodyStr = `{
  "name": "Neuron-Z-${idSeed}",
  "type": "Relay",
  "charge": 65,
  "status": "Active",
  "x": ${100 + Math.floor(Math.random() * 300)},
  "y": ${100 + Math.floor(Math.random() * 200)}
}`;
    requestBodyTextarea.value = bodyStr;
    fireSignalRequest('POST', '/api/neurons', bodyStr);
  });

  demoPost400.addEventListener('click', () => {
    requestMethodSelect.value = 'POST';
    requestUrlInput.value = '/api/neurons';
    bodyContainer.style.display = 'block';
    // Same static name that already exists (Cortex-Alpha) to force Semantic duplication error
    const bodyStr = `{
  "name": "Cortex-Alpha",
  "type": "Sensory",
  "charge": 75,
  "status": "Active",
  "x": 150,
  "y": 200
}`;
    requestBodyTextarea.value = bodyStr;
    fireSignalRequest('POST', '/api/neurons', bodyStr);
  });

  demoFlood.addEventListener('click', () => {
    requestMethodSelect.value = 'GET';
    requestUrlInput.value = '/api/neurons';
    bodyContainer.style.display = 'none';
    
    logToTerminal(`[SIMULATION] Triggering load burst of 12 requests in 300ms...`, 'system');
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        fireSignalRequest('GET', '/api/neurons');
      }, i * 30);
    }
  });

  // Initial stats pull
  fetchServerStats();
});
