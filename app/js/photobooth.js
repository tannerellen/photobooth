var photobooth = (function() {
	'use strict';
	//Return public members
	return {
		urlQueryParams: urlQueryParams(),
		ajaxRequest: ajaxRequest,
		CreateSound: CreateSound,
		transitionEvent: whichTransitionEvent(),
		animationEvent: whichAnimationEvent(),
	};

	function urlQueryParams() {
		return parseKeyValue(window.location.search);
	}
	function tryDecodeURIComponent(value) {
	  try {
	    return decodeURIComponent(value);
	  } catch (e) {
	    // Ignore any invalid uri component
	  }
	}

	function isDefined(value) {return typeof value !== 'undefined';}

	function parseKeyValue(keyValue) {
	  keyValue = keyValue.replace(/^\?/, '');
	  var obj = {}, key_value, key;
	  var iter = (keyValue || "").split('&');
	  for (var i=0; i<iter.length; i++) {
	    var kValue = iter[i];
	    if (kValue) {
	      key_value = kValue.replace(/\+/g,'%20').split('=');
	      key = tryDecodeURIComponent(key_value[0]);
	      if (isDefined(key)) {
	        var val = isDefined(key_value[1]) ? tryDecodeURIComponent(key_value[1]) : true;
	        if (!hasOwnProperty.call(obj, key)) {
	          obj[key] = val;
	        } else if (isArray(obj[key])) {
	          obj[key].push(val);
	        } else {
	          obj[key] = [obj[key],val];
	        }
	      }
	    }
	  };
	  return obj;
	}

	//Ajax no dependencies required
	function ajaxRequest(file, success, error) {
		var xmlhttp;

		if (window.XMLHttpRequest) {
			// code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		}
		else {
			// code for IE6, IE5
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}

		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 ) {
				if(xmlhttp.status == 200) {
					success(xmlhttp.responseText, xmlhttp.status);
				}
				else {
					error(xmlhttp.responseText, xmlhttp.status);
				}
			}
		};

		xmlhttp.open("GET", file, true);
		xmlhttp.send();
	}

	function jsonParse(data) {
		if (!data) {
			return;
		}
		return window.JSON && window.JSON.parse ? window.JSON.parse( data ) : (new Function("return " + data))();
	}

	/* From Modernizr to determine css animation event */
	function whichAnimationEvent(){
	  var t,
	      el = document.createElement("fakeelement");

	  var animations = {
	    "animation"      : "animationend",
	    "OAnimation"     : "oAnimationEnd",
	    "MozAnimation"   : "animationend",
	    "WebkitAnimation": "webkitAnimationEnd"
	  }

	  for (t in animations){
	    if (el.style[t] !== undefined){
	      return animations[t];
	    }
	  }
	}
	/* From Modernizr to determine css transition event */
	function whichTransitionEvent(){
	    var t;
	    var el = document.createElement('fakeelement');
	    var transitions = {
	      'transition':'transitionend',
	      'OTransition':'oTransitionEnd',
	      'MozTransition':'transitionend',
	      'WebkitTransition':'webkitTransitionEnd'
	    }

	    for(t in transitions){
	        if( el.style[t] !== undefined ){
	            return transitions[t];
	        }
	    }
	}

	function loadSound(url, context, callback) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';

		// Decode asynchronously
		request.onload = function() {
			context.decodeAudioData(request.response, function(buffer) {
				var soundBuffer = buffer;
				callback(soundBuffer);
			}, function(error) {
				console.log(error);
			});
		};
		request.send();
	}

	function CreateSound(name, url, context, afterLoad) {
		var sound = {};
		sound.name = name;
		sound.url = url;
		sound.play = playSound;
		//Load our sound into memory. This is a async process so make sure not to attempt and play the sound until this has finished
		loadSound(url, context, bufferSound);

		function playSound(time) {
			var buffer = this.buffer;
			this.source = context.createBufferSource(); // creates a sound source
			this.source.buffer = buffer;                // tell the source which sound to play
			this.source.connect(context.destination);   // connect the source to the context's destination (the speakers)

			this.source.start(time); 
		}

		function bufferSound(buffer) {
			sound.buffer = buffer;

			if (afterLoad) {
				afterLoad(sound);
			}

		}
		
		return sound;
	}

}());