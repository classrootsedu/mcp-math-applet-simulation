// tests/helpers/setup-jsdom.js
const { JSDOM } = require('jsdom');

function newWindow(html = '<!DOCTYPE html><html><body><div id="react-root"></div></body></html>') {
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  // Mirror what the browser would expose to applet code.
  global.window = dom.window;
  global.document = dom.window.document;
  global.MessageEvent = dom.window.MessageEvent;
  global.CustomEvent = dom.window.CustomEvent;
  global.location = dom.window.location;
  return dom;
}

function teardownWindow() {
  delete global.window;
  delete global.document;
  delete global.MessageEvent;
  delete global.CustomEvent;
  delete global.location;
}

module.exports = { newWindow, teardownWindow };
