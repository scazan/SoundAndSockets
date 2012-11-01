
var stage = new AudioStage();
window.socketID = 0;

var eventMappings = {
		death: {
			file: 'snd/concreteDigital.mp3', 
			loop: true,
			vol: 0.5,
			pan: [0.5,0.5,0.5],
			poly: false,
			crossfade: 'normal',
			effects: ['hpfilter', 'reverb']
		},
		explosion: {
			file: 'snd/crash17.mp3',
			loop: false,
			vol: 1,
			pan: [0,1,1],
			poly: true,
			effects: ['hpfilter', 'reverb']
		},
		laserFire: {
			file: 'snd/crash17.mp3',
			loop: false,
			vol: 1,
			effects: ['hpfilter', 'reverb'],
			poly: true
		},
		convolveBuffer: {
			file: 'snd/WierdSpringer.mp3'
		}
	};

$(document).ready(function() {
		
		if(typeof window.webkitAudioContext == 'undefined') {
			$('body').html('Please download Chrome');
		} 
		else {
			stage.ready = main;
			stage.addCues(eventMappings);		
		}

});

var checkDistances = function() {
	$.each(panels, function(sourceKey, sourcePanel) {
		$.each(panels, function(comparingKey, comparingPanel) {
			if(sourceKey != comparingKey){
				var distanceBetweenPanels = Math.abs(parseInt($(comparingPanel.ui).position.top) - parseInt($(sourcePanel.ui).position.top));
				var comparedTop = parseInt($(comparingPanel.ui).css('top'));
				var sourceTop = parseInt($(sourcePanel.ui).css('top'));

				console.log("Math: " + parseInt($(comparingPanel.ui).css('top')) + " - " + parseInt($(sourcePanel.ui).css('top')) );
				console.log(
					distanceBetweenPanels
				);
				if(distanceBetweenPanels < 50) {
					console.log('close!');
				};	
			}
			
		});
	});
};


function setupSockets() {
		window.socket = io.connect('http://localhost');
		window.position = {top: 0, left: 0};

		socket.on('setID', function(id) {
			window.socketID = id;
		});

		socket.on('receiveObjects', function(objects){
			$.each(objects, function(key, object) {
				if(!panels[object.id]) {
					var isCurrentPlayer;
					if(object.id == window.socketID) {
						isCurrentPlayer = true;
					}

					panels[object.id] = new SoundGUI(stage.cues.death, $('#soundCanvas'), isCurrentPlayer);	
					$(panels[object.id].ui).css({top: object.position.top, left: object.position.left});
					
					if(object.id == window.socketID) {
						$(panels[object.id].ui).addClass('active');
					}
				}
			});

		});

	    socket.on('changePosition', function(data) {

	    	$(panels[data.id].ui).css({top: data.position.top, left: data.position.left});

	    	panels[data.id].cue.setPlaybackRate(data.position.left / 1024);
			panels[data.id].cue.setVolume(data.position.top / 1024);

			checkDistances();
	    });

	    socket.on('play', function(object) {
			panels[object.id].cue.play();
		});

	    socket.on('removeObject', function(objectID) {
			panels[objectID].destroy();
		});
};


function main() {	
	window.panels = {};
	setupSockets();
};	

// GUI LAYER -------------------------------------
function SoundGUI(cue, parentUIElement, isPlayer) {
	var widgetDiv = document.createElement('div');
	
	$(parentUIElement).append(widgetDiv);
	$(widgetDiv).addClass('soundPanel');

	var rotationHandle = document.createElement('div');
	$(rotationHandle).addClass('rotationHandle');
	widgetDiv.appendChild(rotationHandle);

	this.isCurrentPlayer = isPlayer;
	this.cue = cue;
	this.ui = widgetDiv;

	this.setupUI();
	
	this.rotation = 0;
	this.mouseIsDown = false;

}

SoundGUI.prototype.setupUI = function() {
	var soundGuiObj = this;

	if(this.isCurrentPlayer) {

		$(this.ui).draggable({
			containment: "parent",
			drag: function(e,ui) {
				soundGuiObj.cue.setPlaybackRate(e.pageX / 1024);
				soundGuiObj.cue.setVolume(e.pageY / 1024);

				var uiPosition = ui.position;

		    	window.position.top = uiPosition.top;
		    	window.position.left = uiPosition.left;

		    	socket.emit('changePosition', {
		    		id: window.socketID, 
		    		position: {
		    			top: uiPosition.top, 
		    			left: uiPosition.left
		    		} 
		    	});
			}
		});

		$(this.ui).find('.rotationHandle').draggable({
			containment: "parent",
			drag: function() {
				soundGuiObj.cue.filter.value = $(this).position().left * 100;
				soundGuiObj.cue.filter.Q.value =  ($(this).position().left / $(soundGuiObj.ui).height()) * 2;
			}
		});

		$(this.ui).bind('mouseup', function() { soundGuiObj.mouseIsDown = false;});

		$(this.ui).bind('contextmenu', function(e) {
			e.preventDefault();
			
			soundGuiObj.mouseIsDown = true;
			var bindingFunction = this;

			this.loopingRotation = setInterval(function() {
				if(soundGuiObj.mouseIsDown) 
				{
					$(soundGuiObj.ui).css({
				                "transform": "rotate("+ soundGuiObj.rotation + "deg)",
				                "-moz-transform": "rotate("+ soundGuiObj.rotation + "deg)",
				                "-webkit-transform": "rotate("+ soundGuiObj.rotation + "deg)",
				                "-o-transform": "rotate("+ soundGuiObj.rotation + "deg)"
				            });
				            
				            soundGuiObj.cue.reverb.gain.value = soundGuiObj.rotation / 360;
				            soundGuiObj.rotation = (soundGuiObj.rotation + 6) % 360;
		        } else
		        {
		        	clearInterval(bindingFunction.loopRotation);
		        }

			}, 100);
			
		});

		$(this.ui).click(function(e) { 
				$(this.ui).addClass('active');
				window.socket.emit('play', {
					id: window.socketID
				});

				soundGuiObj.cue.play( 
				// 	function() {
				// 	$(soundGuiObj.ui).removeClass('active');
				// }
				);

		});
	}
}

SoundGUI.prototype.destroy = function() {
	$(this.ui).remove();
}

