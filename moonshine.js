RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

var models, $ = function (sel, a) { return (a = [].slice.call( (this === window ? document : this).querySelectorAll(sel) )).length > 1 ? a : a[0] };
$.merge = function (obj1, obj2) {
  var gs;
  for (var a in obj2) {
    gs = { get: Object.getOwnPropertyDescriptor(obj2, a).get, set: Object.getOwnPropertyDescriptor(obj2, a).set };
    if (gs.get || gs.set) Object.defineProperty(obj1, a, gs);
    else obj1[a] = obj2[a]
  }
  return obj1
};
$.merge($, {
  ajax: function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) return JSON.parse(xhr.responseText)
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
        if ($(obj[a][0]) === void 0) continue;
        b = obj[a][1].split(" "), c = b.length;
        while (c--) $(obj[a][0]).classList.toggle(b[c])
      }
    } else {
      for (a in obj) {
        if ($(a) === void 0) continue;
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
    ce.parentNode !== pe || pe.removeChild(ce);
    var j = pe.childNodes.length;
    while (j > 0 && gn(fn(ce), fn(pe.childNodes[j - 1]))) j--;
    j === pe.childNodes.length ? pe.appendChild(ce) : pe.insertBefore(ce, pe.childNodes[j])
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
    if (isNaN(duration)) duration = $.scrolling.duration;
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
  markdown: function (ta, style) { //TODO: escape **//``
    var r = $.escape(ta), newline = r.indexOf("\r\n") !== -1 ? "\r\n" : r.indexOf("\n") !== -1 ? "\n" : "";
    if (style === "title" && newline !== "") r = r.replace(new RegExp(" *" + newline, "g"), "");
    else if (style === "body") r = r.replace(new RegExp(" + " + newline, "g"), "<br />" + newline);
    r = r
      .replace(/\*\*(.*)\*\*/g, "<strong>$1</strong>")
      .replace(/^/," ").replace(new RegExp("([^:])//(((?!//).)*)//", "g"), "$1<em>$2</em>").replace(/^ /,"")
      .replace(/``(.*)``/g, "<code>$1</code>")
      .replace(/\[\[([^\]|]*)\]\]/g, function ($0, $1) { return "<a href='" + $1.replace(/'/g, "&apos;") + "'>" + $1 + "</a>" })
      .replace(/\[\[([^|]*)\|([^\]]*)\]\]/g, function ($0, $1, $2) { return "<a href='" + $1.replace(/'/g, "&apos;") + "'>" + $2 + "</a>" });
    for (var p = (newline === "" ? [r] : r.split(newline + newline)), i = 0; i < p.length; i++) {
      p[i] = p[i].replace(/^&gt;(.*)/g, "<blockquote>$1</blockquote>").replace(/^\\&gt;/g, "&gt;");
      if (style === "body") p[i].replace(/(.+)/g, "<p>$1</p>")
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
        var k;
        for (k in t) if ($.exporting.user.indexOf(k) === -1) return "unknown attribute(s)";
        if (!/u:[0-9a-f]{8}/.test(t.id)) return "bad id";
        return true
      };
    if ("items" in payload) {
      for (is = payload.items, i = 0, iids.pop(), cids.pop(); i < is.length; i++) {
        if ( !/item-[0-9a-f]{8}/.test(is[i].id) ) return "bad id";
        if ( "timestamp" in is[i] ) {
          if ( iids.indexOf(is[i].id) !== -1 ) return "bad id"; else iids.push(is[i].id);
          for (k in is[i]) if ( ["id", "timestamp", "title", "body", "user_data", "comments"].indexOf(k) === -1 ) return "unknown attribute(s)";
          if ( !isPosNum(is[i].timestamp) ) return "bad number";
          if ( !("title" in is[i] && "body" in is[i] && "user_data" in is[i]) ) return "attribute(s) missing";
          if ( is[i].title.length == 0 || is[i].title.length > $.charlim.title || is[i].body.length > $.charlim.body ) return "attribute(s) bad length";
          isUserData(is[i].user_data)
        };
        if ( "comments" in is[i] ) {
          for (cs = is[i].comments, c = 0; c < cs.length; c++) {
            if ( cids.indexOf(cs[c].id) !== -1 ) return "bad id"; else cids.push(cs[c].id);
            for (k in cs[c]) if ( ["id", "timestamp", "body", "user_data"].indexOf(k) === -1 ) return "unknown attribute(s)";
            if ( !("id" in cs[c] && "timestamp" in cs[c] && "body" in cs[c]) ) return "attribute(s) missing";
            if ( !/comment-[0-9a-f]{8}/.test(cs[c].id) ) return "bad id";
            if ( !isPosNum(cs[c].timestamp) ) return "bad number";
            if ( cs[c].body.length > $.charlim.body ) "attribute(s) bad length";
            isUserData(cs[c].user_data)
          }
        } else if ( !("timestamp" in is[i]) ) return "attribute(s) missing"
      }
    }
    if ("users" in payload) {
      for (us = payload.users, u = 0; u < us.length; u++) {
        if ( !/u:[0-9a-f]{8}/.test(us[u].id) ) return "bad id(s)";
      }
    }
    return "valid"
  },
  charlim: { title: 160, body: 5000 },
  initdb: function () {
    return new Promise(function (resolve) {
      var openreq = indexedDB.open("moonshine", 1);
      $.merge(openreq, {
        onsuccess: function (evt) { return resolve(openreq.result) },
        onerror: function (evt) { console.error("openDb:", evt.target.errorCode) },
        onupgradeneeded: function (evt) {
          console.log("openDb.onupgradeneeded");
          var store = evt.currentTarget.result;
          var items = store.createObjectStore( "items", { keyPath: "id" } );
          items.createIndex("by_timestamp", "timestamp", { unique: false });
          //items.createIndex("by_user_data", "user_data", { unique: false });
          var comments = store.createObjectStore( "comments", { keyPath: "id" } );
          comments.createIndex("by_timestamp", "timestamp", { unique: false });
          //comments.createIndex("by_user_data", "user_data", { unique: false });
          comments.createIndex("by_item_id", "item_id", { unique: false });
          var txns = store.createObjectStore("txns", { keyPath: "id", autoIncrement: true });
          txns.createIndex("by_timestamp", "timestamp", { unique: false });
          var users = store.createObjectStore("users", { keyPath: "id" })
        }
      })
    })
  },
  dropdb: function () {
    localStorage.clear();
    return new Promise(function (resolve) { indexedDB.deleteDatabase("moonshine").onsuccess = resolve })
  },
  exporting: {
    user: ["id"],
    page: ["room", "users"],
    txpool: ["txns"]
  },
  Models: function () {
    function state() {
      return {
        get public() {
          var state = {}, a = -1, x = $.exporting[this.klass];
          while (x[++a]) state[x[a]] = this[x[a]];
          return state
        }
      }
    }
    function user () {
      var user = {};
      return $.merge(state(), {
        klass: "user",
        get id () { return user ? user.id : null },
        set id (id) {
          if (!user.lastRefresh) user = JSON.parse( localStorage.getItem("user") ) || {};
          localStorage.setItem("user", JSON.stringify( $.merge(user, { id: id }) ));
        },
        refresh: function () {
          if (!user || !user.id) user = JSON.parse( localStorage.getItem("user") );
          else localStorage.setItem( "user", JSON.stringify(user || {}) );
          return self.user
        },
        get lastRefresh () { return !user || isNaN(user.lastRefresh) ? -1 : user.lastRefresh },
        set lastRefresh (ts) {
          if (!user || !user.id) user = JSON.parse( localStorage.getItem("user") ) || {};
          localStorage.setItem("user", JSON.stringify( $.merge(user, { lastRefresh: ts }) ));
        },
        get isFresh () {
          var tmp = JSON.parse( localStorage.getItem("user") );
          return user && tmp && user.lastRefresh >= tmp.lastRefresh
        },
        clear: function () {
          user = {};
          localStorage.clear()
        }
      })
    }
    function page () {
      var room = { items: [] }, rel = [
        { items: ["id", "timestamp", "title", "body", "user_data"] },
        { comments: ["id", "timestamp", "body", "user_data"] }
      ], getRoomStore = function (lv) {
        return $.initdb().then(function (db) {
          var l = Object.keys(rel[lv])[0], dbtx = db.transaction(l, "readwrite"), req = dbtx.objectStore(l);
          req.onerror = lv ?
            function (e) { reject(e); console.error("couldn't add comment", this.error) } :
            function (e) { reject(e); console.error("couldn't add item", this.error) };
          return req
        })
      };
      return $.merge(state(), {
        klass: "page",
        room: room,
        refresh: function (lastRefresh) {
          return getRoomStore(0).then(function (rs) {
            var diff = $.clone(room);
            diff.items = diff.items.filter(function (obj) { return obj.timestamp > lastRefresh })
              .map(function (obj) {
                if (obj.comments) obj.comments = obj.comments.filter(function (obj) { return obj.timestamp > lastRefresh });
                return obj
              });
            return new Promise(function (resolve) {
              rs.index("by_timestamp").openCursor(IDBKeyRange.lowerBound(lastRefresh || 0)).onsuccess = function (e) {
                var id, index, cursor = e.target.result;
                if (!cursor) return diff.items = diff.items.filter(Boolean);
                if ( (index = room.items.map(function (a) { return a.id }).indexOf(id = cursor.value.id)) === -1 ) {
                  room.items.push($.clone(cursor.value));
                  diff.items.push($.clone(cursor.value));
                } else if ("comments" in room.items[index]) rel[0].items.forEach(function (k, i) { !i || delete diff.items[index][k]  });
                else diff.items[index] = null;
                cursor.continue()
              };
              rs.transaction.oncomplete = function () { this.db.close(); return resolve(diff) }
            })
          }).then(function (diff) {
            return getRoomStore(1).then(function (rs) {
              return new Promise(function (resolve) {
                rs.index("by_timestamp").openCursor(IDBKeyRange.lowerBound(lastRefresh || 0)).onsuccess = function (e) {
                  function getindex (s, i) { return s.map(function (a) { return a.id }).indexOf(cursor.value[i]) }
                  var ixs, index, comment, cursor = e.target.result;
                  if (!cursor) return diff.items = diff.items.map(function (i) {
                    if (i.comments) {
                      i.comments = i.comments.filter(Boolean);
                      i.comments.length > 0 || delete i.comments
                    }
                    return i
                  }).filter(function (i) { return Object.keys(i).length > 1 });
                  ixs = { r: getindex(room.items, "item_id"), d: getindex(diff.items, "item_id") };
                  if (ixs.d === -1) ixs.d = diff.items.push({id: cursor.value.item_id}) - 1;
                  room.items[ixs.r].comments = room.items[ixs.r].comments || [];
                  diff.items[ixs.d].comments = diff.items[ixs.d].comments || [];
                  if ((index = getindex(room.items[ixs.r].comments, "id")) === -1) {
                    comment = $.clone(cursor.value);
                    delete comment.item_id;
                    room.items[ixs.r].comments.push(comment);
                    diff.items[ixs.d].comments.push(comment)
                  } else diff.items[ixs.d].comments[index] = null;
                  cursor.continue()
                }
                rs.transaction.oncomplete = function () { this.db.close(); return resolve(diff) }
              })
            })
          }).then(function (diff) {
            if (diff.items.length && lastRefresh === void 0) self.user.lastRefresh = Date.now();
            return diff
          })
        },
        update: function (payload) {
          var count = [], ids, level, flag;
          function updateLevel (branch, level, localbranch) {
            var l = Object.keys(rel[level])[0];
            if (!(l in branch) || branch[l].length === 0) return Promise.resolve(branch);
            count.unshift(0); ids = branch[l]
              .map(function (i, ix) { return [ix, i.id] })
              .sort(function (a, b) { return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0 });
            return getRoomStore(level).then(function (rs) {
              function insert (id) {
                var l = Object.keys(rel[level])[0], record = {}, recvd = branch[l][id[0]], i = 0;
                if (rel.length > level + 1) updateLevel(recvd, level + 1, localbranch[l][id[0]])
                for (; i < rel[level][l].length; i++) {
                  if (recvd[rel[level][l][i]] === void 0) return;
                  record[rel[level][l][i]] = recvd[rel[level][l][i]];
                }
                l in localbranch || (localbranch[l] = []);
                localbranch[l].push(record);
                if (level > 0) record[Object.keys(rel[level - 1])[0].replace(/s$/, "") + "_id"] = branch.id;
                rs.add(record);
                flag = true
              }
              return new Promise(function (resolve) {
                rs.openCursor().onsuccess = function (e) {
                  var cursor = e.target.result;
                  if (!cursor) { ids.filter(function (id) { return branch[l][id[0]] !== null }).map(insert); return count.shift() };
                  var key = cursor.key;
                  while (key > ids[count[0]][1]) {
                    !branch[l][ids[count[0]][0]] || insert(ids[count[0]]);
                    if (++count[0] === ids.length) { branch[l].filter(Boolean); return count.shift() }
                  }
                  if (key === ids[count[0]][1] ) {
                    if ( rel[level + 1] && !(Object.keys(rel[level + 1])[0] in branch[l][ids[count[0]][0]]) ) branch[l][ids[count[0]][0]] = null;
                    cursor.continue()
                  } else cursor.continue(ids[count[0]][1])
                };
                rs.transaction.oncomplete = function () { this.db.close(); return resolve(branch) }
              })
            }).then(function (diff) {
              if (flag) self.user.lastRefresh = Date.now();
              return diff
            })
          }
          return updateLevel(payload, 0, room)
        },
        updateR: function (payload) { return this.update(payload).then(function () { return Promise.resolve(room) }) }
      })
    }
    function txpool () {
      var rel = ["id", "timestamp", "action", "data"], lastRefresh = 0, getTxnStore = function () {
        return $.initdb().then(function (db) {
          var dbtx = db.transaction("txns", "readwrite"), req = dbtx.objectStore("txns");
          req.onerror = function() { reject(); console.error("couldn't add transaction", this.error) };
          return req
        })
      };
      return $.merge(state(), {
        klass: "txpool",
        lastRefresh: lastRefresh,
        refresh: function (room) {
          return getTxnStore().then(function (ts) {
            return new Promise(function (resolve) {
              ts.openCursor(IDBKeyRange.lowerBound(lastRefresh)).onsuccess = function (e) {
                var cursor = e.target.result, record;
                if (!cursor) {
                  //if (self.user) self.user.lastRefresh = Date.now()
                  return Promise.resolve(room);
                }
                if ((record = cursor.value).action === "create") {
                  if (self.page) return self.page.updateR(record.data);
                  else return
                }
                cursor.continue();
                lastRefresh = Date.now()
              }
              ts.transaction.oncomplete = function ()  { this.db.close(); return resolve(room) }
            })
          })
        }
      })
    }
    var self;
    return self = { //TODO: group everything into MVC,
      user: user(),
      page: page(),
      txpool: txpool()
    }
  },
  clone: function (obj) { return JSON.parse(JSON.stringify(obj)) },
  usersdiff: function () {
    var arrays = Array.prototype.slice.call(arguments);
    return arrays.shift().filter(function(v) {
      return arrays.every(function(a) {
        return a.filter(function(b) {
          return b.id === v.id
        }).length === 0;
      })
    })
  },
  usersisct: function () {
    var arrays = Array.prototype.slice.call(arguments);
    return arrays.shift().filter(function(v) {
      return arrays.every(function(a) {
        return a.filter(function(b) {
          return b.id !== v.id
        }).length === 0;
      })
    })
  }
});

function init() {
  var
    servers = $.ajax("stun.json"),
    pcConstraint = { optional: [{ "RtpDataChannels": false }] },
    dataConstraint = { reliable: false },
    
    pc = [], dc = [], pcw, dcw, nilfun = function () {},// models,
    
    ticketTA = $.addEvent($("#exchange > .ticket > textarea"), "click", function () { this.select() }),
    ticketInfo = $("#exchange > .info > span"),
    messageTitle = $("#room > .new-post > .message-title"),
    messageBody = $("#room > .new-post > .message"),
    itemsWindow = $("#room > .conversation"),
    userList = $("#users > .list");
  
  $.addEvent($("#connect > .close"), "click", closeChannel);
  if (this === window) $.addEvent(window, "beforeunload", closeChannel);
  
  $.addEvent(window, "resize", function() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { resolve(); window.dispatchEvent(new CustomEvent("opresize")) })
    })
  });  
  $.addEvent(window, "opresize", resize);
  resize();
  $.addEvent(window, "scroll", function () {
    if (!$.scrolling.fn) return;
    if (Math.abs($.scrolling.fn($.scrolling.t) - window.scrollY - .5) < 1 && Math.abs(1 - $.scrolling.t) > 1e-9) return;
    if (window.scrollY % window.innerHeight === 0 && Math.abs(1 - $.scrolling.t) < 1e-9) return;
    clearInterval($.scrolling.id.shift());
    clearTimeout($.scrolling.tid);
    $.scrolling.tid = setTimeout(function () {
      $.scrollPanel($.scrolling.panel = Math.floor(window.scrollY / window.innerHeight + .5), "easing")
    }, 200)
  });
  $.addEvent(window, "keydown", function (e) {
    if (e.keyCode === 33 && $.scrolling.panel > 0) {
      window.scroll(0, (--$.scrolling.panel) * window.innerHeight);
      e.preventDefault()
    };
    if (e.keyCode === 34 && $.scrolling.panel < $("body").scrollHeight/window.innerHeight - 1) {
      window.scroll(0, (++$.scrolling.panel) * window.innerHeight);
      e.preventDefault()
    }
  });
  
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
    if (e.keyCode === 13 && e.ctrlKey === true) sendMessage.bind(e.target)();
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
        if (e.candidate === null) {
          if (!models.user.id) models.user.id = "u:" + $.hash(Date.now() + this.localDescription.sdp);
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
    pc[0].createOffer(function (desc) { pc[0].setLocalDescription(desc, nilfun, nilfun) }, nilfun);
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
          models.user.id = "u:" + $.hash(Date.now() + this.localDescription.sdp);
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
  
  $.addEvent(window, "storage", function () {
    var lr = models.user.lastRefresh;
    if (Date.now() - lr > 100 && !models.user.isFresh) {
      models.user.refresh();
      models.page.refresh(lr).then(function (payload) {
        updatePage(payload);
        broadcastMsg(payload)
      });
    }
  });
  initModels();
  function initModels() {
    return new Promise(function (resolve, reject) {
      models = $.Models();
      return models.user.refresh().lastRefresh === -1 ? reject() : resolve()
    }).then(models.page.refresh).then(function (room) {
      return models.txpool.refresh(room)
    }).then(function (room) {
      openRoom();
      $.scrollPanel($.scrolling.panel = 1, "easing");
      updatePage(room)
    }).catch(function () {
      models.user.lastRefresh = Date.now()
    })
  }
  
  function resize () {
    var xh = parseInt($("#page > :first-child").style.height), xs = window.scrollY;
    $("#page > :not(#stamps)").forEach(function (e) { e.style.height = window.innerHeight + "px" });
    if (Math.abs(1 - $.scrolling.t) < 1e-9) window.scroll(0, $.scrolling.panel * window.innerHeight);
    else {
      window.scroll(0, xs / xh * window.innerHeight);
      $.scrollPanel($.scrolling.panel, "easing")
    }
  }
  
  function toggleNewItem () {
    $.toggleClasses({
      "#room > .open-new": "hide", "#room > .conversation": "hide", "#room > .new-post > .send": "hide",
      "#room > .new-post > .cancel": "hide", "#room > .new-post": "hide"
    })
  }
  
  function openChannel () {
    if (dc.length === 1) {
      dc[0].send( JSON.stringify({ sharestate: { users: [models.user.public] }, action: "open" }) );
      if (pc[0].ondatachannel !== null) requestConn();
      if (!$("#page").classList.contains("open")) openRoom()
      $.toggleClasses({ "#connect": "hide", "#exchange": "hide" });
    } else {
      dc[0].send( JSON.stringify({ sharestate: { users: models.page.users }, action: "open" }) );
      $.toggleClasses({ "#connect": "hide", "#exchange": "hide" })
    }
    $.scrollPanel($.scrolling.panel = 1, "easing");
    if (models.page.room.length !== 0) {
      this.send( JSON.stringify({ update: models.page.room }) )
    }
  }
  
  function openRoom () {
    updatePage({ users: (models.page.users = [models.user.public]) });
    $("#connect > .close").innerHTML = "Abandon " + models.user.id;
    $.toggleClasses({
      "#page": "open", "#room": "hide", "#users": "hide",
      "#connect > .redeem": "hide", "#connect > .close": "hide"
    });
  }
  
  function closeChannel (e) {
    $.toggleClasses({ "#page": "open", "#room": "hide", "#users": "hide", "#connect > .redeem": "hide", "#connect > .close": "hide" });
    $.removeAttr(itemsWindow, "data-comment");
    $("#room").classList.remove("active");
    ticketTA.value = itemsWindow.innerHTML = userList.innerHTML = "";

    if (this.constructor.name === "RTCDataChannel") closeConn([this]);
    if (dc.length !== 0 && dc[0].readyState === "open") {
      for (var i = 0; i < dc.length; i++) if (dc[i] !== this) dc[i].send( JSON.stringify({
        sharestate: { users: [models.user.public] },
        action: "close"
      }) );
      closeConn(dc)
    }
    e && e.type === "beforeunload" ? models.user.clear() : initModels()
  }
  
  function closeConn (is) {
    for (var i = 0, j; i < is.length; i++) {
      if (is[i].readyState !== "closed") is[i].close();
      pc[j = dc.indexOf(is[i])] = dc[j] = false;
    }
    pc = pc.filter(Boolean);
    dc = dc.filter(Boolean);
    if (pc.length === 1) requestConn();
  }
  
  function requestConn () {
    pcw = new RTCPeerConnection(servers, pcConstraint);
    pcw.onicecandidate = function (e) {
      if (e.candidate === null) dc[0].send( JSON.stringify({ sdp: this.localDescription.sdp, action: "req-offer" }) )
    };
    dcw = $.merge(pcw.createDataChannel('moonConn', {reliable: true}), {
      onmessage: getMessage,
      onopen: function () {
        dc.unshift(dcw);
        dcw = null;
        dc[0].send( JSON.stringify({ sharestate: { users: [models.user.public] }, action: "open" }) );
      }
    });
    pcw.createOffer(function (desc) { pcw.setLocalDescription(desc, nilfun, nilfun) }, nilfun)
  }
  
  function respondConn (sdp) {
    pcw = new RTCPeerConnection(servers, pcConstraint);
    $.merge(pcw, {
      ondatachannel: function (e) {
        pc.unshift(pcw);
        pcw = null;
        dc.unshift($.merge(e.channel || e, { onmessage: getMessage }))
        dc[0].send( JSON.stringify({ sharestate: { users: [models.user.public] }, action: "open" }) )
      },
      onicecandidate: function (e) {
        if (e.candidate === null) models.page.relayc.send( JSON.stringify({ sdp: this.localDescription.sdp, action: "req-answer" }) )
      }
    });
    pcw.setRemoteDescription(new RTCSessionDescription({sdp: sdp, type: "offer"}), function () {
      pcw.createAnswer( function (adesc) { pcw.setLocalDescription(adesc) }, nilfun )
    }, nilfun)
  }
  
  function getMessage (e) {
    if (e.data.charCodeAt(0) === 2) return;
    var data = JSON.parse(e.data), i = 0;
    if ("update" in data) {
      models.page.update(data.update)
        .then(function (update) {
          for (updatePage(update); i < dc.length; i++) if (dc[i] !== this) dc[i].send( JSON.stringify({ update: update }) ) //don't send nothing
        }.bind(this))
    } else if ("sharestate" in data && "action" in data) {
      if (data.action === "open") {
        var i, diff = $.usersdiff(data.sharestate.users, models.page.users);
        if (diff.length > 0) {
          models.page.users = models.page.users.concat(diff);
          for (updatePage({ users: diff }); i < dc.length; i++) if (dc[i] !== this) dc[i].send( JSON.stringify({
            sharestate: { users: diff },
            action: "open"
          }) )
        }
      } else if (data.action === "close" || data.action === "remove") {
        var i, isct = $.usersisct(models.page.users, data.sharestate.users);
        if (isct.length > 0) {
          models.page.users = $.usersdiff(models.page.users, isct);
          for (updatePage({ users: isct }); i < dc.length; i++) if (dc[i] !== this) dc[i].send( JSON.stringify({
            sharestate: { users: isct },
            action: "remove"
          }) )
        }
        if (data.action === "close") closeConn([this])
      }
    } else if ("sdp" in data && "action" in data) {
      if (data.action === "req-offer") {
        if (pc.length === 1) {
          this.send( '{"sdp":"","action":"req-relaya"}' )
        } else {
          models.page.relayc = this;
          (dc[0] === this ? dc[1] : dc[0]).send( JSON.stringify({ sdp: data.sdp, action:"req-relayo" }) )
        }
      } else if (data.action === "req-relayo") {
          models.page.relayc = this;
          respondConn(data.sdp);
      } else if (data.action === "req-answer") {
        models.page.relayc.send( JSON.stringify({ sdp: data.sdp, action:"req-relaya" }) )
      } else if (data.action === "req-relaya") {
        if (data.sdp.length !== 0) {
          pc.unshift(pcw);
          pc[0].setRemoteDescription(new RTCSessionDescription( {sdp: data.sdp, type: "answer"} ))
        }
        pcw = null
      }
    }
  }
  
  function sendMessage () {
    var ta, payload, ts = Date.now();
    if (this.parentNode.parentNode.id === "room" && messageBody.value) {
      if (messageTitle.value.length > $.charlim.title || messageBody.value.length > $.charlim.body) return false
      updatePage(payload = {
        items: [{
          id: "item-" + $.hash(ts + messageBody.value),
          timestamp: ts,
          title: messageTitle.value,
          body: messageBody.value,
          user_data: models.user.public
        }]
      });
      messageTitle.value = messageBody.value = "";
      toggleNewItem()
    } else if (this.parentNode.parentNode.className === "page-item" && (ta = $.bind(this.parentNode)(".message")).value) {
      if (ta.value.length > $.charlim.body) return false
      updatePage(payload = {
        items: [{
          id: ta.parentNode.parentNode.id,
          comments: [{
            id: "comment-" + $.hash(ts + ta.value),
            timestamp: ts,
            body: ta.value,
            user_data: models.user.public
          }]
        }]
      });
      ta.value = ""
    } else return false;
    models.page.update(payload);
    broadcastMsg(payload)
  }
  
  function broadcastMsg (payload) { for (var i = 0; i < dc.length; i++) dc[i].send( JSON.stringify({update: payload}) ) }

  function updatePage (payload) {
    var vm = $.validate(payload);
    if (vm !== "valid") {
      var bad = JSON.stringify(payload);
      console.log("bad message " + bad.length + " bytes: " + vm);
      if (bad.length < 65536) console.log(bad);
      return
    }
    if ("items" in payload) {
      for (var i = 0, iE, c, j; i < payload.items.length; i++) {
        iE =
          $("#" + payload.items[i].id) ||
          (function (iE_) {
            $.addAttr(iE_, {id: payload.items[i].id, timestamp: payload.items[i].timestamp});
            $.bind(iE_)(".title").innerHTML = $.markdown(payload.items[i].title, "title");
            $.bind(iE_)(".body").innerHTML = $.markdown(payload.items[i].body, "body");
            $.bind(iE_)(".user-id").innerHTML = payload.items[i].user_data.id;
            $.addAttr($.bind(iE_)(".user-id"), { "data-user": payload.items[i].user_data.id });
            if (models.page.users.map(function (u) { return u.id }).indexOf(payload.items[i].user_data.id) === -1) {
              $.bind(iE_)(".user-id").classList.add("abandoned")
            }
            return iE_
          })($("#stamps > .page-item").cloneNode(true));
        if ("comments" in payload.items[i]) {
          if (!$.bind(iE)(".comments > *") || $.bind(iE)(".form.hide")) $.bind(iE)(".comments").className = "comments";
          for (c = 0; c < payload.items[i].comments.length; c++) {
            $.insert($.bind(iE)(".comments"), (function (cE_) {
              $.addAttr(cE_, {id: payload.items[i].comments[c].id, timestamp: payload.items[i].comments[c].timestamp});
              $.bind(cE_)(".body").innerHTML = $.markdown(payload.items[i].comments[c].body, "body");
              $.bind(cE_)(".user-id").innerHTML = payload.items[i].comments[c].user_data.id;
              $.addAttr($.bind(cE_)(".user-id"), { "data-user": payload.items[i].comments[c].user_data.id });
              return cE_
            })($("#stamps > .item-comment").cloneNode(true)), function (a) {return a.getAttribute("timestamp")}, function (a, b) {return a < b});
            if ($.bind(iE)(".form.hide")) $.bind(iE)(".item > .unread").dataset.num++
          }
        }
        if (!$(".conversation > *")) $.toggleClasses({"#room": "active"});
        $.insert( itemsWindow, iE, function (a) { return ($.bind(a)(".comments > :last-child") || a).getAttribute("timestamp") }, function (a, b) {return a > b} );
        if ("timestamp" in payload.items[i]) {
          $.bind(iE)(".message").setAttribute("maxlength", $.charlim.body);
          $.addEvent($.bind(iE)(".send"), "click", sendMessage);
          $.addEvent($.bind(iE)(".message"), "keyup", function (e) {
            if (e.keyCode === 13 && e.ctrlKey === true) sendMessage.bind(e.target)();
            return false
          });
          $.addEvent($.bind(iE)(".toggle"), "click", function () {
            if (this.innerHTML === "[reply]") {
              this.innerHTML = "[minimise]";
              $.toggleClasses([["#" + this.parentNode.parentNode.id + " .form", "hide"], ["#room > .open-new", "hide"]]);
              $.addAttr(itemsWindow, {"data-comment":""});
              $.addAttr($("#" + this.parentNode.parentNode.id), {"data-focus":""});
              $.bind(this.parentNode)(".unread").dataset.num = 0
            } else if (this.innerHTML === "[minimise]") {
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
      for (var i = 0, u; i < payload.users.length; i++) {
        if ( u = $("#" + payload.users[i].id.replace(/:/, "\\:")) ) {
          userList.removeChild(u);
          $.toggleClasses([[".conversation .user-id[data-user='" + payload.users[i].id + "']", "abandoned"]])
        } else {
          $.insert( userList, (function (uE_) {
            $.addAttr(uE_, {id: payload.users[i].id});
            if (payload.users[i].id === models.user.id) $.addAttr(uE_, {"data-self":""});
            $.bind(uE_)(".user-id").innerHTML = payload.users[i].id;
            return uE_
          })($("#stamps > .connected-user").cloneNode(true)), function (a) { return parseInt(a.getAttribute("id").slice(2, 10), 16) }, function (a, b) {return a < b} );
        }
      }
    }
  }

}