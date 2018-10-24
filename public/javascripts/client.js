var socket;
var player;
var actionStates = [];
var playerState = "";
var playerName = "";
var deckOfCards = [["place"], ["remove"], ["place", "place"], ["remove", "remove"], ["place", "remove"], ["place"], ["remove"], ["place", "place"], ["remove", "remove"], ["place", "remove"], ["place"], ["remove"], ["place", "place"], ["remove", "remove"], ["place", "remove"]];
var playerHand = [];
var playerHandHTML = "";
var cardTemplate;
var turnPhase = "wait"; // wait, card, control
var actionAckPromise;

$(document).ready(function(){
	// Initialize variables
	cardTemplate = _.template($("#card-template").html());

	var $controls = $("#page-content #controls-container");
	var $moveBtns = $controls.find("#move-container .move-btn");
	var $actionBtn = $controls.find("#action-container #action-btn");
	var $messages = $("#page-content #message-container");
	var $turnInfo = $messages.find("#turn-info");
	var $playerHand = $messages.find("#player-hand");
	var $waitContainer = $("#page-content #wait-message-container");
	var $waitMessage = $waitContainer.find("#wait-message");
	var $waitForm = $waitContainer.find("#player-form");
	var $waitBtn = $waitContainer.find("#wait-message-btn");
	var $waitInstructions = $waitContainer.find("#wait-instructions");
	var $waitStartBtn = $waitContainer.find("#start-btn");

	// Welcome and onboarding
	$waitForm.submit(function(e){
		e.preventDefault();
		playerName = $(this).find("#player-name").val();

		// Show instructions
		$waitForm.hide();
		$waitMessage.hide();
		$waitInstructions.show();
		$waitInstructions.find("#player-name").text(playerName);
		$waitBtn.show();
		$waitInstructions.scrollTop(0);

		$waitBtn.click(function(){
			$waitMessage.show();
			$waitInstructions.hide();
			$waitMessage.text("Please wait for your turn");

			// Connect to socket server
			socket = io("/client");

			socket.on("queue", function(msg){
				$turnInfo.text(msg);
			});

			socket.on("assignment", function(data){
				// Press Start
				$waitStartBtn.show();
				$waitMessage.text("Press start to begin!");
				$waitStartBtn.click(function(){
					// Hide container when ready play
					$waitContainer.hide();
				});

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
					if(turnPhase == "card"){
						var cardPlayed;
						actionStates = playerHand[parseInt($(this).attr("data-card-index"))];
						// Remove card from hand
						cardPlayed = playerHand.splice(parseInt($(this).attr("data-card-index")), 1);
						$turnInfo.text("It's your turn, " + actionStates[0] + " a piece");
						if(actionStates[0] == "place"){
							$actionBtn.text("Place");
						}else if(actionStates[0] == "remove"){
							$actionBtn.text("Remove");
						}
						changeTurnPhase("control");
					}
				});


				// Sockets ---------------------------------------------
				// Send player name to server
				socket.emit("player name", {
					target: player,
					playerName: playerName
				});

				socket.on("turn begin", function(){
					// Draw card
					drawCard();
					renderHand();
					changeTurnPhase("card");
				});

				socket.on("result", function(result){
					gameEnd(result);
				});

				socket.on("opponent disconnected", function(){
					changeTurnPhase("idle");
					$turnInfo.text("Your opponent has left the game");
				});

				bindActionPromise();

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

					actionAckPromise.then(function(msg){
						$turnInfo.text("It's your turn, " + actionStates[0] + " a piece");
						if(actionStates[0] == "place"){
							$actionBtn.text("Place");
						}else if(actionStates[0] == "remove"){
							$actionBtn.text("Remove");
						}

						if(actionStates.length === 0){
							socket.emit("turn finished", {
								target: player
							});
							changeTurnPhase("idle");

							// Exhausted all cards
							if(playerHand.length === 0){
								socket.emit("cards finished", {
									target: player
								});
							}
						}
						bindActionPromise();
					}).catch(function(err){
						// Put the action back to the array
						actionStates.unshift(actionState);
						bindActionPromise();
					});
				});
			});

			function drawCard(){
				if(deckOfCards.length > 0){
					var newCard = deckOfCards.splice(0, 1);
					playerHand = playerHand.concat(newCard);
				}
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
					renderHand();
					$turnInfo.text("It's your turn, pick a card");
				}else if(turnPhase == "control"){
					$actionBtn.prop("disabled", false);
					$controls.show();
					$playerHand.hide();
					renderHand();
				}
			}

			function bindActionPromise(){
				socket.removeListener("action accepted");
				socket.removeListener("action rejected");

				actionAckPromise = new Promise(function(resolve, reject){
					socket.on("action accepted", function(){
						resolve("accept");
					});

					socket.on("action rejected", function(){
						reject("reject");
					});
				});
			}

			function gameEnd(result){
				$waitContainer.show();
				$waitStartBtn.hide();
				$waitMessage.show();

				if(player === result){
					// Player won
					$waitMessage.text("Congratulations! You have won!");
				}else if(result === "draw"){
					// It's a draw
					$waitMessage.text("It's a draw!");
				}else{
					// Player lost
					$waitMessage.text("You have lost. Try again next time!");
				}
			}
		});
	});
});