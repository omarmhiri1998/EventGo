
const http = require("node:http");
const httpProxy = require("http-proxy");

const PUBLIC_PORT = 3000;

const APP_URL = "http://127.0.0.1:3003";
const ADMIN_URL = "http://127.0.0.1:3001";
const AUTH_URL = "http://127.0.0.1:3002";

const proxy = httpProxy.createProxyServer({
  xfwd: true,
  ws: true,
  changeOrigin: false,
});

function getTarget(url = "/") {
  const pathname = new URL(
    url,
    "http://localhost"
  ).pathname;

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return ADMIN_URL;
  }

  if (
    pathname === "/auth" ||
    pathname.startsWith("/auth/")
  ) {
    return AUTH_URL;
  }

  return APP_URL;
}

proxy.on("error", (error, req, res) => {
  console.error("[Proxy Error]", error.message);

  if (res && !res.headersSent && res.writeHead) {
    res.writeHead(502, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        error: "Application unavailable",
      })
    );
  } else if (res && res.destroy) {
    res.destroy();
  }
});

const server = http.createServer((req, res) => {
  const target = getTarget(req.url);

  proxy.web(req, res, {
    target,
  });
});

server.on("upgrade", (req, socket, head) => {
  const target = getTarget(req.url);

  proxy.ws(req, socket, head, {
    target,
  });
});

server.listen(PUBLIC_PORT, () => {
  console.log("");
  console.log("EventGo Gateway running");
  console.log(`http://localhost:${PUBLIC_PORT}`);
  console.log("");
  console.log("Event App: /");
  console.log("Admin:     /admin");
  console.log("Login:     /auth/login");
  console.log("Signup:    /auth/signup");
});
