import express from "express";
import path from "path";
import dotenv from "dotenv";
import http from "http";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import {
  buildOrchestrationPrompt,
  createSimulationResult,
  validateIncidentResult,
  validateOrchestrationPayload
} from "./src/lib";
import { HTTP_BODY_LIMIT, RATE_LIMIT } from "./src/lib/config";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: HTTP_BODY_LIMIT }));

interface SecurityHeadersOptions {
  isProduction: boolean;
}

function buildCspHeaders({ isProduction }: SecurityHeadersOptions): Record<string, string> {
  const scriptSrc = isProduction ? "'self'" : "'self' 'unsafe-inline' 'unsafe-eval'";
  const styleSrc = isProduction ? "'self'" : "'self' 'unsafe-inline'";
  const connectSrc = isProduction
    ? "'self'"
    : "'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*";

  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "credentialless",
    "Content-Security-Policy": [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      `script-src ${scriptSrc}`,
      `style-src ${styleSrc}`,
      "img-src 'self' data: https://ai.google.dev https://ai.studio",
      "media-src 'self'",
      `connect-src ${connectSrc}`,
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join("; ")
  };
}

const securityHeaders = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  const isProduction = process.env.NODE_ENV === "production";
  for (const [header, value] of Object.entries(buildCspHeaders({ isProduction }))) {
    res.setHeader(header, value);
  }
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
};

app.use(securityHeaders);

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({
      error: "Invalid JSON payload.",
      details: "Request body must be valid JSON."
    });
  }
  next(err);
});

interface RateBucket {
  count: number;
  resetTime: number;
}

const ipRequestCounts = new Map<string, RateBucket>();

function getClientIp(req: express.Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim();
  }
  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip ?? "unknown";
}

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucket = ipRequestCounts.get(ip);

  if (!bucket || now > bucket.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT.WINDOW_MS });
    return next();
  }

  if (bucket.count >= RATE_LIMIT.MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetTime - now) / 1000)));
    return res.status(429).json({
      error: "Too many requests. Please slow down.",
      details: `Rate limit exceeded. Maximum ${RATE_LIMIT.MAX_REQUESTS} requests per minute.`
    });
  }

  bucket.count += 1;
  next();
};

/** Periodically sweep stale IP buckets so the Map cannot grow unboundedly. */
const sweepInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of ipRequestCounts) {
    if (now > bucket.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
}, RATE_LIMIT.SWEEP_INTERVAL_MS);
sweepInterval.unref();

function shutdown(server: http.Server) {
  clearInterval(sweepInterval);
  server.close(() => {
    process.exitCode = 0;
  });
}

process.on("SIGTERM", () => {
  if (listeningServer) shutdown(listeningServer);
});
process.on("SIGINT", () => {
  if (listeningServer) shutdown(listeningServer);
});

let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "vanguard-core" } }
    });
    console.log("Vanguard-Core: Gemini SDK initialized successfully.");
  } else {
    console.warn("Vanguard-Core WARNING: GEMINI_API_KEY is not defined. Offline fallback mode will be active.");
  }
} catch (error: unknown) {
  console.error("Vanguard-Core: Failed to initialize Gemini client:", error instanceof Error ? error.message : error);
}

const validateOrchestrateInput = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const validation = validateOrchestrationPayload(req.body);

  if (!validation.ok || !validation.value) {
    return res.status(validation.status ?? 400).json({
      error: validation.error,
      details: validation.details
    });
  }

  req.body = validation.value;
  next();
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    incident_id: {
      type: Type.STRING,
      description: "Stadium operational ID following STAD-2026-XXXX format where XXXX is 4 random capital letters or digits."
    },
    severity_assessment: {
      type: Type.OBJECT,
      properties: {
        priority_level: {
          type: Type.INTEGER,
          description: "1-4 scale. Must be 1 for critical emergencies such as medical, crush, fire, or structural failure."
        },
        urgency: {
          type: Type.STRING,
          description: "Must be Immediate, Elevated, or Routine."
        },
        impact_radius: {
          type: Type.STRING,
          description: "Must be Localized Sector, Zone Wide, or Stadium Wide."
        }
      },
      required: ["priority_level", "urgency", "impact_radius"]
    },
    tactical_action_plan: {
      type: Type.OBJECT,
      properties: {
        immediate_directives: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A chronological list of immediate, concrete steps for responders."
        },
        staff_dispatch_assignment: {
          type: Type.STRING,
          description: "Specific deployment assignment details for ground volunteers, medics, and security."
        },
        crowd_flow_instruction: {
          type: Type.STRING,
          description: "Exact instructions for re-routing gates, corridors, or concourses safely."
        }
      },
      required: ["immediate_directives", "staff_dispatch_assignment", "crowd_flow_instruction"]
    },
    automated_broadcasts: {
      type: Type.OBJECT,
      properties: {
        english: {
          type: Type.STRING,
          description: "Clear, audible stadium public address message in English."
        },
        spanish: {
          type: Type.STRING,
          description: "Clear translation in Spanish."
        },
        localized_team_language: {
          type: Type.STRING,
          description: "Clear translation in the playing team's native language or another matching language."
        }
      },
      required: ["english", "spanish", "localized_team_language"]
    },
    operational_justification: {
      type: Type.STRING,
      description: "A rigorous, brief, logical explanation of the route and plan choice based on stadium crowd physics and protocols."
    }
  },
  required: [
    "incident_id",
    "severity_assessment",
    "tactical_action_plan",
    "automated_broadcasts",
    "operational_justification"
  ]
};

app.post("/api/orchestrate", rateLimiter, validateOrchestrateInput, async (req, res) => {
  const input = req.body;

  if (!ai) {
    console.log("Vanguard-Core: Running in offline simulation mode.");
    return res.json({ status: "simulation", data: createSimulationResult(input) });
  }

  try {
    const prompt = buildOrchestrationPrompt(input);
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty text returned from Gemini API.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(resultText.trim());
    } catch {
      throw new Error("Gemini response was not valid JSON.");
    }

    const incident = validateIncidentResult(parsed);
    if (!incident) {
      throw new Error("Gemini response failed schema validation.");
    }

    return res.json({ status: "success", data: incident });
  } catch (error: unknown) {
    console.error("Vanguard-Core: Error during orchestration generation:", error);
    return res.status(500).json({
      error: "Command and Control orchestration failed.",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: ai ? "genai" : "simulation", timestamp: new Date().toISOString() });
});

let listeningServer: http.Server | null = null;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Vanguard-Core: Starting dev server with Vite integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Vanguard-Core: Starting production server...");
    const docsPath = path.join(process.cwd(), "docs");
    app.use(
      express.static(docsPath, {
        maxAge: "1h",
        index: false
      })
    );
    app.get("*", (_req, res) => {
      res.sendFile(path.join(docsPath, "index.html"));
    });
  }

  listeningServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vanguard-Core server is running at http://localhost:${PORT}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Vanguard-Core: Server failed to start:", error);
  process.exitCode = 1;
});
