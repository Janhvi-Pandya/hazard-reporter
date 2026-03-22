const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Hazard Reporter Team";
pres.title = "Hazard Reporter: Making UVic Safer Through Student Action";

// ── Color palette (Liquid Glass inspired) ──
const C = {
  bg: "0B1326",
  surface: "131B2E",
  card: "171F33",
  cardHi: "222A3D",
  primary: "ADC6FF",
  primaryDark: "004395",
  accent: "357DF1",
  red: "EB4141",
  text: "DAE2FD",
  textMuted: "909097",
  green: "10B981",
  orange: "F97316",
  amber: "F59E0B",
  white: "FFFFFF",
};

const mkShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.3 });

// ════════════════════════════════════════════
// SLIDE 1 — TITLE
// ════════════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // Subtle radial glow shape
  s.addShape(pres.shapes.OVAL, {
    x: 2.5, y: 0.5, w: 5, h: 5,
    fill: { color: C.accent, transparency: 92 },
  });

  // Top accent bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06,
    fill: { color: C.primary },
  });

  // Icon badge
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.15, y: 1.1, w: 1.7, h: 1.7,
    fill: { color: C.card },
    rectRadius: 0.25,
    shadow: mkShadow(),
  });
  s.addText("⚠", {
    x: 4.15, y: 1.15, w: 1.7, h: 1.6,
    fontSize: 52, align: "center", valign: "middle", color: C.primary, margin: 0,
  });

  // Title
  s.addText("Hazard Reporter", {
    x: 0.5, y: 3.0, w: 9, h: 0.9,
    fontSize: 42, fontFace: "Calibri", bold: true, align: "center",
    color: C.white, margin: 0,
  });

  // Subtitle
  s.addText("Making UVic Safer Through Student Action", {
    x: 1.5, y: 3.85, w: 7, h: 0.55,
    fontSize: 20, fontFace: "Calibri", align: "center",
    color: C.primary, margin: 0,
  });

  // Bottom tagline
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.5, y: 4.7, w: 3, h: 0.04,
    fill: { color: C.accent, transparency: 60 },
  });
  s.addText("UVic Hackathon 2026", {
    x: 2.5, y: 4.9, w: 5, h: 0.4,
    fontSize: 12, fontFace: "Calibri", align: "center",
    color: C.textMuted, charSpacing: 4, margin: 0,
  });
})();

// ════════════════════════════════════════════
// SLIDE 2 — IMPACT POTENTIAL (25 pts)
// ════════════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // Section label
  s.addText("IMPACT POTENTIAL", {
    x: 0.6, y: 0.4, w: 4, h: 0.35,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.primary, charSpacing: 5, margin: 0,
  });
  s.addText("Real Problem. Specific People. Scalable Solution.", {
    x: 0.6, y: 0.75, w: 8, h: 0.45,
    fontSize: 22, fontFace: "Calibri", bold: true,
    color: C.white, margin: 0,
  });

  // Divider
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.3, w: 2, h: 0.03,
    fill: { color: C.accent, transparency: 50 },
  });

  // ── Three cards ──
  const cards = [
    {
      title: "WHO",
      icon: "👥",
      lines: ["UVic students,", "staff & visitors"],
      accent: C.primary,
    },
    {
      title: "PROBLEM",
      icon: "🚨",
      lines: ["Reporting is fragmented", "(forms, calls, supervisors)", "Students don't report", "→ hazards persist"],
      accent: C.red,
    },
    {
      title: "SOLUTION",
      icon: "✅",
      lines: ["One centralized platform", "Fast, student-friendly", "Report in seconds"],
      accent: C.green,
    },
  ];

  cards.forEach((c, i) => {
    const cx = 0.6 + i * 3.1;
    const cw = 2.8;

    // Card bg
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 1.6, w: cw, h: 3.2,
      fill: { color: C.card },
      shadow: mkShadow(),
    });
    // Left accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 1.6, w: 0.06, h: 3.2,
      fill: { color: c.accent },
    });
    // Icon
    s.addText(c.icon, {
      x: cx + 0.25, y: 1.8, w: 0.6, h: 0.55,
      fontSize: 28, margin: 0,
    });
    // Card title
    s.addText(c.title, {
      x: cx + 0.25, y: 2.35, w: cw - 0.5, h: 0.35,
      fontSize: 11, fontFace: "Calibri", bold: true,
      color: c.accent, charSpacing: 4, margin: 0,
    });
    // Card content
    const textRuns = c.lines.map((l, li) => ({
      text: l,
      options: {
        fontSize: 13,
        fontFace: "Calibri",
        color: C.text,
        breakLine: li < c.lines.length - 1,
      },
    }));
    s.addText(textRuns, {
      x: cx + 0.25, y: 2.75, w: cw - 0.5, h: 1.8,
      valign: "top", margin: 0,
    });
  });

  // Impact callout (bottom right)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.8, y: 1.6, w: 3.8, h: 3.2,
    fill: { color: C.surface },
    shadow: mkShadow(),
  });
  s.addText("IMPACT", {
    x: 6.1, y: 1.85, w: 3, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.primary, charSpacing: 4, margin: 0,
  });

  const impactItems = [
    { icon: "⚡", text: "Faster hazard response" },
    { icon: "🛡️", text: "Safer campus for everyone" },
    { icon: "📈", text: "Scalable to other universities" },
    { icon: "👁️", text: "Increased hazard visibility" },
  ];
  impactItems.forEach((item, i) => {
    const iy = 2.3 + i * 0.65;
    s.addText(item.icon, {
      x: 6.1, y: iy, w: 0.5, h: 0.45,
      fontSize: 18, margin: 0,
    });
    s.addText(item.text, {
      x: 6.6, y: iy, w: 2.8, h: 0.45,
      fontSize: 14, fontFace: "Calibri", color: C.text,
      valign: "middle", margin: 0,
    });
  });
})();

// ════════════════════════════════════════════
// SLIDE 3 — TECHNICAL EXECUTION (30 pts)
// ════════════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.bg };

  s.addText("TECHNICAL EXECUTION", {
    x: 0.6, y: 0.4, w: 5, h: 0.35,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.primary, charSpacing: 5, margin: 0,
  });
  s.addText("Working Prototype + Purposeful AI", {
    x: 0.6, y: 0.75, w: 8, h: 0.45,
    fontSize: 22, fontFace: "Calibri", bold: true,
    color: C.white, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.3, w: 2, h: 0.03,
    fill: { color: C.accent, transparency: 50 },
  });

  // Left column: Tech Stack
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.6, w: 4.2, h: 3.5,
    fill: { color: C.card },
    shadow: mkShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.6, w: 0.06, h: 3.5,
    fill: { color: C.accent },
  });
  s.addText("FULL-STACK PROTOTYPE", {
    x: 0.95, y: 1.8, w: 3.5, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.primary, charSpacing: 3, margin: 0,
  });

  const techItems = [
    { label: "Frontend", detail: "React + TypeScript + Tailwind" },
    { label: "Backend", detail: "Express.js + SQLite" },
    { label: "Classification", detail: "Deterministic severity engine" },
    { label: "Tracking", detail: "Real-time status pipeline" },
    { label: "Design", detail: "Liquid Glass dark UI system" },
  ];
  techItems.forEach((t, i) => {
    const ty = 2.25 + i * 0.55;
    s.addShape(pres.shapes.OVAL, {
      x: 0.95, y: ty + 0.12, w: 0.18, h: 0.18,
      fill: { color: C.accent },
    });
    s.addText([
      { text: t.label + "  ", options: { bold: true, color: C.white, fontSize: 13 } },
      { text: t.detail, options: { color: C.textMuted, fontSize: 12 } },
    ], {
      x: 1.25, y: ty, w: 3.3, h: 0.4,
      fontFace: "Calibri", valign: "middle", margin: 0,
    });
  });

  // Right column: Claude Usage
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.6, w: 4.2, h: 3.5,
    fill: { color: C.surface },
    shadow: mkShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.6, w: 0.06, h: 3.5,
    fill: { color: C.orange },
  });
  s.addText("🤖  CLAUDE INTEGRATION", {
    x: 5.55, y: 1.8, w: 3.5, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.orange, charSpacing: 3, margin: 0,
  });

  const claudeItems = [
    { text: "Structures hazard reports for clarity" },
    { text: "Categorizes hazards by type & severity" },
    { text: "Improves submission quality" },
    { text: "Speeds up response workflows" },
  ];
  claudeItems.forEach((c, i) => {
    const cy = 2.3 + i * 0.65;
    s.addShape(pres.shapes.OVAL, {
      x: 5.55, y: cy + 0.1, w: 0.18, h: 0.18,
      fill: { color: C.orange },
    });
    s.addText(c.text, {
      x: 5.85, y: cy, w: 3.3, h: 0.4,
      fontSize: 13, fontFace: "Calibri", color: C.text,
      valign: "middle", margin: 0,
    });
  });

  // Bottom bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 5.2, w: 8.8, h: 0.03,
    fill: { color: C.accent, transparency: 70 },
  });
  s.addText("\"Simple, functional, and actually usable in real scenarios\"", {
    x: 0.6, y: 5.25, w: 8.8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", italic: true, align: "center",
    color: C.textMuted, margin: 0,
  });
})();

// ════════════════════════════════════════════
// SLIDE 4 — ETHICAL ALIGNMENT (25 pts)
// ════════════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.bg };

  s.addText("ETHICAL ALIGNMENT", {
    x: 0.6, y: 0.4, w: 5, h: 0.35,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.primary, charSpacing: 5, margin: 0,
  });
  s.addText("Empowering Students, Not Replacing Them", {
    x: 0.6, y: 0.75, w: 8, h: 0.45,
    fontSize: 22, fontFace: "Calibri", bold: true,
    color: C.white, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.3, w: 2, h: 0.03,
    fill: { color: C.accent, transparency: 50 },
  });

  // Values (left side — 3 cards stacked)
  const values = [
    { icon: "🙋", title: "Lowers Barriers", desc: "Anyone can report a hazard — no forms, no gatekeepers", color: C.green },
    { icon: "🔍", title: "Surfaces Hidden Issues", desc: "Highlights hazards in underserved or overlooked areas", color: C.primary },
    { icon: "🤝", title: "Student-Driven Safety", desc: "Community participation, not top-down enforcement", color: C.accent },
  ];

  values.forEach((v, i) => {
    const vy = 1.6 + i * 1.1;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: vy, w: 5, h: 0.9,
      fill: { color: C.card },
      shadow: mkShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: vy, w: 0.06, h: 0.9,
      fill: { color: v.color },
    });
    s.addText(v.icon, {
      x: 0.85, y: vy + 0.15, w: 0.5, h: 0.5,
      fontSize: 22, margin: 0,
    });
    s.addText(v.title, {
      x: 1.4, y: vy + 0.1, w: 3.8, h: 0.35,
      fontSize: 14, fontFace: "Calibri", bold: true,
      color: C.white, margin: 0,
    });
    s.addText(v.desc, {
      x: 1.4, y: vy + 0.45, w: 3.8, h: 0.35,
      fontSize: 11, fontFace: "Calibri",
      color: C.textMuted, margin: 0,
    });
  });

  // Risks & Safeguards (right side)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6, y: 1.6, w: 3.6, h: 3.5,
    fill: { color: C.surface },
    shadow: mkShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6, y: 1.6, w: 0.06, h: 3.5,
    fill: { color: C.red },
  });
  s.addText("⚖️  RISKS & SAFEGUARDS", {
    x: 6.3, y: 1.8, w: 3, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.red, charSpacing: 3, margin: 0,
  });

  const risks = [
    { risk: "False reports", fix: "Moderation & validation" },
    { risk: "Report misuse", fix: "Accountability systems" },
    { risk: "Privacy concerns", fix: "Minimal data collection" },
  ];
  risks.forEach((r, i) => {
    const ry = 2.3 + i * 0.9;
    s.addText("⚠ " + r.risk, {
      x: 6.3, y: ry, w: 3, h: 0.3,
      fontSize: 12, fontFace: "Calibri", bold: true,
      color: C.amber, margin: 0,
    });
    s.addText("→ " + r.fix, {
      x: 6.3, y: ry + 0.3, w: 3, h: 0.3,
      fontSize: 12, fontFace: "Calibri",
      color: C.green, margin: 0,
    });
  });

  // Bottom summary
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 5.15, w: 8.8, h: 0.03,
    fill: { color: C.accent, transparency: 70 },
  });
  s.addText("\"Expand access while maintaining trust and accountability\"", {
    x: 0.6, y: 5.2, w: 8.8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", italic: true, align: "center",
    color: C.textMuted, margin: 0,
  });
})();

// ════════════════════════════════════════════
// SLIDE 5 — WHAT'S NEXT + CLOSING (20 pts)
// ════════════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.bg };

  s.addText("WHAT WE BUILT & WHAT'S NEXT", {
    x: 0.6, y: 0.4, w: 6, h: 0.35,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.primary, charSpacing: 5, margin: 0,
  });
  s.addText("From Prototype to Platform", {
    x: 0.6, y: 0.75, w: 8, h: 0.45,
    fontSize: 22, fontFace: "Calibri", bold: true,
    color: C.white, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.3, w: 2, h: 0.03,
    fill: { color: C.accent, transparency: 50 },
  });

  // Left: What we built
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.6, w: 4.2, h: 3.2,
    fill: { color: C.card },
    shadow: mkShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.6, w: 0.06, h: 3.2,
    fill: { color: C.green },
  });
  s.addText("✅  WHAT WE BUILT", {
    x: 0.95, y: 1.8, w: 3.5, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.green, charSpacing: 3, margin: 0,
  });

  const built = [
    "Centralized hazard reporting platform",
    "Auto-classification by severity & team",
    "Real-time tracking pipeline (6 stages)",
    "Admin dashboard with full oversight",
    "Polished Liquid Glass dark UI",
  ];
  built.forEach((b, i) => {
    s.addText([
      { text: "→  ", options: { color: C.green, bold: true } },
      { text: b, options: { color: C.text } },
    ], {
      x: 0.95, y: 2.25 + i * 0.5, w: 3.6, h: 0.4,
      fontSize: 12, fontFace: "Calibri", valign: "middle", margin: 0,
    });
  });

  // Right: What's next
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.6, w: 4.2, h: 3.2,
    fill: { color: C.surface },
    shadow: mkShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.6, w: 0.06, h: 3.2,
    fill: { color: C.primary },
  });
  s.addText("🚀  WHAT'S NEXT", {
    x: 5.55, y: 1.8, w: 3.5, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: C.primary, charSpacing: 3, margin: 0,
  });

  const next = [
    { text: "Image uploads for evidence", icon: "📸" },
    { text: "Notifications to UVic services", icon: "🔔" },
    { text: "AI-powered classification", icon: "🤖" },
    { text: "Scale to other universities", icon: "🌐" },
  ];
  next.forEach((n, i) => {
    s.addText(n.icon + "  " + n.text, {
      x: 5.55, y: 2.25 + i * 0.6, w: 3.6, h: 0.4,
      fontSize: 13, fontFace: "Calibri", color: C.text,
      valign: "middle", margin: 0,
    });
  });

  // Bottom CTA
  s.addShape(pres.shapes.RECTANGLE, {
    x: 2.5, y: 5.0, w: 5, h: 0.5,
    fill: { color: C.accent, transparency: 85 },
  });
  s.addText("Hazard Reporter — turning an underused system into something students will actually use", {
    x: 1, y: 5.0, w: 8, h: 0.5,
    fontSize: 13, fontFace: "Calibri", bold: true, align: "center",
    color: C.primary, valign: "middle", margin: 0,
  });
})();

// ════════════════════════════════════════════
// SLIDE 6 — DEMO
// ════════════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // Large centered glow
  s.addShape(pres.shapes.OVAL, {
    x: 2, y: 0.5, w: 6, h: 5,
    fill: { color: C.accent, transparency: 93 },
  });

  // Top accent bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06,
    fill: { color: C.primary },
  });

  s.addText("LIVE DEMO", {
    x: 1, y: 1.2, w: 8, h: 0.5,
    fontSize: 12, fontFace: "Calibri", bold: true, align: "center",
    color: C.primary, charSpacing: 8, margin: 0,
  });

  s.addText("🖥️", {
    x: 4, y: 1.7, w: 2, h: 1.2,
    fontSize: 64, align: "center", margin: 0,
  });

  s.addText("See It In Action", {
    x: 1, y: 3.0, w: 8, h: 0.7,
    fontSize: 32, fontFace: "Calibri", bold: true, align: "center",
    color: C.white, margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.5, y: 3.85, w: 3, h: 0.03,
    fill: { color: C.accent, transparency: 50 },
  });

  s.addText([
    { text: "Submit a hazard → Auto-classify → Track resolution", options: { color: C.text, fontSize: 15 } },
  ], {
    x: 1.5, y: 4.1, w: 7, h: 0.5,
    fontFace: "Calibri", align: "center", margin: 0,
  });

  s.addText("\"You just submit a hazard with details and location, and it gets recorded instantly.\"", {
    x: 1.5, y: 4.8, w: 7, h: 0.4,
    fontSize: 11, fontFace: "Calibri", italic: true, align: "center",
    color: C.textMuted, margin: 0,
  });
})();

// ── Generate ──
pres.writeFile({ fileName: "C:\\Users\\Chira\\hazard-reporter\\Hazard-Reporter-Presentation.pptx" })
  .then(() => console.log("✅ Presentation saved: Hazard-Reporter-Presentation.pptx"))
  .catch((err) => console.error("Error:", err));
