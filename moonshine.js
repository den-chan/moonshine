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
  },
  compress: function (s) {
    s = btoa(s);
    if (s.length % 2 !== 0) s += " ";
    for (var i = 0, out = ""; i < s.length; i+=2) out += String.fromCharCode((s.charCodeAt(i) * 256) + s.charCodeAt(i + 1));
    return out;
  },
  decompress: function (s) {
    for (var i = 0, out = "", n; i < s.length; i++) {
      n = s.charCodeAt(i);
      out += String.fromCharCode(Math.floor(n / 256), n % 256)
    }
    return atob(out)
  }
});

function init() {
  var
    servers = $.ajax("stun.json"),
    pcConstraint = { optional: [{ "RtpDataChannels": false }] },
    dataConstraint = { reliable: false },
      
    pc = new RTCPeerConnection(servers, pcConstraint),
    dc, nilfun = function () {},

    sendButton = $("#serial-chat button.send"),
    ticketTA = $.addEvent($("#serial-chat .ticket > textarea"), "click", function () { this.select() }),
    ticketInfo = $("#serial-chat .info > span"),
    dataChannelSend = $("#serial-chat textarea.message"),
    serialChat = $("#serial-chat"),
    connectView = $("#serial-chat > .connect"),
    exchangeView = $("#serial-chat > .exchange");

  $.addEvent($("#serial-chat .connect > .create"), "click", function () {
    $.merge(pc, {
      onicecandidate: function (e) {
        if (e.candidate == null) {
          ticketTA.value = $.compress(JSON.stringify(pc.localDescription));
          ticketTA.select()
        }
      },
      onconnection: dataChannelSend.focus
    });
    $.addEvent(ticketTA, "cut copy", function () {
      $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
        var adesc = new RTCSessionDescription(JSON.parse($.decompress(ticketTA.value)));
        pc.setRemoteDescription(adesc)
      }.bind(this), 0) });
      ticketInfo.innerHTML = "They need to give you their stub<br />Paste it here"
    });
    $.removeClass(exchangeView, "hide");
    $.addClass(connectView, "hide");
    ticketInfo.innerHTML = "This is a ticket to enter<br />Pass it on";
    dc = $.merge( pc.createDataChannel('test', {reliable: true}), { onopen: openChannel, onmessage: getMessage } );
    pc.createOffer(function (desc) { pc.setLocalDescription(desc, nilfun, nilfun) }, nilfun)
  });
  
  $.addEvent($("#serial-chat .connect > .redeem"), "click", function () {
    $.merge(pc, {
      ondatachannel: function (e) { dc = $.merge(e.channel || e, {onopen: openChannel, onmessage: getMessage }) },
      onicecandidate: function (e) {
        if (e.candidate == null) {
          ticketInfo.innerHTML = "Here is your ticket stub<br />Pass it back";
          ticketTA.value = $.compress(JSON.stringify(pc.localDescription));
          ticketTA.select()
        }
      },
      onconnection: dataChannelSend.focus
    });
    $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
      var odesc = new RTCSessionDescription(JSON.parse($.decompress(ticketTA.value)));
      pc.setRemoteDescription(odesc, function () {
        pc.createAnswer( function (adesc) { pc.setLocalDescription(adesc) }, nilfun )
      }, nilfun)
    }.bind(this), 0) });
    $.removeClass(exchangeView, "hide");
    $.addClass(connectView, "hide");
    ticketInfo.innerHTML = "You need a ticket to enter<br />Paste it here";
    ticketTA.focus()
  });
  
  function openChannel() {
    $.addClass(serialChat, "open");
    $.addClass(exchangeView, "hide");
    $.addEvent(sendButton, "click", sendMessage);
    $.addEvent(dataChannelSend, "keyup", function (e) {
      if (e.keyCode == 13 && e.ctrlKey === true) sendMessage();
      return false
    })
  }
  
  function getMessage(e) {
    if (e.data.charCodeAt(0) == 2) return;
    var data = JSON.parse(e.data);
    writeToChatLog("[Remote] " + data.message, "bob")
  }
  
  function sendMessage(channel) {
    if (dataChannelSend.value) {
      writeToChatLog("[Local] " + dataChannelSend.value, "alice");
      dc.send( JSON.stringify({ message: dataChannelSend.value }) );
      dataChannelSend.value = ""
    }
  }

  function writeToChatLog(message, message_type) {
    var msg = $("#stamps > .chat-message").cloneNode(true);
    msg.innerHTML = message;
    $("#serial-chat div.conversation").appendChild($.addClass(msg, message_type))
  }

}