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

The equations and full parameter contract are implemented. The policy-impact
control uses a deterministic assumed-prior Monte Carlo calibration: 10,000
independent draws from working triangular distributions for `beta`, `gamma`, and
`delta`, with seed `20260731`. Low, Medium, and High select the marginal P10, P50,
and P90 parameter bundles. The distribution inputs are modeling assumptions, not
Katherine-supplied empirical estimates, and the bundles are not joint outcome
percentiles. The baseline is normalized to make policy divergence inspectable and
should not be read as an absolute forecast.

Run the model and interaction contracts with:

```sh
npm test
```

## Deployment

The project is designed as a static Vercel deployment. The intended public URL
is `flops.keatonlee.org`.
