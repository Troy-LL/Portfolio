// ── Window controls (close / minimize / maximize) ──
function initWindowControls() {
  const closeBtn = document.querySelector(".control.close");
  const minBtn = document.querySelector(".control.minimize");
  const maxBtn = document.querySelector(".control.maximize");
  const monitor = document.querySelector(".monitor-bezel");
  const desktop = document.getElementById("desktop");

  // CLOSE — keep existing shutdown behavior
  closeBtn?.addEventListener("click", () => {
    const terminal = document.getElementById("terminal");
    terminal.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
    terminal.style.transform = "scale(0.8) translateY(20px)";
    terminal.style.opacity = "0";
    terminal.style.filter = "blur(10px)";

    setTimeout(() => {
      terminal.innerHTML =
        '<div class="shutdown-msg" style="color:red; font-size: 2rem; text-align:center; padding-top: 20vh;">SYSTEM HALTED</div>';
      terminal.style.opacity = "1";
      terminal.style.transform = "none";
      terminal.style.filter = "none";
    }, 600);
  });

  // MINIMIZE → macOS desktop
  minBtn?.addEventListener("click", () => {
    if (!monitor || !desktop) return;
    const isMinimized = monitor.classList.contains("is-minimized");
    if (!isMinimized) {
      minimizeToDesktop(monitor, desktop);
    } else {
      restoreFromDesktop(monitor, desktop);
    }
  });

  // MAXIMIZE — stretch monitor to viewport (no browser fullscreen)
  maxBtn?.addEventListener("click", () => {
    if (!monitor) return;
    const isMax = monitor.classList.toggle("is-maximized");
    document.body.style.overflow = isMax ? "hidden" : "auto";
  });
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

  gsap.fromTo(
    ".desktop-dock",
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.4)", delay: 0.3 },
  );
}

// Restore: desktop out → terminal in
function restoreFromDesktop(monitor, desktop, command = null) {
  gsap.to(".desktop-dock", {
    opacity: 0,
    y: 20,
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
        cmdInput.focus();
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
      const app = icon.dataset.app || null;
      const command = icon.dataset.command || null;
      const folder = icon.dataset.folder || null;

      // About app: open overlay on the desktop instead of restoring terminal
      if (app === "about") {
        if (!aboutOverlay) return;
        aboutOverlay.classList.add("is-visible");
        gsap.fromTo(
          ".about-window",
          { opacity: 0, scale: 0.9, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.3)" },
        );
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
    // Single click: select
    icon.addEventListener("click", () => {
      document
        .querySelectorAll(".desktop-file-icon")
        .forEach((i) => i.classList.remove("selected"));
      icon.classList.add("selected");
    });

    // Double click: open
    icon.addEventListener("dblclick", () => {
      const command = icon.dataset.command || null;
      const folder = icon.dataset.folder || null;
      if (folder && typeof window.openFinder === "function") {
        window.openFinder(folder);
      } else if (command !== null) {
        restoreFromDesktop(monitor, desktop, command);
      }
    });
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

  maxDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    windowEl.classList.toggle("is-maximized");
  });

  // Click outside window closes as well
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
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

  maxDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    windowEl.classList.toggle("is-maximized");
  });

  overlay.addEventListener("click", (e) => {
    if (
      e.target === overlay ||
      e.target.classList.contains("finder-window-controls")
    )
      close();
  });

  // Sidebar navigation
  const sidebarItems = overlay.querySelectorAll(".finder-sidebar ul li");
  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;
      if (target) window.openFinder(target);
    });
  });
}

window.openFinder = function (folderName) {
  const overlay = document.getElementById("finderOverlay");
  if (!overlay) return;

  // Update title and path
  const titleEl = document.getElementById("finderTitle");
  const statusEl = document.getElementById("finderStatusText");
  if (titleEl) titleEl.textContent = folderName;
  if (statusEl) statusEl.textContent = `guest > Desktop > ${folderName}`;

  // Update active sidebar item
  const sidebarItems = overlay.querySelectorAll(".finder-sidebar ul li");
  sidebarItems.forEach((item) => {
    if (item.dataset.target === folderName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Generate dummy content based on folder to show it works
  const contentEl = document.getElementById("finderContent");
  if (contentEl) {
    contentEl.innerHTML = "";
    const itemsCount = Math.floor(Math.random() * 4) + 3; // 3 to 6 items
    for (let i = 0; i < itemsCount; i++) {
      const fakeIconType = Math.random() > 0.4 ? "file" : "folder";
      const iconImg = fakeIconType === "folder" ? "folder.png" : "contact.png"; // Using existing images

      const el = document.createElement("div");
      el.className = "finder-icon";
      el.innerHTML = `
                <img src="assets/img/${iconImg}" alt="icon">
                <div class="finder-icon-label">${folderName} Item ${i + 1}</div>
            `;
      contentEl.appendChild(el);
    }
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
