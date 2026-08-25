import express from "express";
import client from "prom-client";

const app = express();
const port = process.env.PORT || 3000;
const startedAt = new Date().toISOString();

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "gitops_demo_"
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "gitops_demo_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds.",
  labelNames: ["method", "route", "status_code"],
  registers: [register]
});

app.disable("x-powered-by");

app.use((request, response, next) => {
  const stopTimer = httpRequestDurationSeconds.startTimer();

  response.on("finish", () => {
    stopTimer({
      method: request.method,
      route: request.route?.path || request.path,
      status_code: response.statusCode
    });
  });

  next();
});

app.get("/", (_request, response) => {
  response.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>GitOps Observability Demo</title>
      </head>
      <body>
        <main>
          <p>🚀 GitOps deployment is active</p>
          <h1>DevOps EKS GitOps Observability</h1>
          <p>This Node.js service is designed for deployment to Amazon EKS through Argo CD.</p>
          <p>Health check: <code>/health</code></p>
          <p>Readiness check: <code>/ready</code></p>
          <p>Prometheus metrics: <code>/metrics</code></p>
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

app.get("/metrics", async (_request, response) => {
  response.set("Content-Type", register.contentType);
  response.end(await register.metrics());
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
