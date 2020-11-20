import * as Tone from 'tone';
import { ToneBufferSource, Gain, ToneAudioBuffer, Transport } from "tone";
import events from 'events';

// const player = new Tone.Player("https://tonejs.github.io/audio/berklee/gong_1.mp3").toDestination();
// Tone.loaded().then(() => {
//     player.start();
// });

const SEG_TIME = 30;
var audioDirectory = 'https://3dyt.hcilab.ml/audio/';
var songId = 'v_zZmsFZDaM';
var segments = 9;
var startSegment = 0;
var numLoadSegments = 9;
var instruments = {
	'other': {

	},
	'piano': {

	},
	'drums': {

	},
	'vocals': {

	},
	'bass': {

	}
}
var instArr = Object.keys(instruments);

var players = {};

export class Player extends events.EventEmitter {
	constructor(instrument){
		super();
		this.id = null;
		this.instrument = instrument;
		this.buffers = [];
		this.playingSource = null;
		this.started = false;
		this.buffering = false;
		this.output = (new Gain()).toMaster();
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
	scheduleRepeat(time){
		this.playSegment(this.segment, time, 0);
	}
	_startMethod(time, offset){
		//it was paused and restated
		if (this.started){
			// get the buffer segment
			const seg = Math.floor(offset / SEG_TIME);
			console.log(this);
			this.playSegment(seg, time, offset - seg * SEG_TIME);
		}
		this.started = true
	}
	_pauseMethod(time){
		if (this.playingSource){
			this.playingSource.stop(time, 0.1);
		}
	}
	_stopMethod(time){
		this.buffers = []
	}
}

instArr.forEach(instrument => {
	var player = new Player(instrument);
	player.id = Transport.scheduleRepeat(function(time){
		player.playSegment(player.segment, time, 0);
		player.segment++;
	}, SEG_TIME, 0);
	Transport.on('start', function(time, offset){
		if (player.started){
			const seg = Math.floor(offset / SEG_TIME);
			player.playSegment(seg, time, offset - seg * SEG_TIME);
		}
		player.started = true
	});
	Transport.on('pause stop', function(time){
		if (player.playingSource){
			player.playingSource.stop(time, 0.1);
		}
	});
	Transport.on('stop', function(time){
		player.buffers = []
	});
	players[instrument] = player;
});

function loadSegments(startSegment, numLoadSegments, instArr) {
	if (startSegment < numLoadSegments) {
		var instrument = instArr.pop();
		var url = audioDirectory + songId + '/' + instrument + '-' + startSegment + '.mp3';
		console.log(url);
		var buffer = new ToneAudioBuffer(url, () => {
			if (instArr.length > 0) {
				players[instrument].buffers.push(buffer);
				loadSegments(startSegment, numLoadSegments, instArr);
			} else {
				loadSegments(startSegment + 1, numLoadSegments, Object.keys(instruments));
				segmentLoaded(startSegment);
			}
		});
	}
}

function segmentLoaded(numSegment) {
	if (numSegment == 0) {
		console.log('LOADED');
		Transport.start();
	}
}

loadSegments(startSegment, numLoadSegments, instArr);