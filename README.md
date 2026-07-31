# Opportunity FLOPs

A small policy calculator for exploring how reallocating capability-oriented AI
R&D compute to alignment changes modeled software progress and frontier capability.

## Local development

```sh
npm run dev
```

The site has no runtime dependencies. Katherine's reduced-form model lives in
`public/model.js` and exposes a single `runModel(assumptions)` function. Its
assumption definitions drive the controls, and its output series drive both charts.

The equations and full parameter contract are implemented. Katherine's table
defines parameter roles and statuses but does not supply numerical Low, Medium,
and High calibrations, so the current preset values are visibly labeled as working
placeholders. The baseline is normalized to make policy divergence inspectable and
should not be read as an absolute forecast.

Run the model and interaction contracts with:

```sh
npm test
```

## Deployment

The project is designed as a static Vercel deployment. The intended public URL
is `flops.keatonlee.org`.
