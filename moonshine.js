RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

$ = function (sel, a) { return (a = [].slice.call( document.querySelectorAll(sel) )).length > 1 ? a : a[0] };
$.merge = function (obj1, obj2) {
  for (var a in obj2) obj1[a] = obj2[a];
  return obj1
};
$.merge($, {
  ajax: function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
      if(xhr.readyState == 4 && xhr.status == 200) {
        return JSON.parse(xhr.responseText)
      }
    };
    xhr.send();
  },
  addEvent: function (el, ev, fn) {
    var a = ev.split(" "), b = a.length;
    while (b--) el.addEventListener(a[b], fn.bind(el), false);
    return el
  },
  addClass: function (el, cn) {
    el.className += " " + cn;
    return el
  },
  removeClass: function (el, cn) {
    el.className = el.className.replace( new RegExp("(?:^|\\s)" + cn + "(?!\\S)"), '' );
    return el
  }
});

function init() {
  var
    nilfun = function () {},
    servers = $.ajax("stun.json"),
    pcConstraint = { optional: [{ "RtpDataChannels": false }] },
    dataConstraint = { reliable: false },
      
    pc1 = new RTCPeerConnection(servers, pcConstraint),
    pc2 = new RTCPeerConnection(servers, pcConstraint),
    dc1 = null,
    dc2 = null,
    activedc,

    sendButton = $("#serial-chat button.send"),
    ticketTA = $.addEvent($("#serial-chat .ticket > textarea"), "click", function () { this.select() }),
    ticketInfo = $("#serial-chat .info > span"),
    dataChannelSend = $("#serial-chat textarea.message"),
    serialChat = $("#serial-chat"),
    connectView = $("#serial-chat > .connect"),
    exchangeView = $("#serial-chat > .exchange");

  $.addEvent($("#serial-chat .connect > .create"), "click", function () {
    $.addEvent(ticketTA, "cut copy", function () {
      $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
        var adesc = new RTCSessionDescription(JSON.parse(ticketTA.value));
        pc1.setRemoteDescription(adesc)
      }.bind(this), 0) });
      ticketInfo.innerHTML = "They need to give you their stub<br />Paste it here"
    });
    $.removeClass(exchangeView, "hide");
    $.addClass(connectView, "hide");
    ticketInfo.innerHTML = "This is a ticket to enter<br />Pass it on";
    
    activedc = dc1 = $.merge(pc1.createDataChannel('test', {reliable: true}), {
      onopen: function (e) {
        $.addClass(serialChat, "open");
        $.addClass(exchangeView, "hide");
        $.addEvent(sendButton, "click", sendMessage)
      },
      onmessage: function (e) {
        if (e.data.charCodeAt(0) == 2) return;
        var data = JSON.parse(e.data);
        writeToChatLog(data.message, "bob")
      }
    });
    pc1.createOffer(function (desc) { pc1.setLocalDescription(desc, nilfun, nilfun) }, nilfun)
  });
  
  $.addEvent($("#serial-chat .connect > .redeem"), "click", function () {
    $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
      var odesc = new RTCSessionDescription(JSON.parse(ticketTA.value));
      pc2.setRemoteDescription(odesc, function () {
        pc2.createAnswer( function (adesc) { pc2.setLocalDescription(adesc) }, nilfun )
      }, nilfun)
    }.bind(this), 0) });
    $.removeClass(exchangeView, "hide");
    $.addClass(connectView, "hide");
    ticketInfo.innerHTML = "You need a ticket to enter<br />Paste it here";
    ticketTA.focus()
  });

  $.merge(pc1, {
    onicecandidate: function (e) {
      if (e.candidate == null) {
        ticketTA.value = JSON.stringify(pc1.localDescription);
        ticketTA.select()
      }
    },
    onconnection: dataChannelSend.focus
  });

  $.merge(pc2, {
    ondatachannel: function (e) {
      dc2 = activedc = e.channel || e;
      dc2.onopen = function (e) {
        $.addClass(serialChat, "open");
        $.addClass(exchangeView, "hide");
        $.addEvent(sendButton, "click", sendMessage)
      };
      dc2.onmessage = function (e) {
        var data = JSON.parse(e.data);
        writeToChatLog(data.message, "bob")
      }
    },
    onicecandidate: function (e) {
      if (e.candidate == null) {
        ticketInfo.innerHTML = "Here is your ticket stub<br />Pass it back";
        ticketTA.value = JSON.stringify(pc2.localDescription);
        ticketTA.select()
      }
    },
    onconnection: dataChannelSend.focus
  })
  
  function sendMessage(channel) {
    if (dataChannelSend.value) {
      writeToChatLog(dataChannelSend.value, "alice");
      activedc.send( JSON.stringify({ message: dataChannelSend.value }) );
      dataChannelSend.value = ""
    }
  }

  function writeToChatLog(message, message_type) {
    var msg = $("#stamps > .chat-message").cloneNode(true);
    msg.innerHTML = message;
    $("#serial-chat div.conversation").appendChild($.addClass(msg, message_type))
  }

}