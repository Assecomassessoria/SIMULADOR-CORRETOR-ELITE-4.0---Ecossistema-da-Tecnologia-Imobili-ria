import express from "express";
import path from "path";
import proxy from "express-http-proxy";
import { createServer as createViteServer } from "vite";

const SUPABASE_TARGET = "https://hoagdvthplzbmqrvuesi.supabase.co";
const SPOOFED_ORIGIN = "https://simuladorcorretorelite.com.br";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Supabase API proxies
  // These proxy requests server-side, completely bypassing any browser CORS policies 
  // and spoofing the Origin header to match the registered domain allowed by Supabase edge functions.
  const proxyConfig = {
    proxyReqOptDecorator: (proxyReqOpts: any) => {
      if (!proxyReqOpts.headers) proxyReqOpts.headers = {};
      proxyReqOpts.headers["Origin"] = SPOOFED_ORIGIN;
      proxyReqOpts.headers["origin"] = SPOOFED_ORIGIN;
      return proxyReqOpts;
    },
    userResHeaderDecorator: (headers: any, userReq: any) => {
      const origin = userReq.headers.origin || userReq.headers.Origin;
      if (origin) {
        headers["access-control-allow-origin"] = origin;
        headers["Access-Control-Allow-Origin"] = origin;
      }
      return headers;
    },
  };

  app.use(
    "/functions/v1",
    proxy(SUPABASE_TARGET, {
      ...proxyConfig,
      proxyReqPathResolver: (req) => {
        return "/functions/v1" + req.url;
      },
    })
  );

  app.use(
    "/rest/v1",
    proxy(SUPABASE_TARGET, {
      ...proxyConfig,
      proxyReqPathResolver: (req) => {
        return "/rest/v1" + req.url;
      },
    })
  );

  app.use(
    "/auth/v1",
    proxy(SUPABASE_TARGET, {
      ...proxyConfig,
      proxyReqPathResolver: (req) => {
        return "/auth/v1" + req.url;
      },
    })
  );

  app.use(
    "/storage/v1",
    proxy(SUPABASE_TARGET, {
      ...proxyConfig,
      proxyReqPathResolver: (req) => {
        return "/storage/v1" + req.url;
      },
    })
  );

  // 2. Client files & asset pipeline (Vite middleware in DEV, Static in PROD)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
