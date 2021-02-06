import * as Tone from 'tone';
import { ToneBufferSource, Gain, ToneAudioBuffer, Transport, Panner3D, EQ3 } from "tone";
import events from 'events';

// const player = new Tone.Player("https://tonejs.github.io/audio/berklee/gong_1.mp3").toDestination();
// Tone.loaded().then(() => {
//     player.start();
// });

const SEG_TIME = 30;
var audioDirectory = 'https://3dyt.hcilab.ml/audio/';
var corsProxy = 'https://cors-anywhere.herokuapp.com/';
var songId = 'v_zZmsFZDaM';
var loadedSongs = {};
var currentSong = '';
var isPlaying = false;
var isFirstTime = true;
var segments = 9;
var waitingLapse = 10000;
var startSegment = 0;
var numLoadSegments = 9;
var selectedEffect = 0;
var instruments = {
	'other': {
		'position': {x: -1.4142135623730951, y: 0.3, z: -1.414213562373095},
		'eq': {low: 2, mid: 0, high: 2}
	},
	'piano': {
		'position': {x: -2, y: 0.3, z: 1.2246467991473532e-16},
		'eq': {low: 2, mid: 1, high: 2}
	},
	'drums': {
		'position': {x: -1.414213562373095, y: 0.3, z: 1.4142135623730951},
		'eq': {low: 2, mid: 0, high:3}
	},
	'vocals': {
		'position': {x: 1.4142135623730951, y: 0.3, z: 1.4142135623730951},
		'eq': {low: 0, mid: 2, high:0}
	},
	'bass': {
		'position': {x: 1.4142135623730938, y: 0.3, z: -1.4142135623730963},
		'eq': {low: 2, mid: 0, high:0}
	}
}
var instArr = Object.keys(instruments);

var players = {};

var interfaceUrl = '';
//var serverUrl = '/';
//var serverUrl = 'https://3dyt.hcilab.ml/';

//setTimeout(()=>{
let hash = location.hash.substr(1);

export class Player extends events.EventEmitter {
	constructor(instrument, position, eq){
		super();
		this.id = null;
		this.instrument = instrument;
		this.buffers = [];
		this.playingSource = null;
		this.started = false;
		this.buffering = false;
		this._panner = new Panner3D({panningModel : 'HRTF'}).toMaster()
		this._panner.setPosition(position.x, position.y, position.z);
		this._eq = new EQ3(eq.low, eq.mid, eq.high).connect(this._panner)
		this.output = (new Gain()).connect(this._eq)
		this.segment = 0;
	}
	playSegment(seg, time, offset){
		console.log(this.instrument, seg);
		if (this.buffers[seg]){
			var source = new ToneBufferSource(this.buffers[seg]);
			source.connect(this.output);
			source.start(time, offset);
			this.playingSource = source;
		} else {
			this.buffering = true;
		}
	}
}

instArr.forEach(instrument => {
	players[instrument] = new Player(instrument, instruments[instrument].position, instruments[instrument].eq);
	players[instrument].id = Transport.scheduleRepeat(function(time){
		players[instrument].playSegment(players[instrument].segment, time, 0);
		players[instrument].segment++;
	}, SEG_TIME, 0);
	Transport.on('start', function(time, offset){
		if (players[instrument].started){
			const seg = Math.floor(offset / SEG_TIME);
			players[instrument].playSegment(seg, time, offset - seg * SEG_TIME);
		}
		players[instrument].started = true
	});
	Transport.on('pause stop', function(time){
		if (players[instrument].playingSource){
			players[instrument].playingSource.stop(time, 0.1);
		}
	});
	Transport.on('stop', function(time){
		players[instrument].buffers = []
	});
});

function transformSong0() {
	console.log('TRANSFORM0');
	circleCusTrackName('vocals', 1000, 'sin', 'cos', 1.0, 2.5, 0.0, 0.0005);
	circleCusTrackName('bass',  3000, 'cos', 'sin', 0.2, 2.0, 0.0, 0.0005);
	circleCusTrackName('drums', 0,    'cos', 'sin', 0.2, 2.0, 0.0, 0.0005);
	circleCusTrackName('piano', 4000, 'cos', 'sin', 1.9, 1.5, 0.0, 0.0005);
	circleCusTrackName('other', 2000, 'cos', 'sin', 1.9, 1.5, 0.0, 0.0005);
}

function transformSong1() {
	console.log('TRANSFORM1');
	circleCusTrackName('vocals', 1000, 'sin', 'cos', 'sin', 0.5, 0.0, 0.0005);
	circleCusTrackName('bass', 3000, 'cos', 'sin', 'cos', 1.0, 0.0, 0.0005);
	circleCusTrackName('drums', 0, 'cos', 'sin', 'sin', 2.0, 0.0, 0.0005);
	circleCusTrackName('piano', 4000, 'cos', 'sin', 'cos', 1.5, 0.0, 0.0005);
	circleCusTrackName('other', 2000, 'cos', 'sin', 'sin', 1.5, 0.0, 0.0005);
}

var songEffects = [transformSong0, transformSong1];

var transformSong = songEffects[selectedEffect];

function circleCusTrackName(name, delay=0, xPos='cos', yPos='sin', zPos=1, distance=2, gap=0, speed=0.0005) {
	setTimeout(
		()=>{
			var time = Date.now() * speed;
			time = time - delay;
			var obj = players[name]._panner;
			var positionX = setCoord(xPos, time, distance, gap);
			var positionZ = setCoord(yPos, time, distance, gap);
			var positionY = setCoord(zPos, time, distance, gap);
			obj.setPosition(positionX, positionY, positionZ);
			circleCusTrackName(name, delay, xPos, yPos, zPos, distance, gap, speed)
		},
		100
	);
}

function setCoord(varValue, time, distance, gap) {
	if (typeof varValue == 'string') {
		if (varValue == 'cos') {
			return (Math.cos( time ) * distance) + gap;
		} else {
			return (Math.sin( time ) * distance) + gap;
		}
	} else {
		return varValue;
	}
}

function loadSegments(songId, startSegment, numLoadSegments, instArr) {
	if (startSegment < numLoadSegments) {
		var instrument = instArr.pop();
		var url = audioDirectory + songId + '/' + instrument + '-' + startSegment + '.mp3';
		console.log(url);
		// document.getElementById('loader').innerHTML += '.';
		var buffer = new ToneAudioBuffer(url, () => {
			if (instArr.length > 0) {
				if (startSegment == 0) {
					var totalInsts = Object.keys(instruments).length;
					var percentVal = 100 - parseInt((instArr.length / totalInsts) * 100);
					$('.load-percent').html(percentVal + '%');
					var progSize = parseInt($('.progress-bar').css('width').split('px')[0]);
					var progValue = parseInt(progSize * (percentVal/100));
					$('.progress-real-time').css('width', progValue + 'px');
				}
				players[instrument].buffers.push(buffer);
				loadSegments(songId, startSegment, numLoadSegments, instArr);
			} else {
				players[instrument].buffers.push(buffer);
				loadSegments(songId, startSegment + 1, numLoadSegments, Object.keys(instruments));
				segmentLoaded(startSegment);
			}
		});
	}
}

function segmentLoaded(numSegment) {
	if (numSegment == 0) {
		console.log('LOADED');
		if (document.getElementById('playButton') != undefined) {
			// document.getElementById('playButton').disabled = false;
		} else {
			// $('.section-player').show();
			// $('.section-loading').hide();
			// $('.section-process').hide();
			// $('.div-gif-animation').hide();
			$('#messageStart').show();
			$('.load-percent').html('100%');
			var progValue = parseInt($('.progress-bar').css('width').split('px')[0]);
			$('.progress-real-time').css('width', progValue + 'px');
			$('#buttonStart').show();
			// Transport.start();
			// transformSong();
		}
	}
}

var interfaceUrl = '';

// document.getElementById('songSection').style.display = 'block';

// document.getElementById('sendButton').addEventListener('click', () => {
function sendButtonClick() {
	var serverUrl = 'https://script.google.com/macros/s/AKfycbxsr0Wtr7AaLILm-4cgZ0zgUfPd7ln1VS9j5GRTVWcFSOzoVG4/exec?a=queue&q=';
	var youtubeUrl = document.getElementById('url').value;
	if (youtubeUrl) {
		var urlArr = [youtubeUrl];
		var email = document.getElementById('email').value;
		if (email) {
			// document.getElementById("sendButton").innerHTML = '...';
			// document.getElementById('sendButton').setAttribute('disabled', '1');
			console.log('PROCESSING SONG');
			urlArr.push(email);
			//serverUrl += encodeURI(youtubeUrl);
			serverUrl += encodeURIComponent(JSON.stringify(urlArr));
			//console.log(serverUrl);
			fetch(serverUrl)
			  .then((response) => {
			    return response.json();
			  })
			  .then((data) => {
			  		// document.getElementById("sendButton").innerHTML = 'CONVERT';
			  		// document.getElementById('sendButton').removeAttribute('disabled');
					console.log(data);
					var songUrl = data.value.split('#')[1];
					if (data.status == 'OK') {
						console.log(songUrl);
						// $('#formMsg').html('<div>We already have that song in the list. Loading song.</div>');
						// playSong(songUrl);
						reloadSong(songUrl)
						// var button = document.createElement( "button" );
						// button.innerHTML = "PlAY";
						// $(button).on('click',function(){
						// 	playSong(songUrl);
						// });
						// $('#formMsg').append(button);
						// document.getElementById('formMsg').innerHTML = 'We already have that song in the list. You can <a href=\'javascript:playSong("' + songUrl + '")\'>play it from this link</a>';
						// document.getElementById('formMsg').innerHTML = 'Playing song';
						// playSong(songUrl.split('#')[1]);
					} else {
						// document.getElementById('formMsg').innerHTML = 'We got your request, depending on the queued tasks it may take minutes or hours. We will send an email when done, please check your inbox and your spam folder. If you do not get the email please check the music list after some time.';
						console.log(songUrl)
						console.log(data);
						waitingProcessing(songUrl);
					}
			  });
		} else {
			// document.getElementById('formMsg').innerHTML = 'Please provide a valid e-mail.';
		}
	} else {
		// document.getElementById('formMsg').innerHTML = 'Please provide a valid Youtube URL.';
	}
}
// });

function processSong(youtubeUrl) {
	var serverUrl = 'https://script.google.com/macros/s/AKfycbxsr0Wtr7AaLILm-4cgZ0zgUfPd7ln1VS9j5GRTVWcFSOzoVG4/exec?a=queue&q=';
	var urlArr = [youtubeUrl];
	var email = 'me@me.com';
	console.log('PROCESSING SONG');
	urlArr.push(email);
	serverUrl += encodeURIComponent(JSON.stringify(urlArr));
	fetch(serverUrl)
	  .then(response => response.json())
	  .then((data) => {
			console.log(data);
			var songUrl = data.value.split('#')[1];
			if (data.status == 'OK') {
				console.log(songUrl);
				// $('#formMsg').html('<div>We already have that song in the list. Loading song.</div>');
				reloadSong(songUrl);
			} else {
				// document.getElementById('formMsg').innerHTML = 'We got your request, depending on the queued tasks it may take minutes or hours. We will send an email when done, please check your inbox and your spam folder. If you do not get the email please check the music list after some time.';
				console.log(songUrl)
				console.log(data);
				waitingProcessing(songUrl);
			}
	  });
}

function waitingProcessing(songUrl) {
	setTimeout(()=>{
		var songIdNum = songUrl.split(',')[0];
		var url = 'https://script.google.com/macros/s/AKfycbxsr0Wtr7AaLILm-4cgZ0zgUfPd7ln1VS9j5GRTVWcFSOzoVG4/exec?a=duplicated&q=' + encodeURIComponent('https://www.youtube.com/watch?v=' + songIdNum);
		fetch(url).then(response => response.json())
  				  .then(data => {
  				  	if (data.value > 0) {
  				  		console.log('START LOADING');
  				  		setTimeout(()=>{
  				  			// playSong(songUrl);
  				  			reloadSong(songUrl);
  				  		}, 30000);
  				  	} else {
  				  		console.log('STILL WAITING');
						waitingProcessing(songUrl);
						// document.getElementById('loader').innerHTML += '.';
  				  	}
  				  });
	}, waitingLapse);
}

// document.getElementById('selectSong').addEventListener('click', () => {
function selectSongClick() {
	var select = document.getElementById('songsList');
	if (select.value) {
		// playSong(select.value);
		reloadSong(select.value);
		// var hashUrl = interfaceUrl + '#'+ select.value;
		// window.location.href = hashUrl;
		// location.reload();
	}
}
// });

// document.getElementById('searchButton').addEventListener('click', () => {
function searchButtonClick() {
	var query = $('#youtubeQuery').val();
	var url = 'https://script.google.com/macros/s/AKfycbxsr0Wtr7AaLILm-4cgZ0zgUfPd7ln1VS9j5GRTVWcFSOzoVG4/exec?a=youtube&q=' + query;
	fetch(url).then(response => response.json())
		.then(data => {
			console.log(data);
			if (data.status == 'OK' && data.value.length > 0) {
				$('#searchResults').html('');
				for (var obj of data.value) {
					$('#searchResults').append(`<a href="#" class="linkObjs" id="${obj.id.videoId}"><img src="https://i.ytimg.com/vi/${obj.id.videoId}/default.jpg">${obj.snippet.title}</a><br>`);
				}
				$('.linkObjs').on('click', function(){
					processSong('https://www.youtube.com/watch?v=' + this.id);
				})
			} else {
				$('#searchResults').html('NO RESULTS');
			}
		});
}
// });


$('.button-play').on('click', () => {
	$('.div-gif-animation').show();
	playButtonClick();
});

$('#buttonStart').on('click', () => {
	$('.section-player').show();
	$('.section-loading').hide();
	$('.section-process').hide();
	$('.div-gif-animation').hide();
	$('.button-play').click();
	$('.svg-pause').show();
	$('.svg-play').hide();
});

// document.getElementById('playButton').addEventListener('click', () => {
function playButtonClick() {
	if (!isPlaying && isFirstTime) {
		isPlaying = true;
		isFirstTime = false;
		Tone.start();
		Transport.start();
		// selectedEffect = parseInt($('#effectMenu').val());
		transformSong = songEffects[selectedEffect];
		transformSong();
		$('.svg-pause').show();
		$('.svg-play').hide();
	} else if (!isPlaying && !isFirstTime) {
		isPlaying = true;
		Transport.start();
		$('.svg-pause').show();
		$('.svg-play').hide();
	} else {
		isPlaying = false;
		Transport.pause();
		$('.svg-pause').hide();
		$('.svg-play').show();
	}
}
// });

function playSong(song) {
	var arrParams = song.split(',');
	var numSegments = parseInt(parseInt(arrParams[1])/30);
	var songIdNum = arrParams[0];
	currentSong = songIdNum; 
	if (!loadedSongs.hasOwnProperty(songIdNum)) {
		$('.section-player').hide();
		$('.section-loading').show();
		$('.section-process').hide();
		$('#messageStart').hide();
		$('#buttonStart').hide();
		loadSegments(arrParams[0], 0, numSegments, instArr);
		loadedSongs[songIdNum] = true;
	} else {
		$('.section-player').show();
		$('.section-loading').hide();
		$('.section-process').hide();
		Transport.start();
	}
}

// if (navigator.permissions && navigator.clipboard && navigator.clipboard.readText) {
// 	document.getElementById('pasteSection').removeAttribute('hidden');
// 	document.getElementById('pasteButton').addEventListener('click', () => {
// 		console.log('PASTE');
// 		navigator.permissions.query({name: "clipboard-read"}).then(result => {
// 		  console.log(result.state);
// 		  if (result.state == "granted" || result.state == "prompt") {
// 		    //document.getElementById('url').focus();
// 	  		//document.execCommand("paste");
// 			navigator.clipboard.readText().then(text => document.getElementById('url').value = text);
// 		  }
// 		});
// 	});
// }

var filterOn = false;
// document.getElementById('toggleSearch').addEventListener('click', () => {
// 	if (filterOn) {
// 		$("#songsList").msDropdown().data("dd").hideFilterBox()
// 		filterOn = false;
// 	} else {
// 		$("#songsList").msDropdown().data("dd").showFilterBox()
// 		filterOn = true;
// 	}
// });

// (function() {
// 	var select = document.getElementById('songsList');
// 	var serverUrl = 'https://script.google.com/macros/s/AKfycbxsr0Wtr7AaLILm-4cgZ0zgUfPd7ln1VS9j5GRTVWcFSOzoVG4/exec?a=readSongs&q=1';
// 	fetch(serverUrl)
// 	    .then((response) => {
// 	        return response.json();
// 	    })
// 	    .then((data) => {
// 			if (data.status == 'OK') {
// 				select.options[0].innerHTML = '--- CHOOSE A SONG ---';
// 				var values = data.value;
// 				for (var row of values) {
// 					if (row[0]) {
// 						var opt = document.createElement('option');
// 					    opt.value = row[0] + ',' + row[2];
// 					    opt.setAttribute("data-image", "https://i.ytimg.com/vi/" + row[0] + "/default.jpg");
// 					    opt.innerHTML = row[1];
// 					    select.appendChild(opt);
// 					}
// 				}
// 				try {
// 					$(select).msDropDown();
// 					var oDropdown = $("#songsList").msDropdown().data("dd");
// 					// $("body").append( "<style>#splash #splash-container #bands span {display:inline;}</style>");
// 				} catch(e) {
// 					console.log(e.message);
// 				}
// 			}
// 	  });
// })();

// $('#songsList').on('change', () => {
// 	var select = document.getElementById('songsList');
// 	if (select.value) {
// 		document.getElementById('selectSong').removeAttribute('disabled');
// 	} else {
// 		document.getElementById('selectSong').setAttribute('disabled', '1');
// 	}
// });

function reloadSong(song) {
	window.location.href = '#' + song
	location.reload();
}

function getSong(hash) {
	var arrParams = hash.split(',');
	var songId = arrParams[0];
	var serverUrl = 'https://script.google.com/macros/s/AKfycbxsr0Wtr7AaLILm-4cgZ0zgUfPd7ln1VS9j5GRTVWcFSOzoVG4/exec?a=getSong&q=' + songId;
	fetch(serverUrl)
	  .then((response) => {
	    return response.json();
	  })
	  .then((data) => {
	  		// document.getElementById("sendButton").innerHTML = 'CONVERT';
	  		// document.getElementById('sendButton').removeAttribute('disabled');
			console.log(data);
			if (data.status == 'OK') {
				var songArr = data.value;
				if (songArr.length > 0) {
					$('.h1-song-name').html(songArr[1]);
					playSong(hash);
				}
				else {
					$('.section-player').hide();
					$('.section-loading').hide();
					$('.section-process').show();
					var youtubeUrl = 'https://www.youtube.com/watch?v=' + songId
					processSong(youtubeUrl);
				}
			}
	  });
}

if (hash) {
	$('.section-player').hide();
	console.log(hash);
	getSong(hash);
	// playSong(hash);
}