// Simple service worker that doesn't use Firebase SDK directly (to avoid stack overflow)
self.addEventListener("install", (event) => {
  console.log("Auth Service Worker installing.");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Auth Service Worker activating.");
  return self.clients.claim();
});

// Store for auth token
let authToken = null;

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "AUTH_TOKEN") {
    console.log("Auth service worker received token:", !!event.data.token);
    authToken = event.data.token;
  }
});

// Intercept fetch requests and add auth header if available
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only modify same-origin requests
  if (url.origin === self.location.origin && authToken) {
    // Create new headers with auth token
    const modifiedHeaders = new Headers(event.request.headers);
    modifiedHeaders.set("Authorization", `Bearer ${authToken}`);

    // Create a new request with the modified headers
    const modifiedRequest = new Request(event.request.url, {
      method: event.request.method,
      headers: modifiedHeaders,
      body: event.request.body,
      mode: event.request.mode,
      credentials: event.request.credentials,
      cache: event.request.cache,
      redirect: event.request.redirect,
      referrer: event.request.referrer,
      integrity: event.request.integrity,
    });

    // Use the modified request
    event.respondWith(fetch(modifiedRequest));
  }
});
