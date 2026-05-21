# Content Calendar PRO

Premium social content planner built with Next.js 14 App Router, TypeScript, Tailwind CSS and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy

The project is ready for Vercel. Import the repository, keep the default Next.js settings and deploy.

## Notes

- No OpenAI API or AI keys are used.
- Generation is handled by internal strategy libraries and deterministic weighted rotation.
- Session memory blacklists recently used CTA, formats, angles, hooks and strategies during regeneration.
- PDF export uses the browser print pipeline with print-friendly styles.
- The generated plan is an operational planning base, not a guarantee of growth, sales, virality, or specific business results.
- Run `npm run qa:engine` to stress-test the internal planner engine across multiple scenarios and regeneration flows.
