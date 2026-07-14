class NeuroCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.nodes = [];
    this.resize();
    this.initNodes();
    
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    // Get actual display size
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.initNodes();
  }

  initNodes() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Static nodes for visual neural pathway
    this.nodes = [
      // Client Node (Left Side)
      { id: 'client', label: 'CORTEX', x: 80, y: h / 2, size: 14, color: '#38bdf8', pulse: 0 },
      
      // Gateway Router / Brain Stem (Right Side)
      { id: 'gateway', label: 'GATEWAY', x: w - 80, y: h / 2 - 40, size: 12, color: '#34d399', pulse: 0 },
      { id: 'database', label: 'DATABASE', x: w - 80, y: h / 2 + 40, size: 12, color: '#fbbf24', pulse: 0 },
      
      // Middle Synaptic Relay nodes
      { id: 'm1', label: '', x: w * 0.3, y: h * 0.3, size: 6, color: 'rgba(255,255,255,0.2)' },
      { id: 'm2', label: '', x: w * 0.3, y: h * 0.7, size: 6, color: 'rgba(255,255,255,0.2)' },
      { id: 'm3', label: '', x: w * 0.5, y: h / 2, size: 8, color: 'rgba(255,255,255,0.3)', pulse: 0 },
      { id: 'm4', label: '', x: w * 0.7, y: h * 0.25, size: 6, color: 'rgba(255,255,255,0.2)' },
      { id: 'm5', label: '', x: w * 0.7, y: h * 0.75, size: 6, color: 'rgba(255,255,255,0.2)' }
    ];

    // Define pathways links
    this.links = [
      { from: 'client', to: 'm1' },
      { from: 'client', to: 'm2' },
      { from: 'm1', to: 'm3' },
      { from: 'm2', to: 'm3' },
      { from: 'm3', to: 'm4' },
      { from: 'm3', to: 'm5' },
      { from: 'm4', to: 'gateway' },
      { from: 'm5', to: 'gateway' },
      { from: 'gateway', to: 'database' }
    ];
  }

  // Inject a request packet to travel across the synaptic void
  fireRequest(method, callbackOnComplete) {
    // Generate traveling request particle
    const path = ['client', 'm1', 'm3', 'm4', 'gateway'];
    if (Math.random() > 0.5) {
      path[1] = 'm2';
      path[3] = 'm5';
    }

    const particle = {
      type: 'request',
      method: method,
      path: path,
      currentIndex: 0,
      t: 0,
      speed: 0.04,
      color: '#38bdf8', // Neon blue request signal
      size: 5,
      callback: callbackOnComplete
    };
    
    this.particles.push(particle);
    this.nodes[0].pulse = 1; // Pulse client node
  }

  // Inject response packet returning to client
  fireResponse(statusCodeColor, success) {
    const path = ['gateway', 'm4', 'm3', 'm1', 'client'];
    if (Math.random() > 0.5) {
      path[1] = 'm5';
      path[3] = 'm2';
    }

    const particle = {
      type: 'response',
      path: path,
      currentIndex: 0,
      t: 0,
      speed: 0.05,
      color: statusCodeColor,
      size: 5,
      success: success
    };

    // Pulse server gateway node
    const gatewayNode = this.nodes.find(n => n.id === 'gateway');
    if (gatewayNode) gatewayNode.pulse = 1;

    this.particles.push(particle);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw connections lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let link of this.links) {
      const fromNode = this.nodes.find(n => n.id === link.from);
      const toNode = this.nodes.find(n => n.id === link.to);
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      }
    }

    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const fromNode = this.nodes.find(n => n.id === p.path[p.currentIndex]);
      const toNode = this.nodes.find(n => n.id === p.path[p.currentIndex + 1]);

      if (fromNode && toNode) {
        p.t += p.speed;
        
        // Linear interpolation
        const px = fromNode.x + (toNode.x - fromNode.x) * p.t;
        const py = fromNode.y + (toNode.y - fromNode.y) * p.t;

        // Draw glowing particle
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        if (p.t >= 1) {
          p.t = 0;
          p.currentIndex++;
          
          // Trigger intermediate node pulse
          const nextNode = this.nodes.find(n => n.id === p.path[p.currentIndex]);
          if (nextNode && nextNode.pulse !== undefined) {
            nextNode.pulse = 0.5;
          }

          // Path completion
          if (p.currentIndex >= p.path.length - 1) {
            if (p.type === 'request' && p.callback) {
              p.callback();
            }
            this.particles.splice(i, 1);
          }
        }
      } else {
        this.particles.splice(i, 1);
      }
    }

    // Draw neural Nodes
    for (let node of this.nodes) {
      // Node pulse growth animation
      if (node.pulse > 0) {
        ctx.beginPath();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1;
        ctx.arc(node.x, node.y, node.size + (node.pulse * 25), 0, Math.PI * 2);
        ctx.stroke();
        node.pulse -= 0.02;
      }

      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fill();

      // Inner center color highlight
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Node text labels
      if (node.label) {
        ctx.font = `bold 10px 'Outfit', sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - node.size - 8);
      }
    }
  }
}
window.NeuroCanvas = NeuroCanvas;
