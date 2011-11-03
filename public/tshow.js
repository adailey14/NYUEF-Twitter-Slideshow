var imageNodes = [];
var activeImage = 0;

//slideshow runner
setInterval(function(){
	//move to next image
	var previousImage = activeImage;
	if(activeImage+1 >= imageNodes.length) {
		activeImage = 0
	} else {
		activeImage++:
	}
	$('#images').append(imageNodes[previousImage])
}, 3000);




function addUrl(imageurl) {
	//try to load this url as an image
	var image = $('<img src="' + imageurl + '">').load(function(){
		imageNodes.push(image);
	});
	$('#images').append(image);
}


function processSite(data) {
	console.log(data);
}

function processUpdate(json) {
	$.each(json, function(index, value){
		$('#tweets').append("<li>" + value.text + "</li>");
		$.each(value.urls, function(index, value) {
			addUrl(value);
		});
	});
	console.log(json);
}



$(document).ready(function(){


	$.getJSON("/update", processUpdate);
	
	// $.get("http://t.co/ibyLuOMS", processSite);
	
	//$.get("http://twitter.com/#!/adailey14/status/131469194280701952/photo/1", processSite);
	
	//testing
	
	
});


