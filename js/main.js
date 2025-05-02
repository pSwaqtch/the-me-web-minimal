// Gravity Grid Animation with Customizable Parameters

// Configuration
const CONFIG = {
  grid: {
    spacing: 20,
    warpStrength: 9800,
    maxDistance: 100,
    maxDisplacement: 125,
  },
  cursor: {
    inner: {
      radius: 10,
      color: "rgba(255, 255, 255, 0.9)",
    },
    outer: {
      radius: 40,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.8)",
      glowColor: "rgba(255, 255, 255, 0)",
      blurAmount: "8px",
      backgroundColor: "rgba(255, 255, 255, 0.0)",
      scale: {
        normal: 1,
        hover: 0.8,
      },
      lag: 1, // Lag factor for smooth following
    },
    scale: {
      normal: 1,
      hover: 0.8,
    },
  },
  controls: {
    ranges: {
      spacing: { min: 10, max: 100 },
      warpStrength: { min: 1000, max: 15000 },
      maxDistance: { min: 50, max: 500 },
      maxDisplacement: { min: 10, max: 200 },
    },
  },
};

// State Management
const state = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  rows: 0,
  cols: 0,
  originalPoints: [],
  mouse: { x: 0, y: 0 },
  cursor: {
    current: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
  },
  isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints,
  isCustomCursorEnabled: true,
};

// DOM Elements Cache
const elements = {
  cursorInner: null,
  cursorOuter: null,
  controls: null,
  themeToggle: null,
  tooltip: null,
  cursorToggle: null,
};

// Initialize DOM Elements
function initializeDOM() {
  // remmove the default cursor
  document.body.style.cursor = "none";
  document.body.style.userSelect = "none";
  document.body.style.overflow = "hidden";

  // Create Custom Cursor
  elements.cursor = document.createElement("div");
  elements.cursor.id = "customCursor";
  elements.cursor.style.position = "fixed";
  elements.cursor.style.width = `${
    CONFIG.cursor.radius * CONFIG.cursor.scale.normal
  }px`;
  elements.cursor.style.height = `${
    CONFIG.cursor.radius * CONFIG.cursor.scale.normal
  }px`;
  elements.cursor.style.borderRadius = "40%";
  elements.cursor.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  elements.cursor.style.pointerEvents = "none";
  elements.cursor.style.transition =
    "transform 0.2s ease, width 0.2s ease, height 0.2s ease";
  elements.cursor.style.zIndex = "9999";
  document.body.appendChild(elements.cursor);

  // Theme Toggle Button
  elements.themeToggle = document.createElement("button");
  elements.themeToggle.className = "theme-toggle";
  elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  elements.themeToggle.addEventListener("click", toggleTheme);
  document.body.appendChild(elements.themeToggle);

  // Cursor Toggle Button
  elements.cursorToggle = document.createElement("button");
  elements.cursorToggle.className = "cursor-toggle";
  elements.cursorToggle.innerHTML = '<i class="fas fa-mouse-pointer"></i>';
  elements.cursorToggle.addEventListener("click", toggleCustomCursor);
  document.body.appendChild(elements.cursorToggle);

  // Controls Container
  const controlsContainer = document.createElement("div");
  controlsContainer.className = "controls-container";

  const toggleControlsButton = document.createElement("button");
  toggleControlsButton.className = "toggle-controls";
  toggleControlsButton.textContent = "Controls";
  toggleControlsButton.addEventListener("click", toggleControls);
  controlsContainer.appendChild(toggleControlsButton);

  elements.controls = document.createElement("div");
  elements.controls.className = "controls";
  elements.controls.id = "controls";

  // Control Inputs
  const controls = [
    { id: "spacing", label: "Grid Spacing", value: CONFIG.grid.spacing },
    {
      id: "warpStrength",
      label: "Gravity Force",
      value: CONFIG.grid.warpStrength,
    },
    {
      id: "maxDistance",
      label: "Max Distance",
      value: CONFIG.grid.maxDistance,
    },
    {
      id: "maxDisplacement",
      label: "Max Displacement",
      value: CONFIG.grid.maxDisplacement,
    },
  ];

  elements.controls.innerHTML = controls
    .map(
      (control) => `
            <label>
                ${control.label}: 
                <input type="range" id="${control.id}Range" 
                    min="${CONFIG.controls.ranges[control.id].min}" 
                    max="${CONFIG.controls.ranges[control.id].max}" 
                    value="${control.value}">
                <input type="number" id="${control.id}Input" 
                    min="${CONFIG.controls.ranges[control.id].min}" 
                    max="${CONFIG.controls.ranges[control.id].max}" 
                    value="${control.value}">
            </label>
        `
    )
    .join("");

  controlsContainer.appendChild(elements.controls);
  controlsContainer.style.cursor = "default";
  document.body.appendChild(controlsContainer);

  // Add event listeners to the controls after they're in the DOM
  controls.forEach(control => {
    const rangeInput = document.getElementById(`${control.id}Range`);
    const numberInput = document.getElementById(`${control.id}Input`);
    
    const updateControl = (value) => {
      const numValue = parseInt(value);
      CONFIG.grid[control.id] = numValue;
      rangeInput.value = numValue;
      numberInput.value = numValue;
      
      if (control.id === "spacing") {
        rebuildGrid();
      }
    };

    rangeInput.addEventListener('input', (e) => updateControl(e.target.value));
    numberInput.addEventListener('change', (e) => updateControl(e.target.value));
  });

  // Main Content
  const container = document.createElement("div");
  container.className = "container";

  const nameElement = document.createElement("h1");
  nameElement.textContent = "Krupal Virani";
  container.appendChild(nameElement);

  const subtitleElement = document.createElement("p");
  subtitleElement.className = "subtitle";
  subtitleElement.textContent = "subtitle";
  container.appendChild(subtitleElement);

  const linksContainer = document.createElement("div");
  linksContainer.className = "links";
  container.appendChild(linksContainer);

  document.body.appendChild(container);

  // Tooltip
  elements.tooltip = document.createElement("div");
  elements.tooltip.id = "tooltip";
  elements.tooltip.className = "tooltip";
  elements.tooltip.textContent = "Hover over me!";
  document.body.appendChild(elements.tooltip);
}

// Custom Cursor
function initializeCustomCursor() {
  try {
    // Hide default cursor and prevent text selection
    document.body.style.cursor = "none";
    document.body.style.userSelect = "none";
    document.body.style.overflow = "hidden";

    // Create inner dot
    elements.cursorInner = document.createElement("div");
    elements.cursorInner.id = "customCursorInner";
    Object.assign(elements.cursorInner.style, {
      position: "fixed",
      width: `${CONFIG.cursor.inner.radius * 2}px`,
      height: `${CONFIG.cursor.inner.radius * 2}px`,
      borderRadius: "50%",
      backgroundColor: CONFIG.cursor.inner.color,
      pointerEvents: "none",
      zIndex: "10000",
      transform: "translate(-50%, -50%)",
      willChange: "transform", // Optimize for animations
    });
    document.body.appendChild(elements.cursorInner);

    // Create outer ring with blur effect
    elements.cursorOuter = document.createElement("div");
    elements.cursorOuter.id = "customCursorOuter";
    Object.assign(elements.cursorOuter.style, {
      position: "fixed",
      width: `${CONFIG.cursor.outer.radius * 2}px`,
      height: `${CONFIG.cursor.outer.radius * 2}px`,
      borderRadius: "50%",
      border: `${CONFIG.cursor.outer.borderWidth}px solid ${CONFIG.cursor.outer.borderColor}`,
      backgroundColor: CONFIG.cursor.outer.backgroundColor,
      backdropFilter: `blur(${CONFIG.cursor.outer.blurAmount})`,
      WebkitBackdropFilter: `blur(${CONFIG.cursor.outer.blurAmount})`, // For Safari
      boxShadow: `
                    0 0 10px ${CONFIG.cursor.outer.glowColor},
                    0 0 20px ${CONFIG.cursor.outer.glowColor},
                    0 0 30px ${CONFIG.cursor.outer.glowColor}
                `,
      pointerEvents: "none",
      zIndex: "9999",
      transform: "translate(-50%, -50%)",
      transition:
        "transform 0.2s ease, width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease, backdrop-filter 0.2s ease",
      willChange: "transform, width, height, box-shadow, backdrop-filter", // Optimize for animations
    });
    document.body.appendChild(elements.cursorOuter);

    // Initialize cursor position
    state.cursor.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    state.cursor.target = { ...state.cursor.current };

    return true;
  } catch (error) {
    console.error("Failed to initialize custom cursor:", error);
    // Fallback to default cursor
    document.body.style.cursor = "auto";
    return false;
  }
}

function updateCursor(e) {
  if (!state.isCustomCursorEnabled || !elements.cursorInner || !elements.cursorOuter) return;

  // Update target position
  state.cursor.target.x = e.clientX;
  state.cursor.target.y = e.clientY;

  // Update inner cursor immediately
  elements.cursorInner.style.left = `${state.cursor.target.x}px`;
  elements.cursorInner.style.top = `${state.cursor.target.y}px`;
}

function updateCursorPosition() {
  if (!elements.cursorOuter) return;

  // Smoothly update outer cursor position with lag
  const dx = state.cursor.target.x - state.cursor.current.x;
  const dy = state.cursor.target.y - state.cursor.current.y;

  state.cursor.current.x += dx * CONFIG.cursor.outer.lag;
  state.cursor.current.y += dy * CONFIG.cursor.outer.lag;

  elements.cursorOuter.style.left = `${state.cursor.current.x}px`;
  elements.cursorOuter.style.top = `${state.cursor.current.y}px`;

  requestAnimationFrame(updateCursorPosition);
}

function setCursorSize(scale) {
  if (!elements.cursorOuter) return;

  const size = CONFIG.cursor.outer.radius * 2 * scale;
  const glowIntensity = scale === CONFIG.cursor.outer.scale.hover ? 0.5 : 0.3;
  const blurAmount = scale === CONFIG.cursor.outer.scale.hover ? "12px" : "8px";

  elements.cursorOuter.style.width = `${size}px`;
  elements.cursorOuter.style.height = `${size}px`;
  elements.cursorOuter.style.boxShadow = `
            0 0 10px rgba(255, 255, 255, ${glowIntensity}),
            0 0 20px rgba(255, 255, 255, ${glowIntensity}),
            0 0 30px rgba(255, 255, 255, ${glowIntensity})
        `;
  elements.cursorOuter.style.backdropFilter = `blur(${blurAmount})`;
  elements.cursorOuter.style.WebkitBackdropFilter = `blur(${blurAmount})`; // For Safari
}

function clickCursor() {
  if (!state.isCustomCursorEnabled || !elements.cursorOuter) return;

  elements.cursorOuter.style.transform = "translate(-50%, -50%) scale(0.8)";
  setTimeout(() => {
    if (elements.cursorOuter) {
      elements.cursorOuter.style.transform = "translate(-50%, -50%) scale(1)";
    }
  }, 150);
}

// Event Listeners
function addEventListeners() {
  state.canvas.addEventListener("mousemove", (e) => {
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
  });

  state.canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
      state.mouse.x = e.touches[0].clientX;
      state.mouse.y = e.touches[0].clientY;
      e.preventDefault();
    }
  });

  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("mousemove", updateCursor);
  document.addEventListener("mousedown", clickCursor);

  // Add hover effects for interactive elements
  document.querySelectorAll("button, a, input").forEach((element) => {
    element.addEventListener("mouseenter", () =>
      setCursorSize(CONFIG.cursor.outer.scale.hover)
    );
    element.addEventListener("mouseleave", () =>
      setCursorSize(CONFIG.cursor.outer.scale.normal)
    );
  });

  // Start cursor animation loop if cursor was initialized successfully
  if (elements.cursorInner && elements.cursorOuter) {
    updateCursorPosition();
  }
}

// Core Functions
function initializeCanvas() {
  state.canvas = document.createElement("canvas");
  state.canvas.id = "gravityGrid";
  state.canvas.className = "background";
  document.body.appendChild(state.canvas);
  state.ctx = state.canvas.getContext("2d");
  resizeCanvas();
}

function resizeCanvas() {
  state.width = state.canvas.width = window.innerWidth;
  state.height = state.canvas.height = window.innerHeight;
  rebuildGrid();
}

function rebuildGrid() {
  state.rows = Math.ceil(state.height / CONFIG.grid.spacing) + 1;
  state.cols = Math.ceil(state.width / CONFIG.grid.spacing) + 1;

  state.originalPoints = [];
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      state.originalPoints.push({
        x: x * CONFIG.grid.spacing,
        y: y * CONFIG.grid.spacing,
      });
    }
  }
}

function getDistortedPoint(point) {
  const dx = point.x - state.mouse.x;
  const dy = point.y - state.mouse.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < CONFIG.grid.maxDistance) {
    const angle = Math.atan2(dy, dx);
    const force =
      (1 - distance / CONFIG.grid.maxDistance) *
      CONFIG.grid.maxDisplacement *
      (CONFIG.grid.warpStrength / 10000);
    return {
      x: point.x - Math.cos(angle) * force,
      y: point.y - Math.sin(angle) * force,
    };
  }
  return point;
}

function animate() {
  state.ctx.clearRect(0, 0, state.width, state.height);
  state.ctx.strokeStyle = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--grid-color");
  state.ctx.lineWidth = 1;

  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols - 1; x++) {
      const i = y * state.cols + x;
      const p1 = getDistortedPoint(state.originalPoints[i]);
      const p2 = getDistortedPoint(state.originalPoints[i + 1]);
      drawLine(p1, p2);
    }
  }

  for (let y = 0; y < state.rows - 1; y++) {
    for (let x = 0; x < state.cols; x++) {
      const i = y * state.cols + x;
      const p1 = getDistortedPoint(state.originalPoints[i]);
      const p3 = getDistortedPoint(state.originalPoints[i + state.cols]);
      drawLine(p1, p3);
    }
  }

  requestAnimationFrame(animate);
}

function drawLine(p1, p2) {
  state.ctx.beginPath();
  state.ctx.moveTo(p1.x, p1.y);
  state.ctx.lineTo(p2.x, p2.y);
  state.ctx.stroke();
}

// Theme Toggle
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  body.setAttribute("data-theme", newTheme);

  const themeIcon = document.querySelector(".theme-toggle i");
  themeIcon.className = newTheme === "light" ? "fas fa-moon" : "fas fa-sun";
}

// Tooltip
function initializeTooltip() {
  document.querySelectorAll(".link").forEach((link) => {
    link.addEventListener("mouseenter", (e) => {
      const tooltip = document.getElementById("tooltip");
      tooltip.style.display = "block";
      tooltip.style.left = `${e.pageX}px`;
      tooltip.style.top = `${e.pageY - 30}px`;
      tooltip.textContent = link.title;
    });

    link.addEventListener("mouseleave", () => {
      document.getElementById("tooltip").style.display = "none";
    });

    link.addEventListener("mousemove", (e) => {
      const tooltip = document.getElementById("tooltip");
      tooltip.style.left = `${e.pageX}px`;
      tooltip.style.top = `${e.pageY - 30}px`;
    });
  });
}

// Initialize Application
function initializeApp() {
  initializeDOM();
  initializeCanvas();
  if (initializeCustomCursor()) {
    addEventListeners();
  }
  animate();
}

initializeApp();

// filepath: q:\website\krupal-pswaqtch-on-web\index.html
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Fetch data from data.json
    const response = await fetch("data.json");
    const data = await response.json();

    // Update name and title
    const nameElement = document.querySelector("h1");
    const subtitleElement = document.querySelector(".subtitle");
    nameElement.textContent = data.personalInfo.name;
    subtitleElement.textContent = data.personalInfo.title;

    // Populate social links
    const socialLinks = {
      twitter: "fab fa-x-twitter",
      mastodon: "fab fa-mastodon",
      reddit: "fab fa-reddit",
      instagram: "fab fa-instagram",
      linkedin: "fab fa-linkedin",
      email: "fas fa-envelope",
    };

    const linksContainer = document.querySelector(".links");
    const socialData = data.contact.social;

    Object.entries(socialData).forEach(([key, url]) => {
      if (key != "reddit" && key != "instagram" && key != "linkedin") {
        const link = document.createElement("a");
        link.href = url;
        link.className = "link";
        link.title = key.charAt(0).toUpperCase() + key.slice(1);
        link.innerHTML = `<i class="${socialLinks[key] || "fas fa-link"}"></i>`;
        linksContainer.appendChild(link);
      }
    });
  } catch (error) {
    console.error("Error loading data:", error);
  }
});

function toggleControls() {
  elements.controls.style.display =
    elements.controls.style.display === "none" ? "block" : "none";
}

function toggleCustomCursor() {
  state.isCustomCursorEnabled = !state.isCustomCursorEnabled;
  
  if (state.isCustomCursorEnabled) {
    document.body.style.cursor = "none";
    if (elements.cursorInner) elements.cursorInner.style.display = "block";
    if (elements.cursorOuter) elements.cursorOuter.style.display = "block";
    elements.cursorToggle.innerHTML = '<i class="fas fa-mouse-pointer"></i>';
  } else {
    document.body.style.cursor = "auto";
    if (elements.cursorInner) elements.cursorInner.style.display = "none";
    if (elements.cursorOuter) elements.cursorOuter.style.display = "none";
    elements.cursorToggle.innerHTML = '<i class="fas fa-mouse"></i>';
  }
}
