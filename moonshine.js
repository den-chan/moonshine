RTCPeerConnection =
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection;

var $ = document.querySelector.bind(document);
$.ajax = function(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4 && xhr.status == 200) {
      return JSON.parse(xhr.responseText)
    }
  };
  xhr.send();
}

function init() {
  var
    servers = $.ajax("stun.json"),
    pcConstraint = {
      optional: [{
        RtpDataChannels: true
      }]
    },
    dataConstraint = {
      reliable: false
    },
    localConnection,
    remoteConnection,
    sendChannel,
    receiveChannel,
    dataChannelSend = $("#serial-chat > input.message"),
    dataChannelReceive = $("#serial-chat > div.conversation"),
    messageStamp = function (data, msg) {
      (msg = $("#stamps > .chat-message").cloneNode(true)).innerHTML = data;
      return msg
    },
    sendButton = $("#serial-chat > button.send");
  sendButton.onclick = function (event) {
    var data = dataChannelSend.value;
    sendChannel.send(data);
    dataChannelSend.value = ""
  };

  localConnection = new RTCPeerConnection(servers, pcConstraint);
  localConnection.onicecandidate = function(event) {
    if (event.candidate) remoteConnection.addIceCandidate(event.candidate)
  };
  sendChannel = localConnection.createDataChannel("sendDataChannel", dataConstraint);

  remoteConnection = new RTCPeerConnection(servers, pcConstraint);
  remoteConnection.onicecandidate = function(event) {
    if (event.candidate) localConnection.addIceCandidate(event.candidate)
  };
  remoteConnection.ondatachannel = function(event1) {
    receiveChannel = event1.channel;
    receiveChannel.onmessage = function(event2) {
      dataChannelReceive.appendChild(messageStamp(event2.data))
    }
  };
  localConnection.createOffer(function(desc1) {
    localConnection.setLocalDescription(desc1);
    remoteConnection.setRemoteDescription(desc1);
    remoteConnection.createAnswer(function(desc2) {
      remoteConnection.setLocalDescription(desc2);
      localConnection.setRemoteDescription(desc2);
    }, error)
  }, error)
  
  function error() {}
}