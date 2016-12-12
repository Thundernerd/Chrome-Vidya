$(document).ready(function() {
    chrome.runtime.sendMessage({type:"isBlacklist"}, function(data) {
        console.log(data);

        if (data.response == false) {
            findVideo();
        }
    });
});

var key_progress = "vidya_progress";
var key_data = "vidya_data";

var delays = [1000,1000,2000,2000,4000,4000,8000];
var delayIndex = 0;

var search;
var url;
var domain;
var title;
var video;

var keyHook;
var keyTrack;

var useHook = false;
var useTrack = true;

var popupDataSet = false;

function getKey(key) {
    return key+"_"+url;
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

function findVideo() {
    var videos = $("video");

    if (videos.length == 0) {
        if (delayIndex >= delays.length) {
            console.log("no video found");
            return;
        }

        var nDelay = delays[delayIndex];
        delayIndex++;
        setTimeout(findVideo, nDelay);
    } else {
        video = videos[0];

        chrome.runtime.sendMessage({type:"getSearch"}, function(data) {
            console.log(data);
            search = data.response;
        });

        chrome.runtime.sendMessage({type:"getTitle"}, function(data) {
            console.log(data);
            title = data.response;
        });

        chrome.runtime.sendMessage({type:"getUrl"}, function (data) {
            console.log(data);
            url = data.response;

            domain = extractDomain(url);
            if (domain.startsWith("www.")) {
                domain = domain.substring(4);
            }
            keyHook = "bl_k_"+domain;
            keyTrack = "bl_t_"+domain;
            chrome.storage.local.get(keyHook, onGetBlacklistKeyboard);
            chrome.storage.local.get(keyTrack, onGetBlacklistTracking);

            startTrackingVideo();
            getVideoProgress();
            hookKeyboard();
        });
    }
}

function onGetBlacklistKeyboard(data) {
    var value = data[keyHook];
    if (value === undefined) return;
    useHook = value;
}

function onGetBlacklistTracking(data) {
    var value = data[keyTrack];
    if (value === undefined) return;
    useTrack = value;
}

function startTrackingVideo() {
    video.ontimeupdate = onTimeUpdate;
}

function stopTrackingVideo() {
    video.removeEventListener("timeupdate", onTimeUpdate);
}

function onTimeUpdate() {
    if (!useTrack) {
        return;
    }

    var currentTime = this.currentTime;
    var duration = this.duration;
    var percentage = currentTime/duration;

    if (isNaN(currentTime) || isNaN(duration))
        return;

    if (currentTime < 10)
        return;

    if (!popupDataSet) {
        setPopupData(this);
    }

    if (percentage <= 0.85) {
        saveVideoData(currentTime);
    } else {
        stopTrackingVideo();
        deleteVideoData();
    }
}

function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(search),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

function getVideoPoster() {
    if (url.includes("youtube.com/")) {
        var p = getUrlParameter("v");
        return "https://i1.ytimg.com/vi/{0}/mqdefault.jpg".replace("{0}", p);
    } else if (url.includes("youtube.googleapis.com/") || window.location.href.includes("youtube.googleapis.com/")) {
        var element = $(".ytp-thumbnail-overlay-image");
        var src = element.css("background-image").replace('url("',"").replace('")', "");
        return src;
    } else {
        return $(video).attr("poster");
    }
}

function setPopupData(video) {
    var data = {};
    data[getKey(key_data)] = {
        id: url,
        title: title,
        duration: video.duration,
        poster: getVideoPoster(),
    };

    chrome.storage.local.set(data);
    popupDataSet = true;
}

function saveVideoData(currentTime) {
    var data = {};
    data[getKey(key_progress)] = currentTime;
    chrome.storage.local.set(data);
}

function deleteVideoData() {
    chrome.storage.local.remove(getKey(key_progress));
    chrome.storage.local.remove(getKey(key_data));
}

function getVideoProgress() {
    chrome.storage.local.get(getKey(key_progress), onGetVideoProgress);
}

function onGetVideoProgress(data) {
    var i = parseInt(data[getKey(key_progress)]);

    if (!isNaN(i)) {
        setCurrentTime(i);
    }
}

function setCurrentTime(time) {
    if (video.paused) {
        setTimeout(function() { setCurrentTime(time); }, 100);
    } else {
        video.currentTime = time;
    }
}

function hookKeyboard() {
    document.addEventListener("keydown", onKeyDown);
}

function onKeyDown(evt) {
    if (!useHook) {
        return;
    }

    if (evt.defaultPrevented) {
        return;
    }

    if ($(document.activeElement).is("input"))
        return;

    if (evt.ctrlKey)
        return;

    switch (evt.keyCode) {
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
            scrubPercentage((evt.keyCode-48)/10);
            evt.preventDefault();
            break;
        case 74:
            scrubStep(-10);
            evt.preventDefault();
            break;
        case 75:
            togglePause();
            evt.preventDefault();
            break;
        case 76:
            scrubStep(10);
            evt.preventDefault();
            break;
        case 77:
            toggleMute();
            evt.preventDefault();
            break;
        case 80:
            togglePause();
            evt.preventDefault();
            break;
    }
}

function scrubPercentage(p) {
    var c = video.duration * p;

    if (isNaN(c))
        return;

    video.currentTime = c;
}

function scrubStep(s) {
    video.currentTime += s;
}

function togglePause() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function toggleMute() {
    video.muted = !video.muted;
}
