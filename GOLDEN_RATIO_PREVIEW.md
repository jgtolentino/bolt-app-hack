# Golden Ratio Implementation Preview

The Scout Analytics Dashboard now features a harmonious design system based on the golden ratio (φ ≈ 1.618).

## 🎨 Golden Ratio Typography Scale

```
text-xxl-phi: 67.78px  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
text-xl-phi:  41.89px  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  (Main headings)
text-lg-phi:  25.89px  ━━━━━━━━━━━━━━━━━━━━━━  (Section titles)
base:         16.00px  ━━━━━━━━━━━━  (Body text)
text-sm-phi:  12.58px  ━━━━━━━━━  (Subtitles, labels)
text-xs-phi:   9.89px  ━━━━━━  (Timestamps, metadata)
```

## 📐 Golden Ratio Spacing Scale

```
phi-xl: 67.78px  ┃                                                           ┃
phi-lg: 41.89px  ┃                                    ┃  (Page sections)
phi-md: 25.89px  ┃                    ┃  (Card padding, major gaps)
phi:    16.00px  ┃           ┃  (Component spacing)
phi-sm:  9.89px  ┃     ┃  (Small gaps)
phi-xs:  6.11px  ┃  ┃  (Micro spacing)
```

## 🖼️ Layout Structure

### Command Center (OptimizedDashboard)
```
┌─────────────────────────────────────────────────────────────┐
│  Command Center                                              │
│  Real-time insights and performance metrics                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────── 5 cols ──────────┬──────── 7 cols ──────────┐ │
│  │                             │                           │ │
│  │  📊 Total Sales            │    Sales Trend (24 hr)    │ │
│  │  ₱2,235,878 ▲ 15.8%        │                           │ │
│  │                             │         [Chart]           │ │
│  │  📋 Transactions            │                           │ │
│  │  8,234 ▲ 12.5%              │                           │ │
│  │                             │                           │ │
│  │  🛒 Avg Basket Size         │                           │ │
│  │  ₱272 ▲ 2.3%                │                           │ │
│  │                             │                           │ │
│  │  📈 Conversion Rate         │                           │ │
│  │  68.5% ▲ 2.1%                │                           │ │
│  └─────────────────────────────┴───────────────────────────┘ │
│                                                              │
│  Golden Ratio: 5:7 split (5/12 ≈ 0.417, 7/12 ≈ 0.583)       │
│  Actual Ratio: 0.417 : 0.583 ≈ 1 : 1.4 (close to φ)         │
└──────────────────────────────────────────────────────────────┘
```

### Visual Hierarchy with Golden Ratio

```
┌─────────────────────────────────────────────────────────────┐
│  text-xl-phi (41.89px) - Page Title                         │
│  text-sm-phi (12.58px) - Page Subtitle                      │
│                                                              │
│  ┌─── KPI Card ───┐  ┌─── KPI Card ───┐  ┌─── KPI Card ───┐ │
│  │   p-phi-md     │  │   p-phi-md     │  │   p-phi-md     │ │
│  │   (25.89px)    │  │   (25.89px)    │  │   (25.89px)    │ │
│  │                │  │                │  │                │ │
│  │  Icon + Label  │  │  Icon + Label  │  │  Icon + Label  │ │
│  │  text-sm-phi   │  │  text-sm-phi   │  │  text-sm-phi   │ │
│  │                │  │                │  │                │ │
│  │  ₱1,234,567    │  │  5,432         │  │  87.6%         │ │
│  │  text-2xl      │  │  text-2xl      │  │  text-2xl      │ │
│  │                │  │                │  │                │ │
│  │  ▲ 12.5%       │  │  ▲ 8.3%        │  │  ▼ 2.1%        │ │
│  │  text-xs       │  │  text-xs       │  │  text-xs       │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                              │
│         gap-phi (16px)        gap-phi (16px)                │
│                                                              │
│  ┌──────────────── Chart Panel ─────────────────────────────┐ │
│  │  p-phi-lg (41.89px)                                      │ │
│  │                                                          │ │
│  │  Title (text-lg-phi)                                     │ │
│  │  Subtitle (text-sm-phi)                                  │ │
│  │                                                          │ │
│  │  [Chart Content Area]                                    │ │
│  │                                                          │ │
│  │  Last updated: 10:45 AM PHT (text-xs-phi)               │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🌟 Key Features

1. **Typography Hierarchy**
   - Page titles: `text-xl-phi` (41.89px)
   - Section headings: `text-lg-phi` (25.89px)
   - Body text: `base` (16px)
   - Labels & subtitles: `text-sm-phi` (12.58px)
   - Timestamps: `text-xs-phi` (9.89px)

2. **Spacing Rhythm**
   - Major sections: `gap-phi-lg` (41.89px)
   - Component gaps: `gap-phi-md` (25.89px)
   - Internal spacing: `gap-phi` (16px)
   - Tight spacing: `gap-phi-sm` (9.89px)

3. **Golden Ratio Layouts**
   - Hero section: 5:7 column split
   - Secondary sections: 8:4 column split
   - Map + regions: 7:5 column split (inverse golden ratio)

4. **Component Padding**
   - Large containers: `p-phi-lg` (41.89px)
   - Cards & widgets: `p-phi-md` (25.89px)
   - Compact elements: `p-phi` (16px)

## 🚀 Live Preview

The dashboard is now running at **http://localhost:5173/**

Navigate to see:
- **Command Center** (/) - Main dashboard with golden ratio layout
- **Geographic Analytics** - Regional performance with harmonious spacing
- **Transaction Analysis** - Time patterns with golden ratio typography

All components now follow the golden ratio for a visually balanced, harmonious design that's both beautiful and functional.