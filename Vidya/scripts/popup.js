$(function() {
    chrome.storage.local.get(null,onGetAllItems);
});

function onGetAllItems(items) {
    var values = Object.values(items);
    for (var i = 0; i < values.length; i++) {
        var val = values[i];
        if (val instanceof Object) {
            console.log(val);
            createPopup(i, val);
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
        chrome.tabs.create({url:data.id});
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

    console.log(data);

    $("#items").append(item);

}
