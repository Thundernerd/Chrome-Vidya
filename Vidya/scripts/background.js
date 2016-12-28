var searches = {};
var ports = {};

chrome.runtime.onConnect.addListener(function(port) {
    if (port.name == "vidya") {
        port.onMessage.addListener(function(msg) {
            if (msg.type == "register") {
                ports[msg.url] = port;
            }
        });
    }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(message);

    if (message.type == "setSearch") {
        searches[sender.tab.url] = message.value;
    } else if (message.type == "getSearch") {
        sendResponse({response:searches[sender.tab.url]});
    } else if (message.type == "isBlacklist") {
        sendResponse({response:false});
    } else if (message.type == "getUrl") {
        sendResponse({response:sender.tab.url});
    } else if (message.type == "getTitle") {
        sendResponse({response:sender.tab.title});
    } else if (message.type == "popupUpdatedSettings") {
        ports[message.url].postMessage({type: "updateSettings"});
    } else if (message.type == "popupUpdatedHook") {
        ports[message.url].postMessage({type: "updateHook"});
    } else if (message.type == "popupUpdatedTracking") {
        ports[message.url].postMessage({type: "updateTracking"});
    }
});
