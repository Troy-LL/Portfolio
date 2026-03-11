# Visual Standards & Aesthetics

This document defines the specific design tokens and animation patterns for the TLPortfolio.

## 🎨 Color Palette

### System Accents
| Purpose | Color (Hex) | CSS Variable |
| :--- | :--- | :--- |
| Primary Blue | `#007aff` | `--sys-color` |
| Success Green | `#10b981` | N/A |
| Warning Amber | `#f59e0b` | N/A |
| Danger Red | `#ef4444` | N/A |

### UI Backgrounds (Dark Mode)
- **Menubar**: `rgba(255, 255, 255, 0.12)` with `backdrop-filter: blur(32px) saturate(2)`
- **Dock**: `rgba(255, 255, 255, 0.12)` with `blur(32px)`
- **Windows**: `rgba(15, 15, 15, 0.96)` or `rgba(30, 30, 30, 0.35)` depending on depth.

## 🏃 Motion & Animations (GSAP)

### Window Entrance
```javascript
gsap.fromTo(windowElement, 
  { opacity: 0, scale: 0.9, y: 20 },
  { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.3)" }
);
```

### Window Exit
```javascript
gsap.to(windowElement, {
  opacity: 0,
  scale: 0.9,
  y: 18,
  duration: 0.25,
  ease: "power2.in"
});
```

### Dock Magnification
The dock uses a spring-like cubic bezier for the hover effect:
- **Transition**: `transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Scale**: `1.35` (Active), `1.15` (Adjacent)

## 🔠 Typography
- **Interface**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`
- **Terminal**: `"VT323", monospace` (Google Fonts)

## 🖼️ Iconography
- Icons should be high-resolution (256x256 or 512x512) and centered.
- Use `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))` for dock icons.
- Folders use `assets/img/folder.png`.

## 📺 CRT Effects
- **Scanlines**: Repetitive linear-gradient pattern on `.scanlines`.
- **Flicker**: Opacity keyframes on `.flicker-layer` (very subtle, <0.05 opacity variance).
- **Vignette**: Radial gradient on `.screen-vignette` to simulate glass curvature.
