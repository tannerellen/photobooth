(function() {
  'use strict';
  //url parameters are timing=100 (time in miliseconds can be negative or positive number used to adjust the timing of the camera vs the display flash)
  var sounds;
  var videoContainerElement = document.querySelector('.video-container');
  var videoElement = document.querySelector('video');
  var coverElement = document.querySelector('.cover');
  var counterContainerElement = document.querySelector('.counter-container');
  var footerElement = document.querySelector('.footer');
  var isRunning;
  var readyForPreview;

  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  //Initialize content
  window.onload = initialize();
  

  function initialize() {
      //Watch for hash change so we know when an image is done being processed
      window.addEventListener("hashchange", getImage, false);
      // set our event listener for taking pictures
      window.addEventListener('keypress', snapshot, false);
      //Load sounds into memory
      sounds = initializeSounds();
      //Make sure our video element is set at the proper size
      resetPhotoBooth();
      //Initialize our video stream
      initializeVideo(videoElement, 1280, 1080);
      window.setTimeout(function() {
        fadeOut(coverElement);
        coverElement.innerHTML = "";
      }, 2750)
  }

  function initializeSounds() {
    try {
      // Fix up for prefixing
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      var context = new AudioContext();
    }
    catch(e) {
      alert('Web Audio API is not supported in this browser');
    return;
    }

    var sounds = {
      oneKeaton: new photobooth.CreateSound('one', 'sounds/one.mp3', context),
      twoKeaton: new photobooth.CreateSound('one', 'sounds/two.mp3', context),
      threeKeaton: new photobooth.CreateSound('one', 'sounds/three.mp3', context),
      fourKeaton: new photobooth.CreateSound('one', 'sounds/four.mp3', context),
      fiveKeaton: new photobooth.CreateSound('one', 'sounds/five.mp3', context),
      oneParker: new photobooth.CreateSound('one', 'sounds/one-parker.mp3', context),
      twoParker: new photobooth.CreateSound('one', 'sounds/two-parker.mp3', context),
      threeParker: new photobooth.CreateSound('one', 'sounds/three-parker.mp3', context),
      fourParker: new photobooth.CreateSound('one', 'sounds/four-parker.mp3', context),
      fiveParker: new photobooth.CreateSound('one', 'sounds/five-parker.mp3', context),
      cameraShutter: new photobooth.CreateSound('one', 'sounds/camera-shutter-click.mp3', context),
    };

    return sounds;
  }

  function initializeVideo(element, idealWidth, idealHeight) {
    if (window.stream) {
      element.src = null;
      window.stream.stop();
    }
    var constraints = {
      audio: false,
      video: {
        width: { min: 640, ideal: idealWidth, max: 1920 },
        height: { min: 480, ideal: idealHeight, max: 1080 },
      }
    };

    navigator.getUserMedia(constraints, successCallback, errorCallback);

    function successCallback(stream) {
      window.stream = stream; // make stream available to console
      element.src = window.URL.createObjectURL(stream);
      element.play();
    }

    function errorCallback(error) {
      console.log('navigator.getUserMedia error: ', error);
    }
  }
  
  function resetPhotoBooth() {
    //Change video size back to preview
    adjustVideoPreview(true)
    //Show footer
    showElement(footerElement);
    //Apply video zoom
    var zoom = Number(photobooth.urlQueryParams.zoom) || 0;
    videoContainerElement.classList.add("zoom" + zoom);
    //Reset is running so event listener can fire again
    isRunning = false;
  }

  //Start of photo taking process--
  //Currently invoked by our keypress event listener
  function snapshot() {
      if (isRunning) {
        return;
      }
      else {
        isRunning = true;
      }
      adjustVideoPreview(false);
      hideElement(footerElement);
      countdown();
  }

  function countdown() {
    //Timing adjustments passed through url
    var cameraTiming = Number(photobooth.urlQueryParams.timing) || 0;
    //Add listener so we can run a function when the animation is complete
    coverElement.addEventListener(photobooth.animationEvent, afterPhotoTaken);

    //Countdown numbers wrapped in setTimeout so we get a nice even countdown
    window.setTimeout(function() {
      countdownNumber(5);
      sounds.fiveKeaton.play(0);
    }, 0);
    window.setTimeout(function() {
      countdownNumber(4);
      sounds.fourParker.play(0);
    }, 1000);
    window.setTimeout(function() {
      countdownNumber(3);
      sounds.threeKeaton.play(0);
    }, 2000);
    window.setTimeout(function() {
      countdownNumber(2);
      sounds.twoParker.play(0);
    }, 3000);
    window.setTimeout(function() {
      countdownNumber(1);
      sounds.oneKeaton.play(0);
      sounds.oneParker.play(0);
    }, 4000);
    //End of countdown
    //It takes about a second for the camera to take a picture so delay the picture taking process a bit
    window.setTimeout(function() {
      //Send command to take a picture with the camera
      window.location.href = 'takepic://localhost/';
    }, 3750 + cameraTiming);
    //Show flash animation
    window.setTimeout(function() {
      cameraFlash();
    }, 5000);
  }

  //Countdown is complete show the flash to indicate picture was taken
  function cameraFlash() {
    //Show cover element and add animation class
    showElement(coverElement);
    coverElement.classList.add("flash");
    //Play shutter sound
    sounds.cameraShutter.play(0);
    //Remove counter
    counterContainerElement.innerHTML = "";
    //Cover element animation event listener should fire now running afterPhotoTaken function
  }

  //Picture flash is complete so clean up flash elements left behind
  function afterPhotoTaken() {
    coverElement.removeEventListener(photobooth.animationEvent, afterPhotoTaken);
    coverElement.classList.remove("flash");
    hideElement(coverElement);
    loadPreview();
  }

  //Load image preview loading screen while we wait for the image to received
  function loadPreview() {
    coverElement.classList.add("blank");
    coverElement.classList.add("fade-in");
    showElement(coverElement);
    showProgress(true);
    //We wait for a hash change here to trigger loading the image taken by the camera. If the url hash never changes we are stuck here
    readyForPreview = true;
  }

  //We got notified of the image being ready so let's get the URL for the new photo
  function getImage(e) {
    //If we haven't completed our flash and loading process don't get the image yet
    if (!readyForPreview) {
      window.setTimeout(function() {
        getImage(e);
      }, 500);
      return;
    }
    var url = e.newURL;
    var urlItems = url.split('#');
    var filePath = urlItems.pop();
    var image = filePath;
    //If no image exists its probably because we cleared the hash so only proceed if we have an image path
    if (image) {
      //Reset url hash
      history.replaceState("", document.title, window.location.pathname + window.location.search);
      //Display the photo
      displayPhotoPreview(image);
      readyForPreview = null;
    }
  }

  //Display the new photo to preview the results
  function displayPhotoPreview(src) {
    var photoElement;
    var progressElement;
    //Hide loader progress
    showProgress(false);
    //Create image preview and append to container
    createPhotoPreview(src);
    //Get references to our new elements
    photoElement = document.querySelector('.photo-preview');
    progressElement = document.querySelector('.progress-bar-inner');
    //Register animation event listner so we can hide our image when the animation is done
    progressElement.addEventListener(photobooth.animationEvent, photoPreviewComplete);
    progressElement.classList.add('progress-start');

    window.setTimeout(function() {
      photoElement.classList.add("fade-in");
    },100);
  
  }

  function photoPreviewComplete(animationEnd) {
    var progressElement = animationEnd.target;
    progressElement.removeEventListener(photobooth.animationEvent, photoPreviewComplete);
    resetPhotoBooth();
    fadeOut(coverElement, removePhotoPreview);
  }


  //Utilities===========================================>

  function countdownNumber(number) {
    var options = {
      size: 150,
      animate: 1000,
      lineCap: 'square',
      scaleColor: false,
      lineWidth: 6,

    };
    counterContainerElement.innerHTML = "";

    //Create the elements
    var countDownDiv = document.createElement("div");
    countDownDiv.className = "chart counter";
    countDownDiv.innerHTML = "<span class=\"percent\">" + number + "</span>";
    counterContainerElement.appendChild(countDownDiv);

    // instantiate the plugin
    var chart = new EasyPieChart(countDownDiv, options);
    // update to 100% so the progress goes all the way around
    chart.update(100);
  }

  function adjustVideoPreview(reset) {
    if (reset) {
      videoContainerElement.classList.add("video-preview");
      videoContainerElement.classList.remove("video-capture");  
    }
    else {
      videoContainerElement.classList.remove("video-preview");
      videoContainerElement.classList.add("video-capture");
    }
  }

  function createPhotoPreview(src) {
    coverElement.innerHTML = "<div class=\"progress-bar\"><div class=\"progress-bar-inner\"></div></div><div class='photo-preview'><img src='" + src + "'/></div>";
  }

  function removePhotoPreview() {
    coverElement.innerHTML = "";
  }

  function showProgress(show) {
    var element = document.querySelector('.loading');
    if (show) {
      showElement(element);
    }
    else {
      hideElement(element);
    }

  }

  function hideElement(element) {
    if (element) {
      element.classList.add('hide');
    }
  }

  function showElement(element) {
    if (element) {
      element.classList.remove('hide');
    }
  }

  function fadeOut(element, callback) {
    element.addEventListener(photobooth.transitionEvent, afterFade);
    element.classList.add('fade-out');
    element.classList.remove('fade-in');
    function afterFade() {
      element.removeEventListener(photobooth.transitionEvent, afterFade);
      hideElement(element, true);
      element.classList.remove('fade-out');
      if (callback) {
        callback(element);
      }
    }
  }

}());