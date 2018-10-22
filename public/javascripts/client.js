var socket;
var player;
var actionState = "";
var actionsLeft = 0;
var playerState = "";

$(document).ready(function(){
	socket = io("http://localhost:3001/client");

	socket.on("assignment", function(data){
		player = data.player;
		if(player === "p1"){
			playerState = "white";
		}else if(player === "p2"){
			playerState = "black";
		}

		socket.on("turn", function(data){
			actionsLeft = data.actionsLeft;
			actionState = data.state;
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

			actionsLeft--;
			if(actionsLeft === 0){
				$actionBtn.prop("disabled", true);
			}
		});
	});
});