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

var delays = [1000,2000,4000,8000];
var delayIndex = 0;

var search;
var url;
var title;
var video;

var popupDataSet = false;

function getKey(key) {
    return key+"_"+url;
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
            startTrackingVideo();
            getVideoProgress();
        });
    }
}

function startTrackingVideo() {
    video.ontimeupdate = onTimeUpdate;
}

function stopTrackingVideo() {
    video.removeEventListener("timeupdate", onTimeUpdate);
}

function onTimeUpdate() {
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
