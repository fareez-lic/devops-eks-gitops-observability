import express from "express";

const app = express();
const port = process.env.PORT || 3000;
const startedAt = new Date().toISOString();

app.get("/", (_request, response) => {
  response.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>GitOps Observability Demo</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            color: #e2e8f0;
            background: #0f172a;
            font-family: system-ui, sans-serif;
          }
          main {
            width: min(680px, 90vw);
            padding: 3rem;
            border: 1px solid #334155;
            border-radius: 1rem;
            background: #172033;
          }
          h1 { color: #38bdf8; }
          code {
            padding: .2rem .4rem;
            border-radius: .25rem;
            background: #0f172a;
          }
        </style>
      </head>
      <body>
        <main>
          <p>🚀 GitOps deployment is active</p>
          <h1>DevOps EKS GitOps Observability</h1>
          <p>This Node.js service is designed for deployment to Amazon EKS through Argo CD.</p>
          <p>Health check: <code>/health</code></p>
          <p>Readiness check: <code>/ready</code></p>
        </main>
      </body>
    </html>
  `);
});

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "healthy",
    service: "gitops-observability-demo",
    startedAt
  });
});

app.get("/ready", (_request, response) => {
  response.status(200).json({ status: "ready" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
