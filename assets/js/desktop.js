// ── Window controls (close / minimize / maximize) ──
function initWindowControls() {
  const closeBtn = document.querySelector(".control.close");
  const minBtn = document.querySelector(".control.minimize");
  const maxBtn = document.querySelector(".control.maximize");
  const monitor = document.querySelector(".monitor-bezel");
  const desktop = document.getElementById("desktop");

  // Initialize indicators (Terminal is open on load)
  document
    .querySelector('.dock-icon[data-command=""]')
    ?.classList.add("is-open");

  // CLOSE (Red Dot) - Clears progress, dock dot, and goes to desktop
  closeBtn?.addEventListener("click", () => {
    if (!monitor || !desktop) return;
    minimizeToDesktop(monitor, desktop);

    // Completely reset terminal progress
    if (typeof resetTerminal === "function") resetTerminal();

    // Remove dock indicator dot for terminal
    document
      .querySelector('.dock-icon[data-command=""]')
      ?.classList.remove("is-open");
  });

  // MINIMIZE (Yellow Dot) → Desktop (Keeps progress & dock dot)
  minBtn?.addEventListener("click", () => {
    if (!monitor || !desktop) return;
    minimizeToDesktop(monitor, desktop);
    // Note: We DON'T remove the .is-open class here
  });

  // MAXIMIZE — stretch monitor to viewport (no browser fullscreen)
  maxBtn?.addEventListener("click", () => {
    if (!monitor) return;
    const isMax = monitor.classList.toggle("is-maximized");
    document.body.style.overflow = isMax ? "hidden" : "auto";
  });
}

// Helper to clear terminal progress
function resetTerminal() {
  const output = document.getElementById("output");
  if (output) {
    output.innerHTML = `
      <div class="terminal-banner">SQL_TERM v2.0 - PORTFOLIO DATABASE</div>
      <pre class="line dim">Type <span class="bright">HELP</span> to see available commands.</pre>
      <pre class="line">&nbsp;</pre>
    `;
  }
}

// Minimize: terminal out → desktop in
function minimizeToDesktop(monitor, desktop) {
  monitor.classList.add("is-minimized");
  desktop.classList.add("desktop--visible");

  if (lenis) lenis.stop();

  gsap.to(monitor, {
    opacity: 0,
    scale: 0.85,
    y: 60,
    duration: 0.38,
    ease: "power3.in",
  });

  gsap.fromTo(
    desktop,
    { opacity: 0 },
    { opacity: 1, duration: 0.35, ease: "power2.out", delay: 0.15 },
  );

  gsap.fromTo(
    ".desktop-menubar",
    { opacity: 0, y: -10 },
    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.25 },
  );

  gsap.fromTo(
    ".desktop-icons-area .desktop-file-icon",
    { opacity: 0, y: 12 },
    {
      opacity: 1,
      y: 0,
      duration: 0.35,
      stagger: 0.06,
      ease: "power2.out",
      delay: 0.3,
    },
  );

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const dockStart = isMobile 
    ? { x: -20, y: 0, xPercent: 0, yPercent: -50 } 
    : { x: 0, y: 20, xPercent: -50, yPercent: 0 };
    
  const dockEnd = isMobile 
    ? { x: 0, y: 0, xPercent: 0, yPercent: -50 } 
    : { x: 0, y: 0, xPercent: -50, yPercent: 0 };

  gsap.fromTo(
    ".desktop-dock",
    { opacity: 0, ...dockStart },
    { opacity: 1, ...dockEnd, duration: 0.45, ease: "back.out(1.4)", delay: 0.3 },
  );
}

// Restore: desktop out → terminal in
function restoreFromDesktop(monitor, desktop, command = null) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const dockOut = isMobile 
    ? { x: -25, y: 0, xPercent: 0, yPercent: -50 } 
    : { x: 0, y: 20, xPercent: -50, yPercent: 0 };

  gsap.to(".desktop-dock", {
    opacity: 0,
    ...dockOut,
    duration: 0.22,
    ease: "power2.in",
  });
  gsap.to(".desktop-menubar", {
    opacity: 0,
    y: -8,
    duration: 0.22,
    ease: "power2.in",
  });
  gsap.to(".desktop-icons-area .desktop-file-icon", {
    opacity: 0,
    y: 8,
    duration: 0.18,
    stagger: 0.04,
    ease: "power2.in",
  });

  gsap.to(desktop, {
    opacity: 0,
    duration: 0.3,
    delay: 0.1,
    ease: "power2.in",
    onComplete: () => {
      desktop.classList.remove("desktop--visible");
    },
  });

  monitor.classList.remove("is-minimized");

  gsap.fromTo(
    monitor,
    { opacity: 0, scale: 0.88, y: 50 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: "back.out(1.3)",
      delay: 0.15,
      onComplete: () => {
        if (lenis) lenis.start();
        if (command) handleCommand(command);
        
        // Only focus keyboard if not mobile
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        if (!isMobile) {
          cmdInput.focus();
        }
      },
    },
  );
}

// Desktop interactions: dock + icons
function initDesktopInteractions() {
  const monitor = document.querySelector(".monitor-bezel");
  const desktop = document.getElementById("desktop");
  const aboutOverlay = document.getElementById("aboutOverlay");
  if (!monitor || !desktop) return;

  document.querySelectorAll(".dock-icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      const app = icon.dataset.app !== undefined ? icon.dataset.app : null;
      const command =
        icon.dataset.command !== undefined ? icon.dataset.command : null;
      const folder =
        icon.dataset.folder !== undefined ? icon.dataset.folder : null;

      // About app: open overlay on the desktop instead of restoring terminal
      if (app === "about") {
        if (!aboutOverlay) return;
        aboutOverlay.classList.add("is-visible");
        icon.classList.add("is-open");
        gsap.fromTo(
          ".about-window",
          { opacity: 0, scale: 0.9, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.3)" },
        );
        if (typeof window.focusWindow === "function")
          window.focusWindow(".about-window");
        return;
      }

      // Standalone Contacts app
      if (app === "contacts") {
        const contactsOverlay = document.getElementById("contactsOverlay");
        if (!contactsOverlay) return;
        contactsOverlay.classList.add("is-visible");
        icon.classList.add("is-open");
        gsap.fromTo(
          ".contacts-window",
          { opacity: 0, scale: 0.9, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" },
        );
        if (typeof window.focusWindow === "function")
          window.focusWindow(".contacts-window");
        return;
      }

      if (folder && typeof window.openFinder === "function") {
        window.openFinder(folder);
        return;
      }

      if (command !== null) {
        restoreFromDesktop(monitor, desktop, command);
      }
    });
  });

  document.querySelectorAll(".desktop-file-icon").forEach((icon) => {
    const openHandler = () => {
      const app = icon.dataset.app !== undefined ? icon.dataset.app : null;
      const command =
        icon.dataset.command !== undefined ? icon.dataset.command : null;
      const folder =
        icon.dataset.folder !== undefined ? icon.dataset.folder : null;
      const img =
        icon.dataset.img !== undefined ? icon.dataset.img : null;

      if (app === "contacts") {
        const conn = document.querySelector('.dock-icon[data-app="contacts"]');
        conn?.click(); // reuse dock click logic
        return;
      }

      if (folder && typeof window.openFinder === "function") {
        window.openFinder(folder);
      } else if (img && typeof window.openImageViewer === "function") {
        const label = icon.querySelector(".file-icon__label") || icon.querySelector(".finder-icon-label");
        window.openImageViewer(img, label?.innerText);
      } else if (command !== null) {
        restoreFromDesktop(monitor, desktop, command);
      }
    };

    // Single click: select on desktop, open on mobile
    icon.addEventListener("click", () => {
      document
        .querySelectorAll(".desktop-file-icon")
        .forEach((i) => i.classList.remove("selected"));
      icon.classList.add("selected");

      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        openHandler();
      }
    });

    // Double click: open (Desktop)
    icon.addEventListener("dblclick", openHandler);
  });
}

// About app interactions
function initAboutApp() {
  const overlay = document.getElementById("aboutOverlay");
  if (!overlay) return;

  const windowEl = overlay.querySelector(".about-window");
  const closeDot = overlay.querySelector(".mac-close");
  const minDot = overlay.querySelector(".mac-min");
  const maxDot = overlay.querySelector(".mac-max");

  function close() {
    gsap.to(windowEl, {
      opacity: 0,
      scale: 0.9,
      y: 18,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("is-visible");
        windowEl.classList.remove("is-maximized");
        document
          .querySelector('.dock-icon[data-app="about"]')
          ?.classList.remove("is-open");
      },
    });
  }

  closeDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  minDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });
}

// Contacts app interactions
function initContactsApp() {
  const overlay = document.getElementById("contactsOverlay");
  if (!overlay) return;

  const windowEl = overlay.querySelector(".contacts-window");
  const closeDot = overlay.querySelector(".mac-close");
  const minDot = overlay.querySelector(".mac-min");

  function close() {
    gsap.to(windowEl, {
      opacity: 0,
      scale: 0.9,
      y: 18,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("is-visible");
        document
          .querySelector('.dock-icon[data-app="contacts"]')
          ?.classList.remove("is-open");
      },
    });
  }

  closeDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  minDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });
}

// Menubar clock
function initMenubarClock() {
  const clock = document.getElementById("menubarClock");
  if (!clock) return;

  function tick() {
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();

    let h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;

    // Exact format: "Tue Mar 10 3:24 PM"
    clock.textContent = `${dayName} ${monthName} ${date}  ${h}:${m} ${ampm}`;
  }

  tick();
  setInterval(tick, 1000);
}

// Finder app interactions
function initFinderApp() {
  const overlay = document.getElementById("finderOverlay");
  if (!overlay) return;

  const windowEl = overlay.querySelector(".finder-window");
  const closeDot = overlay.querySelector(".mac-close");
  const minDot = overlay.querySelector(".mac-min");
  const maxDot = overlay.querySelector(".mac-max");

  function close() {
    gsap.to(windowEl, {
      opacity: 0,
      scale: 0.9,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("is-visible");
        windowEl.classList.remove("is-maximized");
        document
          .querySelectorAll(".dock-icon[data-folder]")
          .forEach((i) => i.classList.remove("is-open"));
      },
    });
  }

  closeDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  minDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close(); // Minimized overlays just hide back to dock state essentially
  });

  // Sidebar navigation
  const sidebarItems = overlay.querySelectorAll(".finder-sidebar ul li");
  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;
      if (target) window.openFinder(target);
    });
  });

  // Navigation history
  const backBtn = document.getElementById("finderBack");
  const forwardBtn = document.getElementById("finderForward");

  backBtn?.addEventListener("click", () => {
    if (window.finderHistoryIndex > 0) {
      window.finderHistoryIndex--;
      const target = window.finderHistory[window.finderHistoryIndex];
      window.openFinder(target, false); // false = don't push to history
    }
  });

  forwardBtn?.addEventListener("click", () => {
    if (window.finderHistoryIndex < window.finderHistory.length - 1) {
      window.finderHistoryIndex++;
      const target = window.finderHistory[window.finderHistoryIndex];
      window.openFinder(target, false); // false = don't push to history
    }
  });
}

window.finderHistory = ["Resume"]; // Initial state
window.finderHistoryIndex = 0;

window.openFinder = function (folderName, pushToHistory = true) {
  const overlay = document.getElementById("finderOverlay");
  if (!overlay) return;

  // History management
  if (pushToHistory) {
    // If we're not at the end of the history, truncate it
    if (window.finderHistoryIndex < window.finderHistory.length - 1) {
      window.finderHistory = window.finderHistory.slice(
        0,
        window.finderHistoryIndex + 1,
      );
    }
    // Only push if it's different from the current
    if (window.finderHistory[window.finderHistoryIndex] !== folderName) {
      window.finderHistory.push(folderName);
      window.finderHistoryIndex++;
    }
  }

  // Update button states
  const backBtn = document.getElementById("finderBack");
  const forwardBtn = document.getElementById("finderForward");
  if (backBtn) {
    backBtn.style.opacity = window.finderHistoryIndex > 0 ? "1" : "0.3";
    backBtn.style.pointerEvents = window.finderHistoryIndex > 0 ? "auto" : "none";
  }
  if (forwardBtn) {
    forwardBtn.style.opacity =
      window.finderHistoryIndex < window.finderHistory.length - 1 ? "1" : "0.3";
    forwardBtn.style.pointerEvents =
      window.finderHistoryIndex < window.finderHistory.length - 1
        ? "auto"
        : "none";
  }

  // Update title and path
  const titleEl = document.getElementById("finderTitle");
  const statusEl = document.getElementById("finderStatusText");
  if (titleEl) titleEl.textContent = folderName;
  if (statusEl) statusEl.textContent = `guest > ${folderName}`;

  // Update active sidebar item
  // Dock Indicator
  document
    .querySelectorAll(".dock-icon[data-folder]")
    .forEach((i) => i.classList.remove("is-open"));
  document
    .querySelector(`.dock-icon[data-folder="${folderName}"]`)
    ?.classList.add("is-open");

  const sidebarItems = overlay.querySelectorAll(".finder-sidebar ul li");
  sidebarItems.forEach((item) => {
    if (item.dataset.target === folderName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Generate realistic content based on folder
  const contentEl = document.getElementById("finderContent");
  if (contentEl) {
    contentEl.innerHTML = "";
    let itemsHtml = "";

    if (folderName === "Resume") {
      itemsHtml = `
        <div class="finder-icon" data-pdf="assets/img/Resume - Troy.pdf">
          <div class="finder-icon-visual"><img src="assets/img/Document.png" alt="pdf"></div>
          <div class="finder-icon-label">Resume - Troy.pdf</div>
        </div>
      `;
    } else if (folderName === "Projects") {
      itemsHtml = `
        <div class="finder-icon" data-folder="Passion Fueled">
          <div class="finder-icon-visual"><img src="assets/img/folder.png" alt="folder"></div>
          <div class="finder-icon-label">Passion Fueled</div>
        </div>
        <div class="finder-icon" data-folder="Commissions">
          <div class="finder-icon-visual"><img src="assets/img/folder.png" alt="folder"></div>
          <div class="finder-icon-label">Commissions</div>
        </div>
      `;
    } else if (folderName === "Commissions") {
      itemsHtml = `
        <div class="finder-icon" data-folder="LGU-Kiosk">
          <div class="finder-icon-visual"><img src="assets/img/folder.png" alt="folder"></div>
          <div class="finder-icon-label">LGU-Kiosk</div>
        </div>
      `;
    } else if (folderName === "LGU-Kiosk") {
      itemsHtml = `
        <div class="finder-icon" data-pdf="assets/projects/Commissions/LGU-Kiosk/README.pdf">
          <div class="finder-icon-visual"><img src="assets/img/Document.png" alt="document"></div>
          <div class="finder-icon-label">READ ME</div>
        </div>
        <div class="finder-icon" data-app="lgu-kiosk">
          <div class="finder-icon-visual"><img src="assets/img/Application.png" alt="app"></div>
          <div class="finder-icon-label">LGU-Kiosk</div>
        </div>
      `;
    } else if (folderName === "Passion Fueled") {
      itemsHtml = `
        <div class="finder-icon" data-folder="Wordle">
          <div class="finder-icon-visual"><img src="assets/img/folder.png" alt="folder"></div>
          <div class="finder-icon-label">Wordle</div>
        </div>
        <div class="finder-icon" data-folder="FlavorMapping">
          <div class="finder-icon-visual"><img src="assets/img/folder.png" alt="folder"></div>
          <div class="finder-icon-label">FlavorMapping</div>
        </div>
        <div class="finder-icon" data-folder="Prompteering">
          <div class="finder-icon-visual"><img src="assets/img/folder.png" alt="folder"></div>
          <div class="finder-icon-label">Prompteering</div>
        </div>
        <div class="finder-icon" data-folder="DevCampResearch">
          <div class="finder-icon-visual"><img src="assets/img/folder.png" alt="folder"></div>
          <div class="finder-icon-label">DevCampResearch</div>
        </div>
      `;
    } else if (folderName === "Wordle") {
      itemsHtml = `
        <div class="finder-icon" data-pdf="assets/projects/Wordle/README.pdf">
          <div class="finder-icon-visual"><img src="assets/img/Document.png" alt="document"></div>
          <div class="finder-icon-label">READ ME</div>
        </div>
        <div class="finder-icon" data-app="wordle">
          <div class="finder-icon-visual"><img src="assets/img/Application.png" alt="app"></div>
          <div class="finder-icon-label">Wordle</div>
        </div>
      `;
    } else if (folderName === "FlavorMapping") {
      itemsHtml = `
        <div class="finder-icon" data-pdf="assets/projects/FlavorMapping/README.pdf">
          <div class="finder-icon-visual"><img src="assets/img/Document.png" alt="document"></div>
          <div class="finder-icon-label">READ ME</div>
        </div>
        <div class="finder-icon" data-app="flavor-mapping">
          <div class="finder-icon-visual"><img src="assets/img/Application.png" alt="app"></div>
          <div class="finder-icon-label">FlavorMapping</div>
        </div>
      `;
    } else if (folderName === "Prompteering") {
      itemsHtml = `
        <div class="finder-icon" data-pdf="assets/projects/Prompteering/README.pdf">
          <div class="finder-icon-visual"><img src="assets/img/Document.png" alt="document"></div>
          <div class="finder-icon-label">READ ME</div>
        </div>
        <div class="finder-icon" data-app="prompteering">
          <div class="finder-icon-visual"><img src="assets/img/Application.png" alt="app"></div>
          <div class="finder-icon-label">Prompteering</div>
        </div>
      `;
    } else if (folderName === "DevCampResearch") {
      itemsHtml = `
        <div class="finder-icon" data-pdf="assets/projects/DevCampResearch/README.pdf">
          <div class="finder-icon-visual"><img src="assets/img/Document.png" alt="document"></div>
          <div class="finder-icon-label">READ ME</div>
        </div>
        <div class="finder-icon" data-app="devcamp-research">
          <div class="finder-icon-visual"><img src="assets/img/Application.png" alt="app"></div>
          <div class="finder-icon-label">DevCampResearch</div>
        </div>
        <div class="finder-icon" data-img="assets/img/DevCamp Team.jpeg">
          <div class="finder-icon-visual">
            <img src="assets/img/DevCamp Team.jpeg" alt="team" style="border-radius: 1px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
          </div>
          <div class="finder-icon-label">DevCamp Team</div>
        </div>
      `;
    } else {
      itemsHtml = `<div class="finder-icon-label" style="opacity: 0.5; width: 100%; text-align: center; margin-top: 20px;">Folder is empty</div>`;
    }

    contentEl.innerHTML = itemsHtml;

    // Attach click events
    contentEl.querySelectorAll(".finder-icon").forEach((icon) => {
      const openHandler = () => {
        if (icon.dataset.folder) {
          window.openFinder(icon.dataset.folder);
        } else if (icon.dataset.app) {
          const app = icon.dataset.app;
          if (app === "contacts") {
            const conn = document.querySelector(
              '.dock-icon[data-app="contacts"]',
            );
            if (conn) conn.click();
          } else {
            // Project Webapps
            let url = "";
            if (app === "wordle") url = "https://wordleer.netlify.app/";
            else if (app === "flavor-mapping")
              url = "https://flavormapping.netlify.app/";
            else if (app === "prompteering")
              url = "https://prompteering.netlify.app/";
            else if (app === "devcamp-research")
              url = "https://researchdevcamp.netlify.app/";
            else if (app === "lgu-kiosk")
              url = "https://kioskkk.netlify.app/";

            if (url && typeof window.openPdfViewer === "function") {
              window.openPdfViewer(
                url,
                icon.querySelector(".finder-icon-label").innerText,
                "800px",
                "650px",
              );
            }
          }
        } else if (icon.dataset.pdf) {
          if (typeof window.openPdfViewer === "function") {
            window.openPdfViewer(
              icon.dataset.pdf,
              icon.querySelector(".finder-icon-label").innerText,
            );
          }
        } else if (icon.dataset.img) {
          if (typeof window.openImageViewer === "function") {
            window.openImageViewer(
              icon.dataset.img,
              icon.querySelector(".finder-icon-label").innerText,
            );
          }
        }
      };

      icon.addEventListener("dblclick", openHandler);
      // Single click: select on desktop, open on mobile
      icon.addEventListener("click", () => {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        if (isMobile) {
          openHandler();
        }
      });
    });
  }

  // Show window if not open
  if (!overlay.classList.contains("is-visible")) {
    overlay.classList.add("is-visible");
    gsap.fromTo(
      overlay.querySelector(".finder-window"),
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" },
    );
  }
  if (typeof window.focusWindow === "function")
    window.focusWindow(".finder-window");
};

// Preview app initialization is now handled dynamically in openPdfViewer

window.openPdfViewer = function (pdfSrc, title, width = "800px", height = "600px") {
  const desktop = document.getElementById('desktop');
  if (!desktop) return;

  // Re-use existing preview window if it exists (Singleton Pattern)
  const existingOverlay = document.querySelector('.preview-overlay');
  if (existingOverlay) {
    const win = existingOverlay.querySelector('.preview-window');
    const titleEl = existingOverlay.querySelector('.preview-title');
    const iframe = existingOverlay.querySelector('iframe');
    const previewBody = existingOverlay.querySelector('.preview-body');
    
    if (titleEl) titleEl.textContent = title || 'Preview';
    if (iframe) iframe.src = pdfSrc;
    
    // Toggle Wordle scaling class
    if (previewBody) {
      if (pdfSrc.includes('wordleer')) {
        previewBody.classList.add('is-wordle');
      } else {
        previewBody.classList.remove('is-wordle');
      }
    }
    
    // Use consistent size (on desktop only)
    if (win && !window.matchMedia("(max-width: 768px)").matches) {
      win.style.width = width;
      win.style.height = height;
    }
    
    window.focusWindow(win);
    
    // Bounce animation to show it updated
    gsap.fromTo(win, { scale: 0.98 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
    return;
  }

  const instanceId = 'preview-' + Date.now();
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'preview-overlay window-overlay is-visible';
  overlay.id = instanceId;
  overlay.style.zIndex = "30";

  overlay.innerHTML = `
    <div class="preview-window mac-window" style="width: ${width}; height: ${height}; opacity: 0; transform: scale(0.9) translateY(20px); position: absolute; top: 100px; left: 150px; margin: 0;">
      <div class="preview-titlebar">
        <div class="preview-dots mac-controls">
          <span class="preview-dot mac-close preview-close"></span>
          <span class="preview-dot mac-min"></span>
          <span class="preview-dot mac-max disabled"></span>
        </div>
        <div class="preview-title">${title || 'Preview'}</div>
      </div>
      <div class="preview-body ${pdfSrc.includes('wordleer') ? 'is-wordle' : ''}" data-lenis-prevent>
        <div class="preview-iframe-shim"></div>
        <iframe src="${pdfSrc}" style="width: 100%; height: 100%; border: none"></iframe>
      </div>
    </div>
  `;

  desktop.appendChild(overlay);

  const win = overlay.querySelector('.preview-window');
  const closeBtn = overlay.querySelector('.mac-close');
  const minBtn = overlay.querySelector('.mac-min');

  // Entrance animation
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const animConfig = isMobile 
    ? { opacity: 1, duration: 0.35 } 
    : { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.4)" };

  gsap.to(win, animConfig);

  window.focusWindow(win);

  const closeWindow = () => {
    gsap.to(win, {
      opacity: 0,
      scale: 0.9,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlay.remove();
        if (document.querySelectorAll('.mac-window').length === 0) {
          document.body.classList.remove('is-dragging');
        }
      }
    });
  };

  const shim = win.querySelector('.preview-iframe-shim');
  shim?.addEventListener('mousedown', () => {
    window.focusWindow(win);
  });

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeWindow();
  });

  minBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeWindow();
  });

  // Initialize Draggable for this new instance
  if (typeof Draggable !== "undefined") {
    Draggable.create(win, {
      type: "x,y",
      handle: ".preview-titlebar",
      bounds: "#desktop-workarea",
      onPress: function () {
        window.focusWindow(this.target);
      },
      onDragStart: function() {
        document.body.classList.add('is-dragging');
      },
      onDragEnd: function() {
        document.body.classList.remove('is-dragging');
      }
    });
  }
};

window.openImageViewer = function (imgSrc, title) {
  const desktop = document.getElementById('desktop');
  if (!desktop) return;

  const overlay = document.createElement('div');
  overlay.className = 'window-overlay image-overlay is-visible';
  overlay.innerHTML = `
    <div class="mac-window preview-window" style="width: min(90vw, 600px); height: auto; opacity: 0; transform: translateY(20px) scale(0.95);">
      <div class="preview-titlebar">
        <div class="preview-dots mac-controls">
          <div class="preview-dot mac-close"></div>
          <div class="preview-dot mac-min"></div>
          <div class="preview-dot mac-max"></div>
        </div>
        <div class="preview-title">${title || 'Image Preview'}</div>
      </div>
      <div class="preview-body" style="padding: 0; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 0 0 12px 12px;">
        <img src="${imgSrc}" style="width: 100%; height: auto; display: block;">
      </div>
    </div>
  `;

  desktop.appendChild(overlay);

  const win = overlay.querySelector('.preview-window');
  const titlebar = overlay.querySelector('.preview-titlebar');
  const closeBtn = overlay.querySelector('.mac-close');

  gsap.to(win, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.35,
    ease: "back.out(1.4)"
  });

  window.focusWindow(win);

  const closeWindow = () => {
    gsap.to(win, {
      opacity: 0,
      scale: 0.9,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => overlay.remove()
    });
  };

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeWindow();
  });

  if (typeof Draggable !== "undefined") {
    Draggable.create(win, {
      handle: ".preview-titlebar",
      bounds: "#desktop-workarea",
      onPress: () => window.focusWindow(win)
    });
  }
};

// ── Control Center interactions ──
function initControlCenter() {
  const ccToggle = document.getElementById("ccToggle");
  const ccMenu = document.getElementById("ccMenu");

  if (!ccToggle || !ccMenu) return;

  // Toggle menu
  ccToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    ccMenu.classList.toggle("is-open");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !ccMenu.contains(e.target) &&
      e.target !== ccToggle &&
      !ccToggle.contains(e.target)
    ) {
      ccMenu.classList.remove("is-open");
    }
  });

  // Dark Mode Toggle
  const btnDarkMode = document.getElementById("btnDarkMode");
  btnDarkMode?.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-theme");
    btnDarkMode.classList.toggle("active", isDark);
  });

  // Animations Toggle
  const btnAnim = document.getElementById("btnAnimations");
  btnAnim?.addEventListener("click", () => {
    const isAnim = btnAnim.classList.toggle("active");
    if (!isAnim) {
      document.body.classList.add("disable-animations");
    } else {
      document.body.classList.remove("disable-animations");
    }
  });

  // System Color Selection
  const colorDots = document.querySelectorAll(".cc-color-dot");
  colorDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      // Remove active from all
      colorDots.forEach((d) => d.classList.remove("active"));
      // Add active to clicked
      dot.classList.add("active");

      // Set CSS Variable
      const newColor = dot.dataset.color;
      if (newColor) {
        document.documentElement.style.setProperty("--sys-color", newColor);
      }
    });
  });
}

// ── Virtual Desktop Dragging & Focus ──
window.focusWindow = function (targetEl) {
  document
    .querySelectorAll(".mac-window")
    .forEach((w) => w.classList.remove("is-focused"));

  if (targetEl) {
    const el =
      typeof targetEl === "string"
        ? document.querySelector(targetEl)
        : targetEl;
    if (!el) return;
    el.classList.add("is-focused");

    // Reset all overlays to lower z-index
    document.querySelectorAll(".window-overlay").forEach((over) => {
      over.style.zIndex = "20";
    });

    // Bring current focused to front
    if (
      el.parentElement &&
      el.parentElement.classList.contains("window-overlay")
    ) {
      el.parentElement.style.zIndex = "30";
    }
  }
};

function initDraggableWindows() {
  if (typeof Draggable !== "undefined") {
    const windows = [
      ".finder-window",
      ".about-window",
      ".contacts-window",
    ];
    windows.forEach((sel) => {
      let handle = "";
      if (sel === ".finder-window") {
        handle = ".finder-topbar, .finder-window-controls";
      } else if (sel === ".about-window") {
        handle = ".about-titlebar";
      } else if (sel === ".contacts-window") {
        handle = ".contacts-sidebar-top, .contacts-detail-header";
      } else if (sel === ".preview-window") {
        handle = ".preview-titlebar";
      }

      Draggable.create(sel, {
        type: "x,y",
        handle: handle,
        bounds: "#desktop-workarea",
        onPress: function () {
          window.focusWindow(this.target);
        },
        onDragStart: function() {
          document.body.classList.add('is-dragging');
        },
        onDragEnd: function() {
          document.body.classList.remove('is-dragging');
        }
      });
    });

    // Focus fallback
    document.addEventListener("mousedown", (e) => {
      const win = e.target.closest(".mac-window");
      if (win) {
        window.focusWindow(win);
      } else if (
        e.target.closest(".desktop-wallpaper") ||
        e.target.closest(".desktop-icons-area") ||
        e.target.closest(".desktop-dock")
      ) {
        window.focusWindow(null); // Unfocus everything
      }
    });
  }
}

// ── Responsive fix for Dock ──
// Ensures that when we resize across the 768px breakpoint,
// the GSAP-injected transforms don't break the CSS centering logic.
let lastIsMobile = window.matchMedia("(max-width: 768px)").matches;
window.addEventListener("resize", () => {
  const currentIsMobile = window.matchMedia("(max-width: 768px)").matches;
  if (currentIsMobile !== lastIsMobile) {
    // Clear GSAP transforms to let CSS Media Queries take back control
    gsap.set(".desktop-dock", { clearProps: "transform,x,y,xPercent,yPercent" });
    lastIsMobile = currentIsMobile;
  }
});
