import httpProxy from "http-proxy";
import http from "http";

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  proxy.web(req, res, { target: "http://localhost:3000" });
});

server.listen(80, () => {
  console.log("Proxy aktif: http://larasporokulu.com → localhost:3000");
});
