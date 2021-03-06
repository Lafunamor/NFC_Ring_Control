var nfcRing = {};

var app = {
  initialize: function () {
    this.bind();
  },
  bind: function () {
    document.addEventListener('deviceready', this.deviceready, false);
  },
  deviceready: function () {
    // note that this is an event handler so the scope is that of the event
    // so we need to call app.report(), and not this.report()
    console.log('deviceready');
	
	// Remove read from windows phone, it's far too buggy
    if(device.platform == "Win32NT"){
      $('#read').hide();
	  $('.icon-text').parent().hide(); // Also hide writing text as it will cause issues where the ring wont be read again
	  // note we need to this here beacuse device isn't avialable previously..  It's a bit of a PITA but it's only temporary
    }

    // See http://docs.phonegap.com/en/edge/cordova_events_events.md.html#backbutton
    if(nfcRing.location == "index"){
      document.removeEventListener("backbutton", nfcRing.handleBack, false);
      // Clear history so back button on home page always leaves the app
      navigator.app.clearHistory();
    }
	
    // See http://docs.phonegap.com/en/edge/cordova_notification_notification.md.html#Notification
    alert = navigator.notification.alert;
    prompt = navigator.notification.prompt;
    if (nfc) {
      nfc.addNdefListener(function (nfcEvent) {
        nfcRing.readOrWrite(nfcEvent);
        console.log("Attempting to bind to NFC");
      }, function () {
        console.log("Success.  Listening for rings..");
      }, function () {
        alert("NFC Functionality is not working, is NFC enabled on your device?");
        $('#createNew, #read, #scan').attr('disabled', 'disabled');
      });
    }
  }
};

function debug(msg) {
  console.log(msg);
}

nfcRing.readOrWrite = function(nfcEvent){
  if(nfcRing.toWrite){
    console.log("Doing write event", nfcEvent);
    nfcRing.write(nfcEvent);
    $('#writeRing').show();
  }else{
    nfcRing.read(nfcEvent);
  }
}

nfcRing.write = function(nfcEvent){
  // If the string is a valid URL
  var isURL = nfcRing.validURL(nfcRing.toWrite);
 
  if(isURL){
    console.log("URL Record");
    var ndefRecord = ndef.uriRecord(nfcRing.toWrite); // Creates a URI record
  }else{
    console.log("Text record");
    // The string must be a text record as that's the only other type we support
    var ndefRecord = ndef.textRecord(nfcRing.toWrite); // Creates a Text record
  }
  nfc.write([ndefRecord], function () {
    navigator.notification.vibrate(100);
    console.log("Written", ndefRecord);
    if(device.platform == "Win32NT"){ // dont ask for sharing if they are Windows Phone as it doesn't work
	  var shareLocation = false;
	  alert("Woohooo", false, "Your ring is ready");
    }else{
      var shareLocation = confirm("Your ring is ready.  Would you like to be awesome and help others by sharing the sweet spot location for this phone model? ", false, "Woohooo");
	}
    if(shareLocation){
      window.location = "shareLocation.html";
    }
  }, function (reason) {
    console.log("Inlay write failed")
  });
}

nfcRing.read = function(nfcEvent){
  console.log("Reading")
  console.log(nfcEvent);
  var ring = nfcEvent.tag;
  console.log(ring);
  ringData = nfc.bytesToString(ring.ndefMessage[0].payload); // TODO make this less fragile 
  alert(ringData, false, "Ring contents:");
}

nfcRing.handleBack = function(){
  // If we're providing an input such as a twitter username and we hit back then go back to the actions prompt page
  if(nfcRing.location == "option"){
    console.log("reloading");
    location.reload();
  }

  // When writing an NFC Ring if back button is pressed show the input page IE twitter username prompt
  if(nfcRing.location == "writing") $('#option').show(); $('#writeRing').hide(); $('#heatMap').hide();
  
  // When on shareLocation screen if back button is pressed we should go back to the createAction page
  if(nfcRing.location == "shareLocation") window.location = "createAction.html";

  // When on location page take back to home page
  if(nfcRing.location == "actions") window.location = "index.html";

  // When back on index page leave the app..
  if(nfcRing.location == "index") navigator.app.exitApp();
}


nfcRing.validURL = function(url) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  if(!pattern.test(url)) {
    return false;
  } else {
    return true;
  }
}
