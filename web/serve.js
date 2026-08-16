#!/usr/bin/env node
require("./env");
/* Local preview server for dist/. Raises two listeners:

     http  on localhost      — for testing in a desktop browser
     https on your LAN IP    — for scanning a QR code with a phone

   Both are needed because WebCrypto only runs in a secure context.
   `localhost` counts as secure even over http; `192.168.x.x` does not.
   So a phone scanning a code must reach the machine over https, which
   means a certificate — generated here, self-signed, cached in .cert/. */

const http = require("http");
const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
const selfsigned = require("selfsigned");

const DIST = path.join(__dirname, "dist");
const CERT_DIR = path.join(__dirname, ".cert");
const HTTP_PORT = Number(process.env.PORT || 8070);
const HTTPS_PORT = HTTP_PORT + 1;

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
                ".json": "application/json", ".svg": "image/svg+xml" };

function lanIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family === "IPv4" && !ni.internal) return ni.address;
    }
  }
  return null;
}

/* Certificate is regenerated whenever the LAN address changes, since the
   address is baked into the SAN list and a stale one fails validation. */
function cert(ip) {
  const stamp = path.join(CERT_DIR, "for.txt");
  const keyF = path.join(CERT_DIR, "key.pem");
  const crtF = path.join(CERT_DIR, "cert.pem");

  if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === (ip || "") &&
      fs.existsSync(keyF) && fs.existsSync(crtF)) {
    return { key: fs.readFileSync(keyF), cert: fs.readFileSync(crtF) };
  }

  const altNames = [{ type: 2, value: "localhost" }, { type: 7, ip: "127.0.0.1" }];
  if (ip) altNames.push({ type: 7, ip });

  const pems = selfsigned.generate(
    [{ name: "commonName", value: ip || "localhost" }],
    { days: 365, keySize: 2048, algorithm: "sha256", extensions: [{ name: "subjectAltName", altNames }] }
  );

  fs.mkdirSync(CERT_DIR, { recursive: true });
  fs.writeFileSync(keyF, pems.private);
  fs.writeFileSync(crtF, pems.cert);
  fs.writeFileSync(stamp, ip || "");
  return { key: pems.private, cert: pems.cert };
}

function handler(req, res) {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const file = path.join(DIST, rel);
  if (!file.startsWith(DIST)) { res.writeHead(403).end("forbidden"); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { "content-type": "text/plain" }).end("not found"); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
}

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error("\n  dist/index.html is missing. Run `npm run build` first.\n");
  process.exit(1);
}

const ip = lanIp();
const cards = JSON.parse(fs.readFileSync(path.join(__dirname, "cards.json"), "utf8")).cards;
const pick = t => cards.find(c => c.type === t).slug;

http.createServer(handler).listen(HTTP_PORT);
https.createServer(cert(ip), handler).listen(HTTPS_PORT);

console.log(`
  Unveil companion preview

  Desktop        http://localhost:${HTTP_PORT}/
    real         http://localhost:${HTTP_PORT}/#${pick("real")}
    fake         http://localhost:${HTTP_PORT}/#${pick("fake")}
    audience     http://localhost:${HTTP_PORT}/#${pick("audience")}
    unknown      http://localhost:${HTTP_PORT}/#000000
${ip ? `
  Phone / QR     https://${ip}:${HTTPS_PORT}/
                 Open facilitator/qr-test-sheet.html and scan any code.
                 The certificate is self-signed — your phone will warn once.
                 Tap "Advanced" then proceed. It is your own machine.
                 Phone must be on the same wifi.
` : `
  No LAN address found, so QR codes cannot be scanned from a phone.
  Connect to a network and rebuild.
`}
  Ctrl+C to stop.
`);
