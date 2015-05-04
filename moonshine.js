RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

$ = function (sel, a) { return (a = [].slice.call( (this == window ? document : this).querySelectorAll(sel) )).length > 1 ? a : a[0] };
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
  addAttr: function (el, ah) { for (var a in ah) el.setAttribute(a, ah[a]) },
  insert: function (pe, ce, c, fn) {
    var j = pe.childNodes.length;
    while (j > 0 && fn(ce.getAttribute(c), pe.childNodes[j - 1].getAttribute(c))) j--;
    j == pe.childNodes.length ? pe.appendChild(ce) : pe.insertBefore(ce, pe.childNodes[j])
  },
  compress: function (s) {
    if (s.length % 2 !== 0) s += " ";
    for (var i = 0, out = ""; i < s.length; i+=2) out += String.fromCharCode((s.charCodeAt(i) * 256) + s.charCodeAt(i + 1));
    return out;
  },
  decompress: function (s) {
    for (var i = 0, out = "", n; i < s.length; i++) {
      n = s.charCodeAt(i);
      out += String.fromCharCode(Math.floor(n / 256), n % 256)
    }
    return out
  },
  hash: function(s) {
    var hash = 0, i, chr, len;
    if (s.length == 0) return hash;
    for (i = 0, len = s.length; i < len; i++) {
      chr = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr >>> 0;
    }
    hs = hash.toString(16);
    return Array(9 - hs.length).join("0") + hs
  }
});

function init() {
  var
    servers = $.ajax("stun.json"),
    pcConstraint = { optional: [{ "RtpDataChannels": false }] },
    dataConstraint = { reliable: false },
      
    pc, dc, nilfun = function () {},
    action, pageState = {},

    sendButton = $("#room button.send"),
    ticketTA = $.addEvent($("#exchange > .ticket > textarea"), "click", function () { this.select() }),
    ticketInfo = $("#exchange > .info > span");
  
  $.addEvent($("body"), "beforeunload", closeChannel);
  $.addEvent($("#room > .close"), "click", closeChannel);

  $.addEvent($("#room > button.send"), "click", sendMessage);
  $.addEvent($("#room > textarea.message"), "keyup", function (e) {
    if (e.keyCode == 13 && e.ctrlKey === true) sendMessage.bind(e.target)();
    return false
  });
  
  $.addEvent($("#connect > .create"), "click", function () {
    ticketTA.innerHTML = "";
    $.merge(pc = new RTCPeerConnection(servers, pcConstraint), {
      onicecandidate: function (e) {
        if (e.candidate == null) {
          ticketTA.value = $.compress(JSON.stringify(pc.localDescription));
          ticketTA.select()
        }
      },
      onsignalingstatechange: function () { pc.signalingState != "closed" || closeChannel() }
    });
    $.addEvent(ticketTA, "cut copy", function () {
      $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
        var adesc = new RTCSessionDescription(JSON.parse($.decompress(ticketTA.value)));
        pc.setRemoteDescription(adesc)
      }.bind(this), 0) });
      ticketInfo.innerHTML = "They need to give you their stub<br />Paste it here"
    });
    $.removeClass($("#exchange"), "hide");
    $.addClass($("#connect"), "hide");
    ticketInfo.innerHTML = "This is a ticket to enter<br />Pass it on";
    dc = $.merge( pc.createDataChannel('moonConn', {reliable: true}), { onopen: openChannel, onmessage: getMessage } );
    pc.createOffer(function (desc) { pc.setLocalDescription(desc, nilfun, nilfun) }, nilfun)
  });
  
  $.addEvent($("#connect > .redeem"), "click", function () {
    ticketTA.innerHTML = "";
    $.merge(pc = new RTCPeerConnection(servers, pcConstraint), {
      ondatachannel: function (e) { dc = $.merge(e.channel || e, {onopen: openChannel, onmessage: getMessage }) },
      onicecandidate: function (e) {
        if (e.candidate == null) {
          ticketInfo.innerHTML = "Here is your ticket stub<br />Pass it back";
          ticketTA.value = $.compress(JSON.stringify(pc.localDescription));
          ticketTA.select()
        }
      },
      onsignalingstatechange: function () { pc.signalingState != "closed" || closeChannel() }
    });
    $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
      var odesc = new RTCSessionDescription(JSON.parse($.decompress(ticketTA.value)));
      pc.setRemoteDescription(odesc, function () {
        pc.createAnswer( function (adesc) { pc.setLocalDescription(adesc) }, nilfun )
      }, nilfun)
    }.bind(this), 0) });
    $.removeClass($("#exchange"), "hide");
    $.addClass($("#connect"), "hide");
    ticketInfo.innerHTML = "You need a ticket to enter<br />Paste it here";
    ticketTA.focus()
  });
  
  function openChannel() {
    $.addClass($("#page"), "open");
    $.addClass($("#exchange"), "hide");
    $("#room > input.message-title").focus()
  }
  
  function closeChannel () {
    $.removeClass($("#page"), "open");
    $.removeClass($("#connect"), "hide");
    $("#room > .conversation").innerHTML = "";
    if (pc.signalingState != "closed") {
      action == "closed" || dc.send( JSON.stringify({ action: "closed" }) );
      pc.close()
    }
  }
  
  function getMessage(e) {
    if (e.data.charCodeAt(0) == 2) return;
    var data = JSON.parse(e.data);
    if (data.update) { updatePage(data.update) }
    else if (data.action && (action = data.action) == "closed") { closeChannel() } //TODO: test for abrupt close
  }
  
  function sendMessage() { //check message length
    var ta, payload, ts = Date.now();
    if (this.parentNode.id == "room" && (ta = $("#room > textarea.message")).value) {
      updatePage(payload = {
        items: [{
          id: "item-" + $.hash(ts + ta.value),
          timestamp: ts,
          title: $.bind(this.parentNode)("input.message-title").value,
          body: ta.value
        }]
      });
      $.bind(this.parentNode)("input.message-title").value = ""
    } else if (this.parentNode.className == "page-item" && (ta = $.bind(this.parentNode)("textarea.message")).value) {
      updatePage(payload = {
        items: [{
          id: ta.parentNode.id,
          comments: [{
            id: "comment-" + $.hash(ts + ta.value),
            timestamp: ts,
            body: ta.value
          }]
        }]
      })
    } else { return false }
    dc.send( JSON.stringify({update: payload}) );
    ta.value = ""
  }

  function updatePage(payload) { //TODO jQuery
    for (var i = 0, iE, c, j; i < payload.items.length; i++) {
      payload.items[i].comments = payload.items[i].comments || [];
      iE =
        $("#" + payload.items[i].id) ||
        (function (iE_) {$.bind(iE)("textarea.message")
          $.addAttr(iE_, {id: payload.items[i].id, timestamp: payload.items[i].timestamp});
          $.bind(iE_)(".title").innerHTML = payload.items[i].title;
          $.bind(iE_)(".body").innerHTML = payload.items[i].body;
          return iE_
        })($("#stamps > .page-item").cloneNode(true));
      for (c = 0; c < payload.items[i].comments.length; c++) {
        $.insert($.bind(iE)(".comments"), (function (cE_) {
          $.addAttr(cE_, {id: payload.items[i].comments[c].id, timestamp: payload.items[i].comments[c].timestamp}); //TODO user_data
          $.bind(cE_)("span").innerHTML = payload.items[i].comments[c].body;
          return cE_
        })($("#stamps > .item-comment").cloneNode(true)), "timestamp", function (a, b) {return a < b})
      }
      $.insert($("#room > .conversation"), iE, "timestamp", function (a, b) {return a > b});
      $.addEvent($.bind(iE)("button.send"), "click", sendMessage);
      $.addEvent($.bind(iE)("textarea.message"), "keyup", function (e) {
        if (e.keyCode == 13 && e.ctrlKey === true) sendMessage.bind(e.target)();
        return false
      });
    }
  }

}