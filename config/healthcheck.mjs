import http from 'node:http';

let webHealthy = false;
let mobileHealthy = false;
let lastChanged = Date.now();

function checkWeb() {
  const req = http.get('http://localhost:4000', (res) => {
    const wasHealthy = webHealthy;
    webHealthy = res.statusCode >= 200 && res.statusCode < 500;
    if (webHealthy !== wasHealthy) {
      lastChanged = Date.now();
    }
    res.resume();
  });

  req.on('error', () => {
    if (webHealthy) {
      lastChanged = Date.now();
    }
    webHealthy = false;
  });

  req.setTimeout(1500, () => {
    req.destroy();
    if (webHealthy) {
      lastChanged = Date.now();
    }
    webHealthy = false;
  });
}

function checkMobile() {
  const req = http.get('http://localhost:8081', (res) => {
    const wasHealthy = mobileHealthy;
    mobileHealthy = res.statusCode >= 200 && res.statusCode < 500;
    if (mobileHealthy !== wasHealthy) {
      lastChanged = Date.now();
    }
    res.resume();
  });

  req.on('error', () => {
    if (mobileHealthy) {
      lastChanged = Date.now();
    }
    mobileHealthy = false;
  });

  req.setTimeout(1500, () => {
    req.destroy();
    if (mobileHealthy) {
      lastChanged = Date.now();
    }
    mobileHealthy = false;
  });
}

setInterval(checkWeb, 2000);
checkWeb(); // kick off immediately

setInterval(checkMobile, 2000);
checkMobile(); // kick off immediately

http.createServer((req, res) => {
  if (req.url === '/healthz') {
    const isHealthy = webHealthy && mobileHealthy;
    res.statusCode = isHealthy ? 200 : 500;
    res.end(
      JSON.stringify({
        status: isHealthy ? 'ok' : 'unhealthy',
        web: webHealthy ? 'ok' : 'unhealthy',
        mobile: mobileHealthy ? 'ok' : 'unhealthy',
        since: new Date(lastChanged).toISOString(),
      })
    );
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
}).listen(9000, () => {
  console.log('Healthcheck listening on http://localhost:9000');
});
