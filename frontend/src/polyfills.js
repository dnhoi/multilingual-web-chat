// Polyfill for global object (required by sockjs-client)
if (typeof global === 'undefined') {
  window.global = window;
}

// Polyfill for process object (required by some Node.js modules)
if (typeof process === 'undefined') {
  window.process = { env: {} };
}

// Polyfill for Buffer (if needed)
if (typeof Buffer === 'undefined') {
  window.Buffer = {
    isBuffer: () => false
  };
}
