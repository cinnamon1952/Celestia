# Celestia - Interactive Star Chart

A beautiful, accurate, real-time interactive star map built with Next.js, Three.js, and astronomy-engine.

## Features

- **5,000+ Stars** - Fetched from HYG database (Hipparcos, Yale, Gliese)
- **All Planets** - Including Pluto and 25+ major moons
- **88 Constellations** - IAU constellations with lines and labels
- **Deep Sky Objects** - Messier catalog + extended galaxies, nebulae, and clusters from SIMBAD
- **Meteor Showers** - 11 major annual meteor showers with active status
- **Asteroids** - Near-Earth asteroids from NASA API
- **Real-time Calculations** - Accurate Alt/Az positions based on your location and time
- **Search** - Find any star, planet, moon, constellation, or deep sky object
- **Time Controls** - Speed up time, reset to now
- **Location** - Auto-detect or manual entry

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Three.js** + **@react-three/fiber** + **@react-three/drei**
- **astronomy-engine** - Accurate astronomical calculations
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and deploy

**That's it!** Vercel handles everything automatically.

### Deploy to Other Platforms

#### Netlify
1. Connect your GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `.next`

#### Self-hosted
```bash
npm run build
npm start
```

## Environment Variables

No environment variables required! All APIs used are public and don't require keys.

## Data Sources

- **Stars**: HYG Database via jsDelivr CDN
- **Asteroids**: NASA NEO API (uses DEMO_KEY)
- **Deep Sky Objects**: SIMBAD astronomical database
- **Planets/Moons**: astronomy-engine library (VSOP87/ELP theories)

## License

MIT
