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
  toggleClasses: function (obj) {
    var a, b, c;
    if (obj instanceof Array) {
      for (a = 0; obj[a]; a++) {
        b = obj[a][1].split(" "), c = b.length;
        while (c--) $(obj[a][0]).classList.toggle(b[c])
      }
    } else {
      for (a in obj) {
        b = obj[a].split(" "), c = b.length;
        while (c--) $(a).classList.toggle(b[c])
      }
    }
  },
  addAttr: function (el, ah) { for (var a in ah) el.setAttribute(a, ah[a]) },
  removeAttr: function (el, al) { 
    var a = al.split(" "), b = a.length;
    while (b--) el.removeAttribute(a[b])
  },
  insert: function (pe, ce, fn, gn) {
    ce.parentNode != pe || pe.removeChild(ce);
    var j = pe.childNodes.length;
    while (j > 0 && gn(fn(ce), fn(pe.childNodes[j - 1]))) j--;
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
  },
  scrolling: {
    tid: null,
    id: [],
    fn: null,
    panel: 0,
    t: 1
  },
  scrollPanel: function (n, fname, duration) {
    $.scrolling.t = 0;
    $.scrolling.fn = ({
      linear: function (t) { return t * this.endY + (1 - t) * this.startY },
      easing: function (t) {
        return t < .5 ?
          this.startY + 2 * t * t * (this.endY - this.startY) :
          this.startY - (this.endY - this.startY) * (2 * t * (t - 2) + 1)
      }
    })[fname].bind({startY: window.scrollY, endY: n * window.innerHeight});
    $.scrolling.id.push( setInterval(function (a) {
      while ($.scrolling.id[1]) clearInterval($.scrolling.id.shift());
      $.scrolling.t += 1 / this.d;
      window.scroll(0, $.scrolling.fn($.scrolling.t));
      if (Math.abs($.scrolling.t - 1) < 1e-9) {
        $.scrolling.panel = Math.floor(window.scrollY / window.innerHeight + .5);
        clearInterval($.scrolling.id.shift())
      }
    }.bind({d: (a = Math.floor(duration / 10)) > 0 ? a : 1}), 10) )
  }
});

function init() {
  var
    servers = $.ajax("stun.json"),
    pcConstraint = { optional: [{ "RtpDataChannels": false }] },
    dataConstraint = { reliable: false },
      
    pc, dc, nilfun = function () {},
    action, pageState = {},
    userState = new (function () {
      return {
        get public() {
          var state = {}, a = ["id"], b = -1;
          while (a[++b]) state[a[b]] = this[a[b]];
          return state
        }
      }
    })(),

    ticketTA = $.addEvent($("#exchange > .ticket > textarea"), "click", function () { this.select() }),
    ticketInfo = $("#exchange > .info > span"),
    messageTitle = $("#room > .new-post > .message-title"),
    messageBody = $("#room > .new-post > .message"),
    itemsWindow = $("#room > .conversation");
  
  $.addEvent(window, "resize", resize);
  resize();
  $.addEvent(window, "scroll", function () {
    if (Math.abs($.scrolling.fn($.scrolling.t) - window.scrollY - .5) < .5 && Math.abs(1 - $.scrolling.t) > 1e-9) return;
    clearInterval($.scrolling.id.shift());
    clearTimeout($.scrolling.tid);
    $.scrolling.tid = setTimeout(function () { $.scrollPanel($.scrolling.panel = Math.floor(window.scrollY / window.innerHeight + .5), "easing", 500) }, 200)
  });
  $.addEvent($("#connect > .close"), "click", closeChannel);
  $.addEvent(window, "beforeunload", closeChannel);
  $.addEvent($("#room > .open-new"), "click", function () {
    toggleNewItem();
    messageTitle.focus()
  });
  $.addEvent($("#room > .new-post > .cancel"), "click", function () {
    messageTitle.value = messageBody.value = "";
    toggleNewItem()
  });

  $.addEvent($("#room > .new-post > .send"), "click", sendMessage);
  $.addEvent(messageBody, "keyup", function (e) {
    if (e.keyCode == 13 && e.ctrlKey === true) sendMessage.bind(e.target)();
    return false
  });
  
  $.addEvent($("#connect > .create"), "click", function () {
    ticketTA.innerHTML = "";
    ticketInfo.innerHTML = "This is a ticket to enter<br />Pass it on";
    $.toggleClasses({ "#exchange": "hide", "#connect": "hide" });
    $.merge(pc = new RTCPeerConnection(servers, pcConstraint), {
      onicecandidate: function (e) {
        if (e.candidate == null) {
          userState.id = $.hash(Date.now() + pc.localDescription.sdp);
          ticketTA.value = $.compress(pc.localDescription.sdp);
          ticketTA.select()
        }
      }
    });
    $.addEvent(ticketTA, "cut copy", function () {
      $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
        var adesc = new RTCSessionDescription({sdp: $.decompress(ticketTA.value).replace(/ $/, ""), type: "answer"});
        pc.setRemoteDescription(adesc)
      }.bind(this), 0) });
      ticketInfo.innerHTML = "They need to give you their stub<br />Paste it here"
    });
    dc = $.merge( pc.createDataChannel('moonConn', {reliable: true}), { onopen: openChannel, onmessage: getMessage } );
    pc.createOffer(function (desc) { pc.setLocalDescription(desc, nilfun, nilfun) }, nilfun)
  });
  
  $.addEvent($("#connect > .redeem"), "click", function () {
    ticketTA.innerHTML = "";
    ticketInfo.innerHTML = "You need a ticket to enter<br />Paste it here";
    $.toggleClasses({ "#exchange": "hide", "#connect": "hide" });
    $.merge(pc = new RTCPeerConnection(servers, pcConstraint), {
      ondatachannel: function (e) { dc = $.merge(e.channel || e, {onopen: openChannel, onmessage: getMessage }) },
      onicecandidate: function (e) {
        if (e.candidate == null) {
          ticketInfo.innerHTML = "Here is your ticket stub<br />Pass it back";
          userState.id = $.hash(Date.now() + pc.localDescription.sdp);
          ticketTA.value = $.compress(pc.localDescription.sdp);
          ticketTA.select()
        }
      }
    });
    $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
      var odesc = new RTCSessionDescription({sdp: $.decompress(ticketTA.value).replace(/ +$/, ""), type: "offer"});
      pc.setRemoteDescription(odesc, function () {
        pc.createAnswer( function (adesc) { pc.setLocalDescription(adesc) }, nilfun )
      }, nilfun)
    }.bind(this), 0) });
    ticketTA.focus()
  });
  
  function resize () {
    $("#page > :not(#stamps)").forEach(function (e) { e.style.height = window.innerHeight + "px" });
    $.scrolling.panel = Math.floor(window.scrollY / window.innerHeight + .5);
    $.scrollPanel($.scrolling.panel, "linear", 0)
  }
  
  function toggleNewItem () {
    $.toggleClasses({
      "#room > .open-new": "hide", "#room > .conversation": "hide", "#room > .new-post > .send": "hide",
      "#room > .new-post > .cancel": "hide", "#room > .new-post": "hide"
    })
  }
  
  function openChannel() {
    $("#connect > .close").innerHTML = "Abandon " + userState.id;
    $.toggleClasses({
      "#page": "open", "#connect": "hide", "#exchange": "hide", "#room": "hide",
      "#connect > .redeem": "hide", "#connect > .close": "hide"
    });
    messageTitle.focus();
    $.scrollPanel($.scrolling.panel = 1, "easing", 500)
  }
  
  function closeChannel () {
    itemsWindow.innerHTML = ticketTA.value = "";
    $.toggleClasses({ "#page": "open", "#room": "hide active", "#connect > .redeem": "hide", "#connect > .close": "hide" });
    if (pc.signalingState != "closed") {
      if (action != "closed") dc.send( JSON.stringify({ action: "closed" }) );
      pc.close()
    }
  }
  
  function getMessage(e) {
    if (e.data.charCodeAt(0) == 2) return;
    var data = JSON.parse(e.data);
    if (data.update) { updatePage(data.update) }
    else if (data.action && (action = data.action) == "closed") { closeChannel() }
  }
  
  function sendMessage() { //check message length
    var ta, payload, ts = Date.now();
    if (this.parentNode.parentNode.id == "room" && messageBody.value) {
      updatePage(payload = {
        items: [{
          id: "item-" + $.hash(ts + messageBody.value),
          timestamp: ts,
          title: messageTitle.value,
          body: messageBody.value,
          user_data: userState.public
        }]
      });
      messageTitle.value = messageBody.value = "";
      toggleNewItem()
    } else if (this.parentNode.parentNode.className == "page-item" && (ta = $.bind(this.parentNode)(".message")).value) {
      updatePage(payload = {
        items: [{
          id: ta.parentNode.parentNode.id,
          comments: [{
            id: "comment-" + $.hash(ts + ta.value),
            timestamp: ts,
            body: ta.value,
            user_data: userState.public
          }]
        }]
      });
      ta.value = ""
    } else { return false }
    dc.send( JSON.stringify({update: payload}) );
  }

  function updatePage(payload) { //TODO jQuery
    for (var i = 0, iE, c, j; i < payload.items.length; i++) {
      payload.items[i].comments = payload.items[i].comments || [];
      iE =
        $("#" + payload.items[i].id) ||
        (function (iE_) {
          $.addAttr(iE_, {id: payload.items[i].id, timestamp: payload.items[i].timestamp});
          $.bind(iE_)(".title").innerHTML = payload.items[i].title;
          $.bind(iE_)(".body").innerHTML = payload.items[i].body;
          $.bind(iE_)(".user").innerHTML = "u:" + payload.items[i].user_data.id;
          return iE_
        })($("#stamps > .page-item").cloneNode(true));
      if (!$.bind(iE)(".comments > *") && payload.items[i].comments.length) $.bind(iE)(".comments").className = "comments";
      for (c = 0; c < payload.items[i].comments.length; c++) {
        $.insert($.bind(iE)(".comments"), (function (cE_) {
          $.addAttr(cE_, {id: payload.items[i].comments[c].id, timestamp: payload.items[i].comments[c].timestamp});
          $.bind(cE_)("span").innerHTML = payload.items[i].comments[c].body;
          $.bind(cE_)(".user").innerHTML = "u:" + payload.items[i].comments[c].user_data.id;
          return cE_
        })($("#stamps > .item-comment").cloneNode(true)), function (a) {return a.getAttribute("timestamp")}, function (a, b) {return a < b});
        if ($.bind(iE)(".posting.hide")) $.bind(iE)(".item > .unread").dataset.num++
      }
      if (!$(".conversation > *")) $("#room").className = "active";
      $.insert( itemsWindow, iE, function (a) { return ($.bind(a)(".comments > :last-child") || a).getAttribute("timestamp") }, function (a, b) {return a > b} );
      if (payload.items[i].timestamp) {
        $.addEvent($.bind(iE)(".send"), "click", sendMessage);
        $.addEvent($.bind(iE)(".message"), "keyup", function (e) {
          if (e.keyCode == 13 && e.ctrlKey === true) sendMessage.bind(e.target)();
          return false
        });
        $.addEvent($.bind(iE)(".toggle"), "click", function () {
          if (this.innerHTML == "[reply]") {
            this.innerHTML = "[minimise]";
            $.toggleClasses([["#" + this.parentNode.parentNode.id + " .posting", "hide"], ["#room > .open-new", "hide"]]);
            $.addAttr(itemsWindow, {"data-comment":""});
            $.addAttr($("#" + this.parentNode.parentNode.id), {"data-focus":""});
            $.bind(this.parentNode)(".unread").dataset.num = 0
          } else if (this.innerHTML == "[minimise]") {
            this.innerHTML = "[reply]";
            $.toggleClasses([["#" + this.parentNode.parentNode.id + " .posting", "hide"], ["#room > .open-new", "hide"]]);
            $.removeAttr(itemsWindow, "data-comment");
            $.removeAttr($("#" + this.parentNode.parentNode.id), "data-focus")
          }
        })
      }
    }
  }

}