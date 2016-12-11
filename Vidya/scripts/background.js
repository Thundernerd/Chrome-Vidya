var searches = {};

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
    }
});
