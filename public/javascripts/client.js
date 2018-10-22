var socket;
var player;
var actionStates = [];
var playerState = "";
var deckofCards = [];
var activeCards = [];

$(document).ready(function(){
	socket = io("http://localhost:3001/client");

	socket.on("assignment", function(data){
		// Initialize states
		player = data.player;
		if(player === "p1"){
			playerState = "white";
		}else if(player === "p2"){
			playerState = "black";
		}
		activeCards = [["place", "place"], ["place"], ["place", "remove"]];

		socket.on("turn begin", function(){
			console.log("begin");
			// Draw card
			// Temporary ---------------
			actionStates = activeCards[0];
			$actionBtn.prop("disabled", false);
		});

		var $controls = $("#page-content #controls-container");
		var $moveBtns = $controls.find("#move-container .move-btn");
		var $actionBtn = $controls.find("#action-container #action-btn");

		$moveBtns.filter("#up-btn").click(function() {
			socket.emit("move", {
				target: player,
				direction: "up"
			});
		});
		$moveBtns.filter("#down-btn").click(function() {
			socket.emit("move", {
				target: player,
				direction: "down"
			});
		});
		$moveBtns.filter("#left-btn").click(function() {
			socket.emit("move", {
				target: player,
				direction: "left"
			});
		});
		$moveBtns.filter("#right-btn").click(function() {
			socket.emit("move", {
				target: player,
				direction: "right"
			});
		});

		$actionBtn.click(function() {
			var actionState = actionStates.shift();
			if(actionState === "place"){
				socket.emit("place", {
					target: player,
					state: playerState
				});
			}else if(actionState === "remove"){
				socket.emit("remove", {
					target: player
				});
			}

			if(actionStates.length === 0){
				$actionBtn.prop("disabled", true);
				socket.emit("turn finished", {
					target: player
				});
			}
		});
	});
});