var socket, sketch;
var b; // Board
var squares = []; // Individual squares (2D array)
var currentPlayer = "p1";

sketch = function(p){
	var canvas;

	// 12x17, let's do 8x8 first
	var BoardSquares = function(xIndex, yIndex, squareSize){
		this.xIndex = xIndex;
		this.yIndex = yIndex;
		this.squareSize = squareSize;
		this.selected = false;
		this.state = "empty"; // Can be "empty", "white" or "black"
		this.graphic = p.createGraphics(this.squareSize, this.squareSize);
	};

	BoardSquares.prototype.place = function(state){
		if(this.state !== "empty"){
			console.log("Invalid state");
			return false;
		}

		if(state == "white" || state == "black"){
			this.state = state;
			var placeEvent = new CustomEvent("place", {detail: {
				state: state,
				xIndex: this.xIndex,
				yIndex: this.yIndex
			}});
			window.dispatchEvent(placeEvent);
			return true;
		}else{
			console.log("Invalid state provided");
			return false;
		}
	};

	BoardSquares.prototype.flip = function(){
		switch(this.state){
			case "white":
				this.state = "black";
				break;
			case "black":
				this.state = "white";
				break;
			default:
				console.log("Invalid state");
				break;
		}
	};

	BoardSquares.prototype.remove = function(){
		if(this.state == "empty"){
			console.log("Invalid state");
			return false;
		}

		this.state = "empty";
		return true;
	};

	BoardSquares.prototype.draw = function(){
		this.graphic.clear();
		this.graphic.push();
		this.graphic.translate(this.graphic.width/2, this.graphic.height/2);
		this.graphic.strokeWeight(1);
		switch(this.state){
			case "empty":
				this.graphic.noStroke();
				this.graphic.noFill();
				break;
			case "white":
				this.graphic.stroke("#000");
				this.graphic.fill("#fff");
				break;
			case "black":
				this.graphic.stroke("#000");
				this.graphic.fill("#000");
				break;
		}
		this.graphic.ellipse(0, 0, this.graphic.width - 10);
		this.graphic.pop();

		if(this.selected){
			if(currentPlayer == "p1"){
				this.graphic.stroke("#f00");
			}else if(currentPlayer == "p2"){
				this.graphic.stroke("#00f");
			}
			this.graphic.noFill();
			this.graphic.strokeWeight(4);
			this.graphic.rectMode(p.CORNER);
			this.graphic.rect(0, 0, this.graphic.width-1, this.graphic.height-1);
		}

		// Draw graphic on canvas
		p.push();
		p.translate(p.width/2, p.height/2);
		var xPosition = this.xIndex * this.squareSize;
		var yPosition = this.yIndex * this.squareSize;
		p.image(this.graphic, xPosition, yPosition);

		p.pop();
	};

	var Board = function(xSquares, ySquares, canvas){
		this.xSquares = xSquares;
		this.ySquares = ySquares;
		this.squares = [];
		this.selectedIndices = {
			p1:{
				x: 0,
				y: 0
			},
			p2:{
				x:0,
				y:0
			}
		};

		if(this.xSquares >= this.ySquares){
			// landscape orientation
			this.width = canvas.width - 5;
			this.height = this.width / this.xSquares * this.ySquares;
			this.squareSize = this.width / this.xSquares;
		}else{
			// portrait orientation
			this.height = canvas.height - 5;
			this.width = this.height / this.ySquares * this.xSquares;
			this.squareSize = this.height / this.ySquares;
		}

		for(let j=0; j<this.xSquares; j++){
			let sqs = [];
			for(let i=0; i<this.ySquares; i++){
				let sq = new BoardSquares(j, i, this.squareSize);
				sqs.push(sq);
			}
			this.squares.push(sqs);
		}

		this.selectedSquare = {
			p1: this.squares[this.selectedIndices.p1.x][this.selectedIndices.p1.y],
			p2: this.squares[this.selectedIndices.p2.x][this.selectedIndices.p2.y]
		};

		window.addEventListener("place", (e) => {
			var x = e.detail.xIndex;
			var y = e.detail.yIndex;
			var state = e.detail.state;
			var affectingState;
			if(state == "white"){
				affectingState = "black";
			}else if(state == "black"){
				affectingState = "white";
			}

			// Horizontal flip to the left
			if(x !== 0){
				let i = x-1;
				// Find the last piece
				while(i >= 0){
					if(this.squares[i][y].state == state){
						// From x to i flip
						for(let j=x-1; j>=i+1; j--){
							this.squares[j][y].flip();
						}
						break;
					}else if(this.squares[i][y].state == "empty"){
						break;
					}
					i--;
				}
			}

			// Horizontal flip to the right
			if(x !== this.xSquares){
				let i = x+1;
				// Find the last piece
				while(i < xSquares){
					if(this.squares[i][y].state == state){
						// From i to x flip
						for(let j=x+1; j<i; j++){
							this.squares[j][y].flip();
						}
						break;
					}else if(this.squares[i][y].state == "empty"){
						break;
					}
					i++;
				}
			}

			// Vertical flip to the top
			if(y !== 0){
				let i = y-1;
				// Find the last piece
				while(i >= 0){
					if(this.squares[x][i].state == state){
						// From y to i flip
						for(let j=y-1; j>=i+1; j--){
							this.squares[x][j].flip();
						}
						break;
					}else if(this.squares[x][i].state == "empty"){
						break;
					}
					i--;
				}
			}

			// Vertical flip to the bottom
			if(y !== this.ySquares){
				let i = y+1;
				// Find the last piece
				while(i < ySquares){
					if(this.squares[x][i].state == state){
						// From i to x flip
						for(let j=y+1; j<i; j++){
							this.squares[x][j].flip();
						}
						break;
					}else if(this.squares[x][i].state == "empty"){
						break;
					}
					i++;
				}
			}

			// Diagonal flip to the top left
			if(x !== 0 && y !== 0){
				let i = x-1;
				let j = y-1;
				// Find the last piece
				let pieces = [];
				while(i >= 0 && j >= 0){
					if(this.squares[i][j].state == state){
						for(let piece of pieces){
							piece.flip();
						}
						break;
					}else if(this.squares[i][j].state == "empty"){
						break;
					}else{
						pieces.push(this.squares[i][j]);
					}
					i--;
					j--;
				}
			}

			// Diagonal flip to the top right
			if(x !== xSquares && y !== 0){
				let i = x+1;
				let j = y-1;
				// Find the last piece
				let pieces = [];
				while(i < xSquares && j >= 0){
					if(this.squares[i][j].state == state){
						for(let piece of pieces){
							piece.flip();
						}
						break;
					}else if(this.squares[i][j].state == "empty"){
						break;
					}else{
						pieces.push(this.squares[i][j]);
					}
					i++;
					j--;
				}
			}

			// Diagonal flip to the bottom left
			if(x !== 0 && y !== ySquares){
				let i = x-1;
				let j = y+1;
				// Find the last piece
				let pieces = [];
				while(i >= 0 && j < ySquares){
					if(this.squares[i][j].state == state){
						for(let piece of pieces){
							piece.flip();
						}
						break;
					}else if(this.squares[i][j].state == "empty"){
						break;
					}else{
						pieces.push(this.squares[i][j]);
					}
					i--;
					j++;
				}
			}

			// Diagonal flip to the bottom right
			if(x !== xSquares && y !== ySquares){
				let i = x+1;
				let j = y+1;
				// Find the last piece
				let pieces = [];
				while(i < xSquares && j < ySquares){
					if(this.squares[i][j].state == state){
						for(let piece of pieces){
							piece.flip();
						}
						break;
					}else if(this.squares[i][j].state == "empty"){
						break;
					}else{
						pieces.push(this.squares[i][j]);
					}
					i++;
					j++;
				}
			}
		});
	};

	Board.prototype.update = function(){
		for(let j=0; j<this.squares.length; j++){
			for(let i=0; i<this.squares[j].length; i++){
				this.squares[j][i].selected = false;
			}
		}

		this.selectedSquare.p1 = this.squares[this.selectedIndices.p1.x][this.selectedIndices.p1.y];
		this.selectedSquare.p2 = this.squares[this.selectedIndices.p2.x][this.selectedIndices.p2.y];
		this.selectedSquare.p1.selected = true;
		this.selectedSquare.p2.selected = true;
	};

	Board.prototype.draw = function(){
		p.push();
		p.translate(p.width/2, p.height/2);
		p.strokeWeight(2);
		// Board frame
		p.rectMode(p.CENTER);
		p.rect(0, 0, this.width, this.height);
		// Board lines
		p.translate(-this.width/2, -this.height/2);
		for(let y=1; y<this.ySquares; y++){
			p.line(0, this.squareSize*y, this.width, this.squareSize*y);
		}
		for(let x=1; x<this.xSquares; x++){
			p.line(this.squareSize*x, 0, this.squareSize*x, this.height);
		}
		p.pop();

		// Board pieces
		p.push();
		p.translate(-this.width/2, -this.height/2);
		for(let j=0; j<this.squares.length; j++){
			for(let i=0; i<this.squares[j].length; i++){
				this.squares[j][i].draw();
			}
		}
		p.pop();
	};

	// p5 Stuff
	p.preload = function(){

	};

	p.setup = function(){
		canvas = p.createCanvas(p.windowHeight - 100, p.windowHeight - 100);
		canvas.parent("#superbug-canvas");

		b = new Board(8, 8, canvas);
		b.squares[3][3].state = "black";
		b.squares[3][4].state = "white";
		b.squares[4][4].state = "black";
		b.squares[4][3].state = "white";
	};

	p.draw = function(){
		p.background(200, 200, 200);
		b.update();
		b.draw();
	};

	// Temporary ---------------------
	p.keyReleased = function(){
		switch(p.keyCode){
			case p.UP_ARROW:
				if(b.selectedIndices.p1.y > 0){
					b.selectedIndices.p1.y--;
				}
				break;
			case p.DOWN_ARROW:
				if(b.selectedIndices.p1.y < b.ySquares-1){
					b.selectedIndices.p1.y++;
				}
				break;
			case p.LEFT_ARROW:
				if(b.selectedIndices.p1.x > 0){
					b.selectedIndices.p1.x--;
				}
				break;
			case p.RIGHT_ARROW:
				if(b.selectedIndices.p1.x < b.xSquares-1){
					b.selectedIndices.p1.x++;
				}
				break;
			case p.ENTER:
				b.selectedSquare.p1.place("white");
				break;
			case p.SHIFT:
				b.selectedSquare.p1.place("black");
				break;
			case p.BACKSPACE:
				b.selectedSquare.p1.remove();
			default:
				break;
		}

		return false;
	};
};

function moveCursor(target, direction){
	switch(direction){
		case "up":
			if(b.selectedIndices[target].y > 0){
				b.selectedIndices[target].y--;
			}
			break;
		case "down":
			if(b.selectedIndices[target].y < b.ySquares-1){
				b.selectedIndices[target].y++;
			}
			break;
		case "left":
			if(b.selectedIndices[target].x > 0){
				b.selectedIndices[target].x--;
			}
			break;
		case "right":
			if(b.selectedIndices[target].x < b.xSquares-1){
				b.selectedIndices[target].x++;
			}
			break;
		default:
			break;
	}
}

function placeAtCursor(target, state){
	return b.selectedSquare[target].place(state);
}

function removeAtCursor(target){
	return b.selectedSquare[target].remove();
}

$(document).ready(function() {
	new p5(sketch);

	socket = io("http://localhost:3001/board");

	socket.on("move", function(data){
		moveCursor(data.target, data.direction);
	});

	socket.on("place", function(data){
		if(!placeAtCursor(data.target, data.state)){
			// Invalid placement
			socket.emit("invalid placement", data);
		}
	});

	socket.on("remove", function(data){
		if(!removeAtCursor(data.target)){
			// Invalid remove location
			socket.emit("invalid remove location", data);
		}
	});
});