import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 3000);
const root = join(process.cwd(), "public");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  const requested = pathname === "/" ? "/index.html" : pathname;
  let filePath = normalize(join(root, requested));

  if (!filePath.startsWith(root)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  // Vercel serves this project with `cleanUrls: true`, so /methodology resolves
  // to methodology.html once deployed. Mirror that here, or extensionless links
  // work in production and 404 under `npm run dev`.
  if (!existsSync(filePath) && !extname(filePath) && existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  }

  if (!existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${port}`);
});
