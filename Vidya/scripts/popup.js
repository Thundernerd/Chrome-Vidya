var url;
var domain;
var useHook = false;
var useTrack = true;

var keyKeyboard;
var keyTracking;

var key_settings = "vidya_settings";
var settings;
var settingsOpen = false;

$(function() {
    chrome.storage.local.get(key_settings, onGetSettings);
    chrome.storage.local.get(null, onGetAllItems);

    $("#keyboard").click(function() {
        $("#keyboard_black").stop().fadeToggle(100);
        useHook = !useHook;
        var data = {};
        data[keyKeyboard] = useHook;
        chrome.storage.local.set(data);
        chrome.runtime.sendMessage({type:"popupUpdatedHook", url:url});
    });

    $("#tracking").click(function() {
        $("#tracking_black").stop().fadeToggle(100);
        useTrack = !useTrack;
        var data = {};
        data[keyTracking] = useTrack;
        chrome.storage.local.set(data);
        chrome.runtime.sendMessage({type:"popupUpdatedTracking", url:url});
    });

    $("#gear").click(function() {
        $("#gear_black").stop().fadeToggle(100);
        $("#settings").slideToggle(200);
        settingsOpen = !settingsOpen;
        if (!settingsOpen) {
            saveSettings();
            chrome.runtime.sendMessage({type:"popupUpdatedSettings", url:url});
        }
    });

    chrome.tabs.query({active:true,currentWindow:true}, function(data) {
        if (data.length == 0) {
            // No tabs?
            return;
        }

        url = data[0].url;
        domain = extractDomain(url);

        if (domain.startsWith("www.")) {
            domain = domain.substring(4);
        }

        keyKeyboard = "bl_k_" + domain;
        keyTracking = "bl_t_" + domain;

        chrome.storage.local.get(keyKeyboard, onGetBlacklistKeyboard);
        chrome.storage.local.get(keyTracking, onGetBlacklistTracking);
    });
});

function saveSettings() {
    settings.timeToStart = parseInt($("#timeToStart").val());
    settings.scrubAmount = parseInt($("#scrubAmount").val());
    settings.finishPercentage = parseInt($("#finishPercentage").val());
    settings.openInCurrent = $("#openInCurrent").is(":checked");

    var data = {};
    data[key_settings] = settings;
    chrome.storage.local.set(data);
}

function setDefaultSettings() {
    var data = {};
    data[key_settings] = {
        timeToStart: 10,
        scrubAmount: 10,
        finishPercentage: 85,
        openInCurrent: false
    };

    chrome.storage.local.set(data);
    chrome.storage.local.get(key_settings, onGetSettings);
}

function onGetSettings(data) {
    var keys = Object.keys(data);
    var values = Object.values(data);
    if (values.length == 0) {
        setDefaultSettings();
    } else {
        settings = values[0];
        $("#timeToStart").val(settings.timeToStart);
        $("#scrubAmount").val(settings.scrubAmount);
        $("#finishPercentage").val(settings.finishPercentage);
        $("#openInCurrent").prop("checked",settings.openInCurrent);
    }
}

function onGetBlacklistKeyboard(data) {
    var value = data[keyKeyboard];
    if (value === undefined) {
        return;
    }
    useHook = value;
    if (useHook){
        $("#keyboard_black").stop().fadeIn(0);
    }
}

function onGetBlacklistTracking(data) {
    var value = data[keyTracking];
    if (value === undefined) {
        return;
    }
    useTrack = value;
    if (!useTrack) {
        $("#tracking_black").stop().fadeOut(0);
    }
}

function extractDomain(url) {
    var domain;

    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    } else {
        domain = url.split('/')[0];
    }

    domain = domain.split(':')[0];
    return domain;
}

function onGetAllItems(items) {
    var keys = Object.keys(items);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k.startsWith("vidya_data_")) {
            var value = items[k];
            createPopup(i,value);
        }
    }
}

function createPopup(i, data) {
    var item = $('<div id="item_'+i+'" class="item"></div>');
    var img = $('<img id="img_'+i+'" class="thumb" />');
    var loading = $('<div id="loader_'+i+'" class="loading"><img id="loading_'+i+'" src="images/loading.svg"/></div>');

    var info = $('<div id="info_'+i+'" class="info"></div>');
    var duration = $('<div id="duration_'+i+'" class="duration"></div>');
    var title = $('<div id="title_'+i+'" class="title">'+data.title+'</div>');

    var overlay = $('<div id="overlay_'+i+'" class="overlay"></div>');
    var btn = $('<img id="btn_'+i+'" class="btn" src="images/trash.png" />');

    info.append(duration);
    info.append(title);

    overlay.append(btn);

    item.append(img);
    item.append(loading);
    item.append(info);
    item.append(overlay);

    var vId = "vidya_progress_"+data.id;
    chrome.storage.local.get("vidya_progress_"+data.id, function(vData) {
        var i = parseInt(vData[vId]);
        if (!isNaN(i)) {
            duration.css("width", ((i/data.duration)*100)+"%");
        }
    });

    var poster = data.poster;
    if (poster === undefined) {
        // return;
    } else {
        if (poster.startsWith("//")){
            poster = "http:" + data.poster;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', poster);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
            loading.remove();
            img.attr("src", window.URL.createObjectURL(this.response));
        }
        xhr.send();
    }

    item.click(function() {
        if (settings.openInCurrent) {
            var newUrl = data.id;
            chrome.tabs.query({active:true,currentWindow:true}, function(tabs) {
                if (tabs.length == 0) {
                    chrome.tabs.create({url:data.id});
                } else {
                    chrome.tabs.update(tabs[0].id, {url:newUrl});
                    window.close();
                }
            })
        } else {
            chrome.tabs.create({url:data.id});
        }
        return false;
    });

    item.contextmenu(function() {
        overlay.stop().fadeToggle(150);
        return false;
    });

    overlay.click(function() {
        return false;
    });

    btn.click(function() {
        var id = data.id;
        var dId = "vidya_data_"+id;
        var vId = "vidya_progress_"+id;

        chrome.storage.local.remove(dId);
        chrome.storage.local.remove(vId);

        item.stop().slideUp(200, function() {
            item.remove();
        })

        return false;
    });

    btn.contextmenu(function() {
        return false;
    });

    $("#items").append(item);

}
