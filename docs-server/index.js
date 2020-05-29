const express = require("express");
const prettify = require("express-prettify");
const openapiUi = require("swagger-ui-express");
const path = require("path");
const fs = require("fs");
const YAML = require("yaml");

function bootstrap() {
  const expressLogAppender = (req, res, next) => {
    const reqTime = Date.now();

    const afterResponse = () => {
      const resTime = Date.now();
      const duration = resTime - reqTime;

      res.removeListener("finish", afterResponse);
      res.removeListener("close", afterResponse);

      // action after response
      console.info(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
        duration,
        status: res.statusCode,
      });
    };

    res.on("finish", afterResponse);
    res.on("close", afterResponse);

    // action before request
    console.info(`${req.method} ${req.url} from ${req.headers.referer}`, {
      query: req.query,
      body: req.body,
    });
    next();
  };

  // -------------------------------------
  // from env
  const { HOSTNAME, BASE_URL, BASE_PATH, SERVER_PORT, DOCS_OPENAPI_JSON, DOCS_ASYNCAPI_PATH } = process.env;

  const port = SERVER_PORT || 3000;
  const hostname = HOSTNAME || "localhost";
  const baseUrl = BASE_URL || `http://${hostname || "localhost"}:${port}`.replace(/\/$/, "");
  const basePath = `${BASE_PATH || ""}`.replace(/\/$/, "");
  const openapiJsonPath = DOCS_OPENAPI_JSON || path.join(__dirname, "../docs/bridge-x-server.openapi.json");
  const asyncapiPath = DOCS_ASYNCAPI_PATH || path.join(__dirname, "../docs/mqtt");

  const openapiJson = JSON.parse(fs.readFileSync(openapiJsonPath, "utf8"));

  // -------------------------------------
  // url info
  const contents = {
    rest: {
      name: "rest",
      docType: "openapi",
      source: "yaml",
      description: "REST API specifications for Bridge-X Server",
      relativePath: `${basePath}/rest`,
      fullPath: `${baseUrl}/rest`,
    },
    mqtt: {
      name: "mqtt",
      docType: "asyncapi",
      source: "html",
      description: "MQTT interface specifications for Bridge-X Server",
      relativePath: `${basePath}/mqtt`,
      fullPath: `${baseUrl}/mqtt`,
    },
  };

  // -------------------------------------
  // router for openapi docs
  const app = express();
  app.use(expressLogAppender);
  app.use(contents.rest.relativePath, openapiUi.serve, openapiUi.setup(openapiJson));

  // router for static docs
  app.use(contents.mqtt.relativePath, express.static(asyncapiPath));

  // others
  app.all("*", prettify({ always: true }), (_, res) => res.status(404).json({ contents }));

  // start server
  app.listen(port, () => console.info(YAML.stringify(contents)));

  // -------------------------------------
  // gracefully shutdown
  const shutdown = (ev) => {
    console.info("got %s, starting shutdown", ev);

    if (!app.listening) {
      process.exit(0);
      return;
    }

    console.info("closing...");
    app.close((err) => {
      if (err) {
        console.error(err);
        return process.exit(1);
      }
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("SIGHUP", shutdown);
}

bootstrap();
