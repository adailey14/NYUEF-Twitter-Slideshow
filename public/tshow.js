var nodesHash = {};
var playOrder = [];
var addedOrder = [];
var tweetNodes = [];
var currentlyPlaying = 0;
var latestid;
var uniqueIndex = 0;
var deletePlaying = false;

var hash = getParameterByName("hash");
var q = "";
if (hash){
	q = "?hash=" + hash;
}

function getUniqueIndex(){
	if (uniqueIndex > 10000) uniqueIndex = 0;
	return uniqueIndex++;
}

function deleteOldest(){
	var oldestImageIndex = addedOrder.shift();
	nodesHash[oldestImage].detach();
	delete nodesHash[oldestImageIndex];	
}

function addUrl(imageurl) {
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
				deleteOldest();
			}
		}
	});
	
	$('#images').append(image);
}

function addTweet(text) {
	$('#tweets').append("<li>" + text + "</li>");
}


function processUpdate(json) {
	latestid = json.latestid
	$.each(json.tweets, function(index, value){
		addTweet(value.text);
		$.each(value.urls, function(index, value) {
			addUrl(value);
		});
	});
	setTimeout(pollServer,20000);
}

function pollServer(){
	if(latestid) {
		$.getJSON("/update" + latestid + q, processUpdate);
	} else {
		$.getJSON("/update" + q, processUpdate);
	}
}


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
		$('#images').append(previousNode);
		$('#mainImage').append(nextNode);
		
		if(deletePlaying){
			deleteOldest();
			deletePlaying = false;
		}
	}
	setTimeout(advanceSlideshow,4000);
}

$(document).ready(function(){
	pollServer();
	advanceSlideshow();
});










//helper
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