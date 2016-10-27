var delays = [1000,2000,4000,8000];
var delayIndex = 0;

var id;
var video;

var isVisible = true;
var lastStamp;

// main
getVideoElement();

function getVideoElement() {
    lastStamp = new Date();
    var videos = $("video");

    if (videos.length == 0) {
        if (delayIndex >= delays.length) {
            return;
        }

        var nDelay = delays[delayIndex];
        delayIndex++;
        setTimeout(getVideoElement, nDelay);
    } else {
        id = "vidya_" + window.location.href;

        video = videos[0];
        video.ontimeupdate = onTimeUpdate;

        chrome.storage.local.get(id, onGetFromStorage);
        document.addEventListener("keydown", onKeyDown);
        $(window).scroll(onScroll);
    }
}

function onGetFromStorage(data) {
    var i = parseInt(data[id]);

    if (!isNaN(i)) {
        setCurrentTime(i);
    }
}

function setCurrentTime(time) {
    if (video.paused) {
        setTimeout(function () { setCurrentTime(time); }, 100);
    } else {
        video.currentTime = time;
    }
}

function onTimeUpdate() {
    var c = this.currentTime;
    var d = this.duration;
    var p = c/d;

    if (isNaN(c) || isNaN(d))
        return;

    if (c < 10)
        return;

    if (p <= 0.85) {
        var data = {};
        data[id] = c;
        chrome.storage.local.set(data);
    } else {
        video.removeEventListener("timeupdate", onTimeUpdate);
        chrome.storage.local.remove(id);
    }
}

function onKeyDown(evt) {
    if (evt.defaultPrevented)
        return;

    if ($(document.activeElement).is("input"))
        return;

    if (evt.ctrlKey)
        return;

    if (!isVisible)
        return;

    var isOther = false;

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
            break;
        case 74:
            scrubStep(-10);
            break;
        case 75:
            togglePause();
            break;
        case 76:
            scrubStep(10);
            break;
        case 77:
            toggleMute();
            break;
        case 80:
            togglePause();
            break;
        default:
            isOther = true;
            break;
    }

    if (isOther) {
        lastStamp = new Date();
        return;
    }

    if (checkKeyDelay())
        return;

    evt.preventDefault();
}

function onScroll() {
    var elm = $(video);

    eval = "visible";
    var vpH = $(window).height(),
        st = $(window).scrollTop(),
        y = $(elm).offset().top,
        elementHeight = $(elm).height();

    isVisible = ((y < (vpH + st)) && (y > (st - elementHeight)));
}

function checkKeyDelay() {
    var now = new Date();
    var diff = now.getTime() - lastStamp.getTime();

    return diff < 500;
}

function scrubPercentage(p) {
    if (checkKeyDelay()) return;

    var c = video.duration * p;

    if (isNaN(c))
        return;

    video.currentTime = c;
}

function scrubStep(s) {
    if (checkKeyDelay()) return;

    video.currentTime += s;
}

function togglePause() {
    if (checkKeyDelay()) return;

    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function toggleMute() {
    if (checkKeyDelay()) return;

    video.muted = !video.muted;
}
