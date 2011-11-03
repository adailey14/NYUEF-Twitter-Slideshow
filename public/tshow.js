//Global Variables
var nodesHash = {}; //Store the image nodes with unique IDs
var playOrder = []; //Store the unique IDs of nodes in the order they should play
var addedOrder = []; //Store the unique IDs of nodes in the order they were added
var tweetNodes = []; //Keep track of tweeted text nodes in the order they were added
var currentlyPlaying = 0; //index in playOrder of the currently displayed image
var latestid; //twitter API Id of the most recent tweet recieved (sent back to server)
var deletePlaying = false;
var querystring = "";

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
	nodesHash[oldestImage].detach();
	delete nodesHash[oldestImageIndex];	
}

function addImage(imageurl) {
	//try to load this url as an image
	var image = $('<img src="' + imageurl + '">').load(function(){
		var newUniqueIndex = getUniqueIndex();
		var newPlaySlot = currentlyPlaying+1;
		nodesHash[newUniqueIndex] = image;
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

function addTweet(text) {
	var newTweet = $("<p style='display:none'>" + text + "</p>");
	tweetNodes.push(newTweet);
	
	if(tweetNodes.length > 7) {
		var oldestTweet = tweetNodes.shift();
		oldestTweet.fadeOut(function(){oldestTweet.detach();});
	}

	$('#tweets').prepend(newTweet);
	newTweet.slideDown();
}


function processUpdate(json) {
	latestid = json.latestid;
	$.each(json.tweets, function(index, value){
		addTweet(value.text);
		$.each(value.urls, function(index, imageurl) {
			addImage(imageurl);
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

		previousNode.fadeOut(function(){
			$('#images').append(previousNode);
			nextNode.hide();
			$('#mainimage').append(nextNode);
			nextNode.fadeIn();
		});
		
		if(deletePlaying){
			deleteOldest();
			deletePlaying = false;
		}
	}
	setTimeout(advanceSlideshow,5000);
}

//start the program by polling the server and running the slideshow
//these functions will trigger and endless cycle of repolling and slide updates
$(document).ready(function(){
	var hashtag = getParameterByName("hashtag");
	if (hashtag){
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