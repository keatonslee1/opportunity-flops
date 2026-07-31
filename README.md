# Opportunity FLOPs

A small, model-driven policy calculator for exploring the economic opportunity
cost of reallocating frontier AI compute from capabilities R&D to alignment.

## Local development

```sh
npm run dev
```

The site has no runtime dependencies. The economic model lives in `public/model.js` and
exposes a single `runModel(assumptions)` function. Its assumption definitions
drive the slider interface, allowing the model and UI to evolve independently.

## Deployment

The project is designed as a static Vercel deployment. The intended public URL
is `flops.keatonlee.org`.
