// ==UserScript==
// @name         Custom server
// @namespace    http://tampermonkey.net/
// @version      2025-07-13
// @description  try to take over the world!
// @author       You
// @match        https://gats.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gats.io
// @grant        none
// ==/UserScript==

(function() {
    const protocol = "ws";
    const URL = "localhost";
    const port = 443;
    const oldSocket = window.WebSocket;

    window.allSockets = [];
    window.lastSocket = null;

    window.WebSocket = function (url, protocols) {
        if(url.includes("ping")) url = `${protocol}://${URL}:${port}/ping`;
        if(!url.includes("ping")) url = `${protocol}://${URL}:${port}`;

        //protocols aren't really used but still good to include
        const ws = (protocols ? new oldSocket(url, protocols) : new oldSocket(url));

        window.allSockets.push(ws);
        window.lastSocket = ws;

        return ws;
    };

    window.WebSocket.prototype = oldSocket.prototype;
    window.WebSocket.OPEN = oldSocket.OPEN;
    window.WebSocket.CLOSED = oldSocket.CLOSED;
    window.WebSocket.CONNECTING = oldSocket.CONNECTING;
    window.WebSocket.CLOSING = oldSocket.CLOSING;
})();