var socket;
var player;
var actionStates = [];
var playerState = "";
var deckOfCards = [["place"], ["remove"], ["place", "place"], ["remove", "remove"], ["place", "remove"]];
var playerHand = [];
var playerHandHTML = "";
var cardTemplate;
var turnPhase = "wait"; // wait, card, control

$(document).ready(function(){
	cardTemplate = _.template($("#card-template").html());

	var $controls = $("#page-content #controls-container");
	var $moveBtns = $controls.find("#move-container .move-btn");
	var $actionBtn = $controls.find("#action-container #action-btn");
	var $messages = $("#page-content #message-container");
	var $turnInfo = $messages.find("#turn-info");
	var $playerHand = $messages.find("#player-hand");

	socket = io("http://localhost:3001/client");

	socket.on("assignment", function(data){
		// Shuffle Deck
		deckOfCards = _.shuffle(deckOfCards);

		// Initialize states
		player = data.player;
		if(player === "p1"){
			playerState = "white";
		}else if(player === "p2"){
			playerState = "black";
		}
		// Initial hand
		playerHand = deckOfCards.splice(0, 3);
		renderHand();
		changeTurnPhase("idle");

		// Bind card event
		$("body").on("click", "#page-content #message-container #player-hand .player-card", function(){
			actionStates = playerHand[parseInt($(this).attr("data-card-index"))];
			$turnInfo.text("It's your turn, " + actionStates[0] + " a piece");
			changeTurnPhase("control");
		});


		// Sockets ---------------------------------------------
		socket.on("turn begin", function(){
			// Draw card
			drawCard();
			renderHand();
			changeTurnPhase("card");
		});

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
			$turnInfo.text("It's your turn, " + actionStates[0] + " a piece");

			if(actionStates.length === 0){
				socket.emit("turn finished", {
					target: player
				});
				changeTurnPhase("idle");
			}
		});
	});

	function drawCard(){
		playerHand.push(deckOfCards.splice(0, 1));
	}

	function renderHand(){
		playerHandHTML = "";
		_.each(playerHand, function(el, i){
			playerHandHTML += cardTemplate({
				actions: el,
				index: i
			});
		});
		$playerHand.html(playerHandHTML);
	}

	function changeTurnPhase(phase){
		turnPhase = phase;
		if(turnPhase == "idle"){
			$actionBtn.prop("disabled", true);
			$controls.hide();
			$playerHand.show();
			$turnInfo.text("Waiting for other player");
		}else if(turnPhase == "card"){
			$controls.hide();
			$playerHand.show();
			$turnInfo.text("It's your turn, pick a card");
		}else if(turnPhase == "control"){
			$actionBtn.prop("disabled", false);
			$controls.show();
			$playerHand.hide();
		}
	}
});