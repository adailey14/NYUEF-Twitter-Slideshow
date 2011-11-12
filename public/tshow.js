//Global Variables
var nodesHash = {}; //Store the image nodes with unique IDs
var playOrder = []; //Store the unique IDs of nodes in the order they should play
var addedOrder = []; //Store the unique IDs of nodes in the order they were added
var tweetNodes = []; //Keep track of tweeted text nodes in the order they were added
var currentlyPlaying = 0; //index in playOrder of the currently displayed image
var latestid; //twitter API Id of the most recent tweet recieved (sent back to server)
var deletePlaying = false;
var querystring = "";
var hashtag = "nyuef";

//function to generate unique IDs.
//There will only be 20 or so IDs out at any one time so we can loop back to 0 eventually
var getUniqueIndex = function(){
	var uniqueIndex = 0;
	return function(){
		if (uniqueIndex > 10000) uniqueIndex = 0;
		return uniqueIndex++;		
	};
}();

function deleteOldestImage(){
	var oldestImageIndex = addedOrder.shift();
	nodesHash[oldestImageIndex].image.detach();
	delete nodesHash[oldestImageIndex];
}

function addImage(imageurl, text, from_user) {
	//try to load this url as an image
	
	var caption;
	if (text == ""){
		caption = $('<div></div>');
	} else {
		caption = $('<div class="caption">' + from_user + ": " + text + '</div>');
	}
	
	var image = $('<img src="' + imageurl + '">').load(function(){
		var newUniqueIndex = getUniqueIndex();
		var newPlaySlot = currentlyPlaying+1;
		nodesHash[newUniqueIndex] = {image:image, caption:caption};
		playOrder.splice(newPlaySlot,0,newUniqueIndex);
		addedOrder.push(newUniqueIndex);
		
		//only show latest 20 images
		if (addedOrder.length > 20){
			if(playOrder[currentlyPlaying] == addedOrder[0]){
				deletePlaying = true;
			} else {
				deleteOldestImage();
			}
		}
	});
	
	$('#images').append(image);
}

function addTweet(text, from_user) {
	if (text !== "") {
		var newTweet = $("<p style='display:none'>" + from_user + ": " + text + "</p>");
		tweetNodes.push(newTweet);
	
		if(tweetNodes.length > 7) {
			var oldestTweet = tweetNodes.shift();
			oldestTweet.fadeOut(function(){oldestTweet.detach();});
		}

		$('#tweets').prepend(newTweet);
		newTweet.slideDown();
	}
}


function processUpdate(json) {
	latestid = json.latestid;
	$.each(json.tweets, function(index, value){
		//remove urls and the hashtag from the tweets
		value.text = value.text.replace(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])? ?/g,"");
		if (value.text.replace(new RegExp(" ?#" + hashtag + " ?","gi"),"") == "") {
			value.text = ""
		}
		
		addTweet(value.text, value.from_user);
		$.each(value.urls, function(index, imageurl) {
			addImage(imageurl, value.text, value.from_user);
		});
	});
	//poll the server again in 20 seconds
	//note: twitter api has some limits on polling. maybe should poll less frequently?
	setTimeout(pollServer,20000);
}

function pollServer(){
	if(latestid) {
		$.getJSON("/update" + latestid + querystring, processUpdate);
	} else {
		$.getJSON("/update" + querystring, processUpdate);
	}
}

//drop in the next image
var imgCtxQueue = new Array();  // keeps track of canvases
var imgCtxIndex = 0;
var maxCanvi = 10;
function advanceSlideshow() {
	
	if (imgCtxQueue.length > maxCanvi) {
		var killCtx = imgCtxQueue.shift();
		document.body.removeChild(killCtx.canvas);
	}
	
	// max dimensions for images
	var box = Math.min(window.innerWidth, window.innerHeight);
	var maxImageWidth = box * 1.1;
	var maxImageHeight = box * 1.1;
	
	// positioning area
	var bleed = .1;
	var xMin = -(window.innerWidth * bleed);
	var xMax = window.innerWidth - (window.innerWidth * .2); // allow room for sidebar
	var yMin = -(window.innerHeight * bleed);
	var yMax = window.innerHeight;
	
	if (playOrder.length > 0) {
		
		//move to next image
		var previousNode = nodesHash[playOrder[currentlyPlaying]];
		//TODO use %
		if(currentlyPlaying >= playOrder.length-1) {
			currentlyPlaying = 0;
		} else {
			currentlyPlaying++;
		}
		
		var nextNode;
		while((playOrder[currentlyPlaying] != undefined) && (nodesHash[playOrder[currentlyPlaying]] == undefined)){
			playOrder.splice(currentlyPlaying,1);
			if(currentlyPlaying >= playOrder.length) {
				currentlyPlaying = 0;
			}
		}
		nextNode = nodesHash[playOrder[currentlyPlaying]];
		nextImg = nextNode.image.get(0);

		previousNode.caption.fadeOut();
		
		// resize image
		if (nextImg.width > nextImg.height) {
			nextImg.height = nextImg.height * (maxImageWidth / nextImg.width);
			nextImg.width = maxImageWidth;
		} else {
			nextImg.width = nextImg.width * (maxImageHeight / nextImg.height);
			nextImg.height = maxImageHeight;
		}
		
		// random image position and tilt
		var imageX = (Math.random() * ((xMax - nextImg.width) - xMin)) + xMin;
		var imageY = (Math.random() * ((yMax - nextImg.height) - yMin)) + yMin;
		var tilt = (Math.random() * .4) - .2; // tilt within + or - .2 radians
		
		var imageCtx = document.createElement('canvas').getContext('2d');
		imageCtx.canvas.width = window.innerWidth;
		imageCtx.canvas.height = window.innerHeight;
		imageCtx.save();
		imageCtx.rotate(tilt);
		imageCtx.drawImage(nextImg, imageX, imageY, nextImg.width, nextImg.height);
		imageCtx.restore();
		
		$(imageCtx.canvas).hide();
		imageCtx.canvas.style.backgroundColor = "rgba(0,0,0,0.2)";
		document.body.appendChild(imageCtx.canvas);
		$(imageCtx.canvas).fadeIn();
		
		// add to queue
		imgCtxQueue.push(imageCtx);
		
		nextNode.caption.hide();
		$('#captionbox').html(nextNode.caption);
		nextNode.caption.fadeIn();
		
		if(deletePlaying){
			deleteOldestImage();
			deletePlaying = false;
		}
	}	
	setTimeout(advanceSlideshow, 2000);
}
/*
//remove the current image and replace with the next image
//images not being displayed are stored in the #images div
function advanceSlideshow(){
	if(playOrder.length > 0) {
		//move to next image
		var previousNode = nodesHash[playOrder[currentlyPlaying]];
		if(currentlyPlaying >= playOrder.length-1) {
			currentlyPlaying = 0;
		} else {
			currentlyPlaying++;
		}
		
		var nextNode;
		while((playOrder[currentlyPlaying] != undefined) && (nodesHash[playOrder[currentlyPlaying]] == undefined)){
			playOrder.splice(currentlyPlaying,1);
			if(currentlyPlaying >= playOrder.length) {
				currentlyPlaying = 0;
			}
		}
		nextNode = nodesHash[playOrder[currentlyPlaying]];

		previousNode.caption.fadeOut();
		previousNode.image.fadeOut(function(){
			$('#images').append(previousNode);
			nextNode.image.hide();
			$('#mainimage').append(nextNode.image);
			nextNode.image.fadeIn();
			nextNode.caption.hide();
			$('#captionbox').append(nextNode.caption);
			nextNode.caption.fadeIn();
		});
		
		if(deletePlaying){
			deleteOldestImage();
			deletePlaying = false;
		}
	}
	setTimeout(advanceSlideshow,5000);
}
*/


//start the program by polling the server and running the slideshow
//these functions will trigger and endless cycle of repolling and slide updates
$(document).ready(function(){
	var inputhashtag = getParameterByName("hashtag");
	if (inputhashtag){
		hashtag = inputhashtag;
		querystring = "?hashtag=" + hashtag;
	}
	
	pollServer();
	advanceSlideshow();
});










//helper function to read the hash query parameter
function getParameterByName(name)
{
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}