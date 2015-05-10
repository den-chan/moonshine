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
      if (xhr.readyState == 4 && xhr.status == 200) return JSON.parse(xhr.responseText)
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
    for (var hash = 0, i = 0, hs; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i) >>> 0;
    hs = hash.toString(16);
    return Array(9 - hs.length).join("0") + hs
  },
  scrolling: {
    tid: null,
    id: [],
    fn: null,
    panel: 0,
    t: 1,
    duration: 500
  },
  scrollPanel: function (n, fname, duration) {
    var a;
    $.scrolling.t = 0;
    $.scrolling.fn = ({
      linear: function (t) { return t * this.endY + (1 - t) * this.startY },
      easing: function (t) {
        return t < .5 ?
          this.startY + 2 * t * t * (this.endY - this.startY) :
          this.startY - (2 * t * (t - 2) + 1) * (this.endY - this.startY)
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
  },
  markdown: function (ta) { //TODO: escape **//``
    var r = $.escape(ta), newline = r.indexOf("\r\n") != -1 ? "\r\n" : r.indexOf("\n") != -1 ? "\n" : "";
    r = r
      .replace(new RegExp(" + " + newline, "g"), "<br />" + newline)
      .replace(/\*\*(.*)\*\*/g, "<strong>$1</strong>")
      .replace(/^/," ").replace(new RegExp("([^:])//(((?!//).)*)//", "g"), "$1<em>$2</em>").replace(/^ /,"")
      .replace(/``(.*)``/g, "<code>$1</code>")
      .replace(/\[\[([^\]|]*)\]\]/g, function ($0, $1) { return "<a href='" + $1.replace(/'/g, "&apos;") + "'>" + $1 + "</a>" })
      .replace(/\[\[([^|]*)\|([^\]]*)\]\]/g, function ($0, $1, $2) { return "<a href='" + $1.replace(/'/g, "&apos;") + "'>" + $2 + "</a>" });
    for (var p = (newline == "" ? [r] : r.split(newline + newline)), i = 0; i < p.length; i++) {
      p[i] = p[i]
        .replace(/^&gt;(.*)/g, "<blockquote>$1</blockquote>").replace(/^\\&gt;/g, "&gt;")
        .replace(/(.+)/g, "<p>$1</p>")
    }
    r = p.join(newline);
    return r
  },
  escape: function (text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML
  },
  validate: function (payload) {
    var
      is, i, cs, c, us, u, pi = $(".page-item"), ic = $(".item-comment"),
      iids = (pi instanceof Array ? pi.map(function (e) {return e.id}) : [pi.id]),
      cids = (ic instanceof Array ? ic.map(function (e) {return e.id}) : [ic.id]),
      isPosNum = function (t) { return !isNaN(parseFloat(t)) && isFinite(t) && Math.abs(t) <= Math.pow(2, 53) - 1 && t > 0 },
      isUserData = function (t) {
        var k, u = new $.State("Local");
        for (k in t) if (u.exporting.indexOf(k) == -1) return false;
        if (!/u:[0-9a-f]{8}/.test(t.id)) return false;
        return true
      };
    if ("items" in payload) {
      for (is = payload.items, i = 0, iids.pop(), cids.pop(); i < is.length; i++) {
        if ( !/item-[0-9a-f]{8}/.test(is[i].id) ) return false;
        if ("timestamp" in is[i]) {
          if (iids.indexOf(is[i].id) != -1) return false; else iids.push(is[i].id);
          for (k in is[i]) if (["id", "timestamp", "title", "body", "user_data", "comments"].indexOf(k) == -1) return false;
          if (!(
            isPosNum(is[i].timestamp) &&
            "title" in is[i] && is[i].title.length > 0 && is[i].title.length < $.charlim.title &&
            "body" in is[i] && is[i].body.length < $.charlim.body &&
            isUserData(is[i].user_data)
          )) return false;
        };
        if ("comments" in is[i]) {
          for (cs = is[i].comments, c = 0; c < cs.length; c++) {
            if (cids.indexOf(cs[c].id) != -1) return false; else cids.push(cs[c].id);
            for (k in cs[c]) if (["id", "timestamp", "body", "user_data"].indexOf(k) == -1) return false;
            if (!(
              "id" in cs[c] && /comment-[0-9a-f]{8}/.test(cs[c].id) &&
              "timestamp" in cs[c] && isPosNum(cs[c].timestamp) &&
              "body" in cs[c] && cs[c].body.length < $.charlim.body &&
              isUserData(cs[c].user_data)
            )) return false;
          }
        }
      }
    }
    if ("users" in payload) {
      for (us = payload.users, u = 0; u < us.length; u++) {
        if ( !/u:[0-9a-f]{8}/.test(us[u].id) ) return false;
      }
    }
    return true
  },
  charlim: { title: 160, body: 5000 },
  State: function (type) {
    var exporting = ({Local: ["id"], Remote: ["users"]})[type];
    return {
      get public() {
        var state = {}, a = -1;
        while (exporting[++a]) state[exporting[a]] = this[exporting[a]];
        return state
      },
      exporting: exporting
    }
  },
  usersdiff: function () {
    var arrays = Array.prototype.slice.call(arguments);
    return arrays.shift().filter(function(v) {
      return arrays.every(function(a) {
        return a.filter(function(b) {
          return b.id == v.id
        }).length == 0;
      })
    })
  }
});

function init() {
  var
    servers = $.ajax("stun.json"),
    pcConstraint = { optional: [{ "RtpDataChannels": false }] },
    dataConstraint = { reliable: false },
    
    pc = [], dc = [], nilfun = function () {}, action,
    pageState = new $.State("Remote"),
    userState = new $.State("Local"),
    
    ticketTA = $.addEvent($("#exchange > .ticket > textarea"), "click", function () { this.select() }),
    ticketInfo = $("#exchange > .info > span"),
    messageTitle = $("#room > .new-post > .message-title"),
    messageBody = $("#room > .new-post > .message"),
    itemsWindow = $("#room > .conversation");
  
  (function () {
    var running = false;
    $.addEvent(window, "resize", function() {
      if (running) return;
      running = true;
      requestAnimationFrame(function() {
        window.dispatchEvent(new CustomEvent("opresize"));
        running = false;
      });
    });
  })();
  $.addEvent(window, "opresize", resize);
  resize();
  $.addEvent(window, "scroll", function () {
    if (Math.abs($.scrolling.fn($.scrolling.t) - window.scrollY - .5) < 1 && Math.abs(1 - $.scrolling.t) > 1e-9) return;
    if (window.scrollY % window.innerHeight == 0 && Math.abs(1 - $.scrolling.t) < 1e-9) return;
    clearInterval($.scrolling.id.shift());
    clearTimeout($.scrolling.tid);
    $.scrolling.tid = setTimeout(function () { $.scrollPanel($.scrolling.panel = Math.floor(window.scrollY / window.innerHeight + .5), "easing", $.scrolling.duration) }, 200)
  });
  $.addEvent(window, "keydown", function (e) {
    if (e.keyCode == 33 && $.scrolling.panel > 0) {
      window.scroll(0, (--$.scrolling.panel) * window.innerHeight);
      e.preventDefault()
    };
    if (e.keyCode == 34 && $.scrolling.panel < $("body").scrollHeight/window.innerHeight - 1) {
      window.scroll(0, (++$.scrolling.panel) * window.innerHeight);
      e.preventDefault()
    }
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
  messageTitle.setAttribute("maxlength", $.charlim.title);
  messageBody.setAttribute("maxlength", $.charlim.body);
  
  $.addEvent($("#connect > .create"), "click", function () {
    ticketTA.innerHTML = "";
    ticketInfo.innerHTML = "This is a ticket to enter<br />Pass it on";
    $.toggleClasses({ "#exchange": "hide", "#connect": "hide" });
    pc.unshift(new RTCPeerConnection(servers, pcConstraint));
    $.merge(pc[0], {
      onicecandidate: function (e) {
        if (e.candidate == null) {
          userState.id = userState.id || "u:" + $.hash(Date.now() + this.localDescription.sdp);
          ticketTA.value = $.compress(this.localDescription.sdp);
          ticketTA.select()
        }
      }
    });
    $.addEvent(ticketTA, "cut copy", function () {
      $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
        var adesc = new RTCSessionDescription({sdp: $.decompress(ticketTA.value).replace(/ $/, ""), type: "answer"});
        pc[0].setRemoteDescription(adesc)
      }.bind(this), 0) });
      ticketInfo.innerHTML = "They need to give you their stub<br />Paste it here"
    });
    dc.unshift($.merge( pc[0].createDataChannel('moonConn', {reliable: true}), { onopen: openChannel, onmessage: getMessage } ));
    pc[0].createOffer(function (desc) { pc[0].setLocalDescription(desc, nilfun, nilfun) }, nilfun)
  });
  
  $.addEvent($("#connect > .redeem"), "click", function () {
    ticketTA.innerHTML = "";
    ticketInfo.innerHTML = "You need a ticket to enter<br />Paste it here";
    $.toggleClasses({ "#exchange": "hide", "#connect": "hide" });
    pc.unshift(new RTCPeerConnection(servers, pcConstraint));
    $.merge(pc[0], {
      ondatachannel: function (e) { dc.unshift($.merge(e.channel || e, {onopen: openChannel, onmessage: getMessage })) },
      onicecandidate: function (e) {
        if (e.candidate == null) {
          ticketInfo.innerHTML = "Here is your ticket stub<br />Pass it back";
          userState.id = "u:" + $.hash(Date.now() + this.localDescription.sdp);
          ticketTA.value = $.compress(this.localDescription.sdp);
          ticketTA.select()
        }
      }
    });
    $.addEvent(ticketTA, "paste", function () { setTimeout(function () {
      var odesc = new RTCSessionDescription({sdp: $.decompress(ticketTA.value).replace(/ +$/, ""), type: "offer"});
      pc[0].setRemoteDescription(odesc, function () {
        pc[0].createAnswer( function (adesc) { pc[0].setLocalDescription(adesc) }, nilfun )
      }, nilfun)
    }.bind(this), 0) });
    ticketTA.focus()
  });
  
  function resize () {
    var xh = parseInt($("#page > :first-child").style.height), xs = window.scrollY;
    $("#page > :not(#stamps)").forEach(function (e) { e.style.height = window.innerHeight + "px" });
    if (Math.abs(1 - $.scrolling.t) < 1e-9) window.scroll(0, $.scrolling.panel * window.innerHeight);
    else {
      window.scroll(0, xs / xh * window.innerHeight);
      $.scrollPanel($.scrolling.panel, "easing", $.scrolling.duration)
    }
  }
  
  function toggleNewItem () {
    $.toggleClasses({
      "#room > .open-new": "hide", "#room > .conversation": "hide", "#room > .new-post > .send": "hide",
      "#room > .new-post > .cancel": "hide", "#room > .new-post": "hide"
    })
  }
  
  function openChannel() {
    if (dc.length == 1) {
      pageState.users = [];
      dc[0].send( JSON.stringify({ sharestate: { users: [userState.public] } }) );
      updatePage({ users: [userState.public] });
      ticketTA.value = "";
      $("#connect > .close").innerHTML = "Abandon " + userState.id;
      $.toggleClasses({
        "#page": "open", "#connect": "hide", "#exchange": "hide", "#room": "hide", "#users": "hide",
        "#connect > .redeem": "hide", "#connect > .close": "hide"
      });
      messageTitle.focus()
    } else {
      dc[0].send( JSON.stringify({ sharestate: { users: pageState.users } }) );
      $.toggleClasses({ "#connect": "hide", "#exchange": "hide" })
    }
    $.scrollPanel($.scrolling.panel = 1, "easing", $.scrolling.duration)
  }
  
  function closeChannel () {
    itemsWindow.innerHTML = "";
    $.toggleClasses({
      "#page": "open", "#room": "hide active", "#users": "hide",
      "#connect > .redeem": "hide", "#connect > .close": "hide"
    });
    for (var i = 0; i < pc.length; i++) {
      if (pc[i].signalingState != "closed") {
        if (action != "closed") dc[i].send('{"action":"closed"}');
        pc[i].close()
      }
    }
    dc = pc = []
  }
  
  function getMessage(e) {
    if (e.data.charCodeAt(0) == 2) return;
    var data = JSON.parse(e.data);
    if (data.update) {
      var i = 0;
      for (updatePage(data.update); i < dc.length; i++) if (dc.indexOf(this) !== i) dc[i].send(e.data)
    } else if (data.action) {
      if ((action = data.action) == "closed") closeChannel();
    } else if (data.sharestate) {
      var i, diff = $.usersdiff(data.sharestate.users, pageState.users);
      if (diff.length > 0 ) {
        for (updatePage({ users: diff }), i = 0; i < dc.length; i++) dc[i].send( JSON.stringify({sharestate: { users: diff }}) )
      }
    }
  }
  
  function sendMessage() { //check message length
    var ta, payload, ts = Date.now(), i = 0;
    if (this.parentNode.parentNode.id == "room" && messageBody.value) {
      if (messageTitle.value.length > $.charlim.title || messageBody.value.length > $.charlim.body) return false
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
      if (ta.value.length > $.charlim.body) return false
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
    } else return false;
    for (; i < dc.length; i++) dc[i].send( JSON.stringify({update: payload}) );
  }

  function updatePage(payload) { //TODO jQuery
    if (!$.validate(payload)) {
      var bad = JSON.stringify(payload);
      console.log("bad message " + bad.length + " bytes");
      if (bad.length < 65536) console.log(bad);
      return
    }
    if ("items" in payload) {
      for (var i = 0, iE, c, j; i < payload.items.length; i++) {
        payload.items[i].comments = payload.items[i].comments || [];
        iE =
          $("#" + payload.items[i].id) ||
          (function (iE_) {
            $.addAttr(iE_, {id: payload.items[i].id, timestamp: payload.items[i].timestamp});
            $.bind(iE_)(".title").innerHTML = $.escape(payload.items[i].title);
            $.bind(iE_)(".body").innerHTML = $.markdown(payload.items[i].body);
            $.bind(iE_)(".user-id").innerHTML = payload.items[i].user_data.id;
            return iE_
          })($("#stamps > .page-item").cloneNode(true));
        if (!$.bind(iE)(".comments > *") && payload.items[i].comments.length) $.bind(iE)(".comments").className = "comments";
        for (c = 0; c < payload.items[i].comments.length; c++) {
          $.insert($.bind(iE)(".comments"), (function (cE_) {
            $.addAttr(cE_, {id: payload.items[i].comments[c].id, timestamp: payload.items[i].comments[c].timestamp});
            $.bind(cE_)("span").innerHTML = $.markdown(payload.items[i].comments[c].body);
            $.bind(cE_)(".user-id").innerHTML = payload.items[i].comments[c].user_data.id;
            return cE_
          })($("#stamps > .item-comment").cloneNode(true)), function (a) {return a.getAttribute("timestamp")}, function (a, b) {return a < b});
          if ($.bind(iE)(".form.hide")) $.bind(iE)(".item > .unread").dataset.num++
        }
        if (!$(".conversation > *")) $("#room").className = "active";
        $.insert( itemsWindow, iE, function (a) { return ($.bind(a)(".comments > :last-child") || a).getAttribute("timestamp") }, function (a, b) {return a > b} );
        if ("timestamp" in payload.items[i]) {
          $.bind(iE)(".message").setAttribute("maxlength", $.charlim.body);
          $.addEvent($.bind(iE)(".send"), "click", sendMessage);
          $.addEvent($.bind(iE)(".message"), "keyup", function (e) {
            if (e.keyCode == 13 && e.ctrlKey === true) sendMessage.bind(e.target)();
            return false
          });
          $.addEvent($.bind(iE)(".toggle"), "click", function () {
            if (this.innerHTML == "[reply]") {
              this.innerHTML = "[minimise]";
              $.toggleClasses([["#" + this.parentNode.parentNode.id + " .form", "hide"], ["#room > .open-new", "hide"]]);
              $.addAttr(itemsWindow, {"data-comment":""});
              $.addAttr($("#" + this.parentNode.parentNode.id), {"data-focus":""});
              $.bind(this.parentNode)(".unread").dataset.num = 0
            } else if (this.innerHTML == "[minimise]") {
              this.innerHTML = "[reply]";
              $.toggleClasses([["#" + this.parentNode.parentNode.id + " .form", "hide"], ["#room > .open-new", "hide"]]);
              $.removeAttr(itemsWindow, "data-comment");
              $.removeAttr($("#" + this.parentNode.parentNode.id), "data-focus")
            }
          })
        }
      }
    }
    if ("users" in payload) {
      for (var i = 0, uE; i < payload.users.length; i++) {
        uE =
          $("#" + payload.users[i].id.replace(/:/, "\\:")) ||
          (function (uE_) {
            pageState.users.push(payload.users[i]);
            $.addAttr(uE_, {id: payload.users[i].id});
            if (payload.users[i].id == userState.id) $.addAttr(uE_, {"data-self":""});
            $.bind(uE_)(".user-id").innerHTML = payload.users[i].id;
            return uE_
          })($("#stamps > .connected-user").cloneNode(true));
        $.insert( $("#users > .list"), uE, function (a) { return parseInt(a.getAttribute("id").slice(2, 10), 16) }, function (a, b) {return a < b} );
      }
    }
  }

}