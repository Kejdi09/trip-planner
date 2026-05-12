const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { version: backendVersion } = require("../package.json");
const aiRoutes = require("./routes/ai.routes");
const votingRoutes = require("./routes/voting.routes");
const groupsRoutes = require("./routes/groups.routes");
const reviewsRoutes = require("./routes/reviews.routes");
const notificationsRoutes = require("./routes/notifications.routes");
require("dotenv").config();

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"];
required.forEach((key) => {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
});

const app = express();
app.use(cors());
app.use(express.json());

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROD_ALIASES = new Set(["prod", "production", "main"]);

function normalizeAppEnv(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  return PROD_ALIASES.has(raw) ? "production" : "development";
}

const backendAppEnv = normalizeAppEnv(
  process.env.APP_ENV || process.env.NODE_ENV || "development",
);

const ENGINEERING_CODE = process.env.ENGINEERING_CODE || "1092";
const engineeringItems = new Map();

function verifyEngineeringCode(req, res, next) {
  const code = req.headers["x-engineering-code"];
  if (code !== ENGINEERING_CODE) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

function ensureClientEnvMatches(req, res, next) {
  const headerValue = req.headers["x-app-env"];
  if (!headerValue) {
    return next();
  }

  const clientAppEnv = normalizeAppEnv(headerValue);
  if (clientAppEnv !== backendAppEnv) {
    return res.status(409).json({
      error: `Environment mismatch: client=${clientAppEnv}, backend=${backendAppEnv}`,
    });
  }

  return next();
}

function parseBoolean(value) {
  if (value === undefined || value === null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    env: process.env.APP_ENV || process.env.NODE_ENV || "development",
  }),
);

app.get("/engineering/checks", (req, res) => {
  return res.json({
    status: "ok",
    backendVersion,
    environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
    commitSha:
      process.env.RENDER_GIT_COMMIT ||
      process.env.COMMIT_SHA ||
      process.env.GIT_SHA ||
      null,
    branch: process.env.RENDER_GIT_BRANCH || process.env.GIT_BRANCH || null,
    engineeringModeEnabled: true,
    timestamp: new Date().toISOString(),
  });
});

app.post("/engineering/test-item", verifyEngineeringCode, (req, res) => {
  const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const item = {
    id,
    value: req.body?.value ?? "engineering-smoke-test",
    createdAt: new Date().toISOString(),
  };
  engineeringItems.set(id, item);
  return res.status(201).json(item);
});

app.get("/engineering/test-item/:id", verifyEngineeringCode, (req, res) => {
  const item = engineeringItems.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json(item);
});

app.delete("/engineering/test-item/:id", verifyEngineeringCode, (req, res) => {
  const existed = engineeringItems.delete(req.params.id);
  if (!existed) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.status(204).send();
});

app.get(
  "/auth/username-available",
  ensureClientEnvMatches,
  async (req, res, next) => {
    try {
      const username = String(req.query.username || "")
        .trim()
        .toLowerCase();

      if (!USERNAME_REGEX.test(username)) {
        return res.status(400).json({
          error:
            "Username must be 3-24 characters and use lowercase letters, numbers, or underscores.",
        });
      }

      const perPage = 200;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

        if (error) {
          const wrappedError = new Error(
            error.message || "Failed to query users",
          );
          wrappedError.status = 502;
          throw wrappedError;
        }

        const users = data?.users || [];
        const match = users.find(
          (user) =>
            String(user.user_metadata?.username || "")
              .trim()
              .toLowerCase() === username,
        );

        if (match) return res.json({ available: false });

        hasMore = users.length === perPage;
        page += 1;
      }

      return res.json({ available: true });
    } catch (error) {
      return next(error);
    }
  },
);

app.get(
  "/auth/email-available",
  ensureClientEnvMatches,
  async (req, res, next) => {
    try {
      const email = String(req.query.email || "")
        .trim()
        .toLowerCase();

      if (!EMAIL_REGEX.test(email)) {
        return res
          .status(400)
          .json({ error: "Email must be a valid email address." });
      }

      const perPage = 200;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

        if (error) {
          const wrappedError = new Error(
            error.message || "Failed to query users",
          );
          wrappedError.status = 502;
          throw wrappedError;
        }

        const users = data?.users || [];
        const match = users.find((user) => user.email?.toLowerCase() === email);

        if (match) {
          const canResetPassword = Boolean(
            match.email_confirmed_at || match.confirmed_at,
          );
          return res.json({ available: false, canResetPassword });
        }

        hasMore = users.length === perPage;
        page += 1;
      }

      return res.json({ available: true, canResetPassword: false });
    } catch (error) {
      return next(error);
    }
  },
);

app.get("/wishlists", ensureClientEnvMatches, async (req, res, next) => {
  try {
    const userId = String(req.query.userId || "").trim();

    if (!UUID_REGEX.test(userId)) {
      return res.status(400).json({ error: "userId must be a valid UUID." });
    }

    const includePlace = parseBoolean(
      req.query.includePlace ?? req.query.include,
    );
    const selectFields = includePlace
      ? "id, user_id, place_id, created_at, places (id, name, description, city, country, created_at)"
      : "id, user_id, place_id, created_at";

    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .select(selectFields)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      const wrappedError = new Error(
        error.message || "Failed to load wishlist items.",
      );
      wrappedError.status = 502;
      throw wrappedError;
    }

    return res.json({ items: data ?? [] });
  } catch (error) {
    return next(error);
  }
});

app.post("/wishlists", ensureClientEnvMatches, async (req, res, next) => {
  try {
    const userId = String(req.body?.userId || req.body?.user_id || "").trim();
    const placeId = String(
      req.body?.placeId || req.body?.place_id || "",
    ).trim();

    if (!UUID_REGEX.test(userId)) {
      return res.status(400).json({ error: "userId must be a valid UUID." });
    }

    if (!UUID_REGEX.test(placeId)) {
      return res.status(400).json({ error: "placeId must be a valid UUID." });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("wishlists")
      .select("id, user_id, place_id, created_at")
      .eq("user_id", userId)
      .eq("place_id", placeId)
      .maybeSingle();

    if (existingError) {
      const wrappedError = new Error(
        existingError.message || "Failed to check wishlist status.",
      );
      wrappedError.status = 502;
      throw wrappedError;
    }

    if (existing) {
      return res.status(200).json(existing);
    }

    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .insert({ user_id: userId, place_id: placeId })
      .select("id, user_id, place_id, created_at")
      .single();

    if (error) {
      const wrappedError = new Error(
        error.message || "Failed to create wishlist entry.",
      );
      wrappedError.status = 502;
      throw wrappedError;
    }

    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

app.delete("/wishlists", ensureClientEnvMatches, async (req, res, next) => {
  try {
    const userId = String(
      req.query.userId || req.body?.userId || req.body?.user_id || "",
    ).trim();
    const placeId = String(
      req.query.placeId || req.body?.placeId || req.body?.place_id || "",
    ).trim();

    if (!UUID_REGEX.test(userId)) {
      return res.status(400).json({ error: "userId must be a valid UUID." });
    }

    if (!UUID_REGEX.test(placeId)) {
      return res.status(400).json({ error: "placeId must be a valid UUID." });
    }

    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .delete()
      .eq("user_id", userId)
      .eq("place_id", placeId)
      .select("id, user_id, place_id, created_at");

    if (error) {
      const wrappedError = new Error(
        error.message || "Failed to remove wishlist entry.",
      );
      wrappedError.status = 502;
      throw wrappedError;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Wishlist entry not found." });
    }

    return res.status(200).json({ items: data });
  } catch (error) {
    return next(error);
  }
});

app.use("/api", aiRoutes);
app.use("/voting", ensureClientEnvMatches, votingRoutes(supabaseAdmin));
app.use("/groups", ensureClientEnvMatches, groupsRoutes(supabaseAdmin));
app.use("/api/groups", ensureClientEnvMatches, groupsRoutes(supabaseAdmin));
app.use("/reviews-api", ensureClientEnvMatches, reviewsRoutes(supabaseAdmin));
app.use("/notifications", ensureClientEnvMatches, notificationsRoutes(supabaseAdmin));
app.use((err, req, res, next) => {
  void next;
  console.error(err);
  const status = err.status || 500;
  const code = err.code || (status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
  res.status(status).json({
    error: {
      code,
      message: err.message || "Internal server error",
    },
  });
});

module.exports = { app, supabaseAdmin };
