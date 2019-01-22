'use strict'

const CANVAS_SIZE = 700;
const GRID_SIZE = CANVAS_SIZE/FLOOR_SIZE;
const HALF_GRID = GRID_SIZE/2;
const WIDTH_FLOOR = GRID_SIZE - 20;
const WIDTH_FLOOR_OFFSET = (GRID_SIZE-WIDTH_FLOOR)/2;

var Stage = (function() { //Stage namespace (module pattern)						

	var COLOR_WALL = '#33aa33';
	var COLOR_PATH = '#786f5e';
	var COLOR_PLAYER1 = '#ff4242';
	var COLOR_PLAYER2 = '#3333aa';		

	var COLOR_SELECTED = '#aaa';
	var COLOR_HOVER_FLOOR = '#eeeeff';
	var COLOR_HOVER_WALL = '#eeeeff';
	var COLOR_OUTLINE = '#333';			
	var COLOR_GRID = '#333';
	//var COLOR_SUGGEST = 'aqua';
	var COLOR_PLAYERS = [COLOR_PLAYER1, COLOR_PLAYER2];
	var COLOR_PATHS = ['pink', 'cyan'];
	
	//TODO: change to size?
	var WIDTH_PATH = 8;
	var WIDTH_WIN = 3;	
	var WIDTH_PAWN = HALF_GRID/2;
	var WIDTH_GRID = 0.5;	
	var WIDTH_HOVER = WIDTH_PAWN + 5;
	var WIDTH_OUTLINE = 1;
	var WIDTH_SELECTED = 5;
	var WIDTH_SUGGEST = 6;
	
	var WIDTH_WALL_LONG = (GRID_SIZE * 2)-WIDTH_FLOOR_OFFSET;
	var WIDTH_WALL_SHORT = 20;
		
					
	var KEY_Z = 90;
	var KEY_Y = 89;
	var KEY_LEFT = 37;
	var KEY_RIGHT = 39;

	var KEY_W = 87;
	var KEY_A = 65;
	var KEY_S = 83;
	var KEY_D = 68;
	
	var DELAY_MOVE = 500;
	var DELAY_WIN_MESSAGE = 100;
		
	var MODE_PLAY = 0;
	var MODE_ANIM = 1;
		
	var canvas;	
	var canvasBounds;
	
	var ctx;	
	
	var board;
	var cursor = new Cursor();	
	
	var animInfo = {};
	var turn;
	var mode = MODE_PLAY;
	//var suggested = {sr:INVALID, sc:INVALID, dr:INVALID, dc:INVALID};		
			
	function getInvalidMessage(invalidCode) {
		switch(invalidCode) {
			case VALID: return 'Valid';
			case INVALID_MOVE: return 'Nope: can only move one square...'; 
			case INVALID_MOVE_WALL: return 'Nope: unable to move through wall...'; 
			case INVALID_MOVE_DIAGONAL: return 'Nope: unable to move diagonal, unless jump...'; 
			case INVALID_JUMP: return 'Nope: jumps must be over a pawn or diagonal with a wall...'; 
			case INVALID_SOURCE: return 'Nope: not your pawn...'; 
			case INVALID_TURN: return 'Nope: wrong player...';
			case INVALID_BOUNDS: return 'Nope: must move on the board...';
			case INVALID_DESTINATION: return 'Nope: destination not empty...';
			case INVALID_PATH: return 'Nope: you can\'t block the other pawn\'s path entirely...';
			case INVALID_WALL_COUNT: return 'Nope: you are out of walls to place...';
			default: return 'Nope: invalid...';
		}
	}
	

	function init(newGame) { 	

		//Menu				
		var menuManager = new MenuManager();
		menu = menuManager.properties;				
		
		board = newGame.board.copy();			
		board.hasPath(PLAYER1);
		board.hasPath(PLAYER2);
		canvas = document.getElementById('mainCanvas');
		canvasBounds = canvas.getBoundingClientRect(); 
		ctx = canvas.getContext('2d');    			
		ctx.font = 'bold 15px Verdana';
		
		
		//Event callbacks
		canvas.addEventListener('click', onMouseClick.bind(this), false);
		window.addEventListener('keydown', onKeyDown.bind(this), false);				
		canvas.addEventListener('mousemove', onMouseMove.bind(this), false);		
		
		//Game event callbacks
		game.addEventListener(EVENT_INVALID, onGameInvalid.bind(this));
		game.addEventListener(EVENT_GAME_OVER, onGameOver.bind(this));
		game.addEventListener(EVENT_PLAYED, onGamePlayed.bind(this));
		game.addEventListener(EVENT_BOARD_UPDATE, onGameBoardUpdate.bind(this));
		game.addEventListener(EVENT_SUGGEST, onGameSuggest.bind(this));
		
		draw(); 		
	}

	
	//Mouse and Keyboard Events	
	function onKeyDown(e) {	
		var changed = false;		
				
		var move = INVALID;

		if (e.ctrlKey || e.keyCode == KEY_LEFT || e.keyCode == KEY_RIGHT) {
			//Undo move with Ctrl + Z
			if (e.keyCode == KEY_Z || e.keyCode == KEY_LEFT) { 
				changed = game.undoMove();
			}
			//Redo move with Ctrl + Y
			else if (e.keyCode == KEY_Y || e.keyCode == KEY_RIGHT) { 
				changed = game.redoMove();
			}
			
			//Update state
			if (changed) {

				board = game.board;
			}
		}
		else if (e.keyCode == KEY_W) move = board.getMoveFromDir(FORWARD);
		else if (e.keyCode == KEY_A) move = board.getMoveFromDir(LEFT);
		else if (e.keyCode == KEY_S) move = board.getMoveFromDir(BACKWARD);
		else if (e.keyCode == KEY_D) move = board.getMoveFromDir(RIGHT);

		if (move != INVALID) {
			if (board.onBoard(move.sr, move.sc) && board.onBoard(move.dr, move.dc)) {			
				game.onPlayed(move);
			}
		}
	}
	


	function onMouseMove(e) {	
		var x = e.clientX - canvasBounds.left; 
		var y = e.cursorY = e.clientY - canvasBounds.top;  
	
		cursor.update(x,y);		
		
	}

	function onMouseClick(e) {
		if (mode == MODE_ANIM) { //Snap to position
			mode = MODE_PLAY;
			return;
		}
		var x = e.clientX - canvasBounds.left; 
		var y = e.clientY - canvasBounds.top;  

		cursor.update(x,y);	
		

		//Check bounds
		if (!board.onBoard(cursor.floor.r, cursor.floor.c)) return;
		
		var turn = board.turn;
		if (game.players[turn] != PLAYER_HUMAN) return;
						
		//Pawn moving on floor		
		var wallType = cursor.type;
		if (wallType == FLOOR) {
			var pawn = board.pawns[turn];
			if (board.canSelect(cursor.floor.r, cursor.floor.c)) cursor.selectCurrent();
			else game.onPlayed({sr:cursor.selected.r, sc:cursor.selected.c, dr:cursor.floor.r, dc:cursor.floor.c, type:FLOOR});			
		}
		//Wall placement
		else if (wallType == V_WALL || wallType == H_WALL) {
			game.onPlayed({r:cursor.wall.r, c:cursor.wall.c, type:wallType});			
		}
	}			
	
	function sendMessage(text) {	
		var msg = document.getElementById('message');
		msg.innerText = text;
		msg.style.display = 'block';
		setTimeout(function() {
			msg.style.display = 'none';
		}, 3000);

	}
	
	//Game events
	function onGameInvalid(msg, code) {
		var message = msg + getInvalidMessage(code);		
		sendMessage(message);
	}
	
	function onGameOver(winner, loser) {		
		var winText = (winner == PLAYER1)? 'Player 1' : 'Player 2';
		var message = 'Game over! ' + winText + ' wins';
		board = game.board.copy();
		setTimeout(function() {
			alert(message);
			sendMessage(message);
		}, DELAY_WIN_MESSAGE);
	}
	
	function onGamePlayed(playerType, move) {
		//suggested = {sr:INVALID, sc:INVALID, dr:INVALID, dc:INVALID};	
		cursor.selectOn = false;
		//animMove(move, playerType, function() {			
			board = game.board.copy();
			var boardStr = board.toString();
			Url.setHash(boardStr);
						
			//var nextPlayer = game.players[board.turn];
			//var moveDelay = DELAY_MOVE;
			setTimeout(function() {
				if (!board.isGameOver()) game.play();
			}, DELAY_MOVE); //Next move
		//});
	}
	
	function onGameBoardUpdate(newBoard) {		
		board = newBoard;	
	}
	
	function onGameSuggest(player, move) {
		//suggested = move;
		//console.log(suggested);
	}
	
	function animMove(move, initiatingPlayer, callback) {	
		//if (initiatingPlayer == PLAYER_HUMAN) {
		//	//if (!menu.animateHuman) 
		//	return callback();//Skip animation for human
		//}
		//mode = MODE_ANIM;	
		//animInfo = {
		//	r:move.sr,
		//	c:move.sc,
		//	x:(move.sc * GRID_SIZE), 
		//	y:(move.sr * GRID_SIZE)
		//};	
		//
		//var tween = new TWEEN.Tween(animInfo)
		//.to({x:(move.dc * GRID_SIZE), y:(move.dr * GRID_SIZE)}, menu.animSpeed)	
		//.easing(TWEEN.Easing.Quadratic.In)		
		//.onUpdate(function() {				
		//	if (mode != MODE_ANIM) { //Prematurely end animation				
		//		tween.stop();
		//		callback();
		//	}			
		//})
		//.onComplete(function() {
		//	mode = MODE_PLAY;
		//	callback();
		//})
		//.start();
	}
	
	//Drawing
	function draw(time) {			
		ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		
		//Turn
		var turn = board.turn;		
		drawTurn(turn);
		
		//Floor squares
		for (var r = 0; r < FLOOR_SIZE; r++) {
			var y = r * GRID_SIZE;
			for (var c = 0; c < FLOOR_SIZE; c++) {
				var x = c * GRID_SIZE;
				ctx.strokeRect(x+WIDTH_FLOOR_OFFSET, y+WIDTH_FLOOR_OFFSET, WIDTH_FLOOR, WIDTH_FLOOR);	
			}
		}

		//Hover 		
		if (cursor.type == H_WALL) { //Horizontal
			//if (board.walls[cursor.wall.r][cursor.wall.c] != V_WALL) {
				ctx.fillStyle = COLOR_HOVER_WALL;
				ctx.fillRect(cursor.wall.x - WIDTH_FLOOR, cursor.wall.y, WIDTH_WALL_LONG-WIDTH_FLOOR_OFFSET, WIDTH_WALL_SHORT);
			//}
		}
		else if (cursor.type == V_WALL) { //Vertical
			//if (board.walls[cursor.wall.r][cursor.wall.c] != H_WALL) {
				ctx.fillStyle = COLOR_HOVER_WALL;
				ctx.fillRect(cursor.wall.x, cursor.wall.y - WIDTH_FLOOR, WIDTH_WALL_SHORT, WIDTH_WALL_LONG-WIDTH_FLOOR_OFFSET);
			//}
		}
		else if (cursor.type == FLOOR) { //Floor
			ctx.fillStyle = COLOR_HOVER_FLOOR;
			ctx.fillRect((cursor.floor.c*GRID_SIZE)+WIDTH_FLOOR_OFFSET, (cursor.floor.r*GRID_SIZE)+WIDTH_FLOOR_OFFSET, WIDTH_FLOOR, WIDTH_FLOOR);
		}

		//Walls
		for (var r = 0; r < WALL_SIZE; r++) {
			var y = (r* GRID_SIZE) + GRID_SIZE;
			for (var c = 0; c < WALL_SIZE; c++) {
				var x = (c * GRID_SIZE)+GRID_SIZE;
				var wall = board.walls[r][c];

				//Wall Centers				
				if (menu.showCenters) {
					ctx.fillStyle = COLOR_PATH;
					drawCircle(ctx, x-WIDTH_FLOOR_OFFSET, y-WIDTH_FLOOR_OFFSET, WIDTH_FLOOR_OFFSET, 0 );
				}

	
				//Walls
				if (wall == H_WALL){ //Horizontal
					ctx.fillStyle = COLOR_WALL;
					ctx.fillRect(x - WIDTH_FLOOR-WIDTH_FLOOR_OFFSET, y-WIDTH_FLOOR_OFFSET, WIDTH_WALL_LONG-WIDTH_FLOOR_OFFSET, WIDTH_WALL_SHORT);
				}
				else if (wall == V_WALL) { //Vertical
					ctx.fillStyle = COLOR_WALL;
					ctx.fillRect(x-WIDTH_FLOOR_OFFSET, y - WIDTH_FLOOR-WIDTH_FLOOR_OFFSET, WIDTH_WALL_SHORT, WIDTH_WALL_LONG-WIDTH_FLOOR_OFFSET);
				}
				
			}
		}
		

		//Hover Wall Center
		if (menu.showCenters) {
			ctx.fillStyle = 'red';		
			drawCircle(ctx, cursor.wall.x, cursor.wall.y, WIDTH_FLOOR_OFFSET, 0);
		}
		
		
		//Selected Pawn outline
		if (cursor.selectOn) {					
			ctx.fillStyle = COLOR_HOVER_FLOOR;
			ctx.fillRect((cursor.selected.c*GRID_SIZE)+WIDTH_FLOOR_OFFSET, (cursor.selected.r*GRID_SIZE)+WIDTH_FLOOR_OFFSET, WIDTH_FLOOR, WIDTH_FLOOR);			
		}

		//Active pawn outline
		var pawn = board.pawns[board.turn];		
		drawPawn(pawn.c * GRID_SIZE, pawn.r * GRID_SIZE, COLOR_SELECTED, WIDTH_PAWN+WIDTH_SELECTED);

		//Pawns
		for (var p = 0; p < PLAYERS; p++) {
			var pawn = board.pawns[p];
			drawPawn(pawn.c * GRID_SIZE, pawn.r * GRID_SIZE, COLOR_PLAYERS[p], WIDTH_PAWN);
		}
						
		drawWallCounts();

		//Draw debug
		if (menu.showGrid) drawGrid();
		if (menu.showLabels) drawLabels();
		if (menu.showCoordinates) drawCoordinates();
		if (menu.showPath) {
			drawPath(PLAYER1, COLOR_PATHS[PLAYER1]);
			drawPath(PLAYER2, COLOR_PATHS[PLAYER2]);
		}
		
		
		//Animation
		//if (mode == MODE_ANIM) {
		//	var x = animInfo.x;
		//	var y = animInfo.y;
		//	drawPawn(x, y, COLOR_SELECTED, WIDTH_HOVER + WIDTH_OUTLINE); 
		//	drawPawn(x, y, animColor, WIDTH_PIN); 	
		//}
		//
		//TWEEN.update(time);
		requestAnimationFrame(draw.bind(this)); //Repaint	
	}
	
	
	function drawGrid() {
		ctx.lineWidth = WIDTH_GRID;
		ctx.strokeStyle = COLOR_GRID;				
		var labelOffset = HALF_GRID;
		for (var i = 0; i < FLOOR_SIZE; i++) {
			var unit = i * GRID_SIZE;
			drawLine(ctx, unit, 0, unit, CANVAS_SIZE);
			drawLine(ctx, 0, unit, CANVAS_SIZE, unit);
						
		}		
		
	}
	
	function drawLabels() {	
		ctx.fillStyle = COLOR_PATH;			
		
		var labelOffset = HALF_GRID;
		for (var i = 0; i < FLOOR_SIZE; i++) {
			var unit = i * GRID_SIZE;			
			
			ctx.fillText(i+1, 10, unit + labelOffset + 5);	//Vertical label
			ctx.fillText(String.fromCharCode(65 + i), unit + labelOffset - 5, CANVAS_SIZE - 10);	//Horizontal label
		}	
	}
		
	function drawPawn(x, y, color, size) {
		
		var pawnCenter = HALF_GRID-size;
		ctx.fillStyle = color;
		drawCircle(ctx, x + pawnCenter, y + pawnCenter, size, 0); 
		
	}
			
	
	function drawTurn(turn) {		
		var text = (turn == PLAYER1)? 'Player 1' : 'Player 2';
				
		ctx.fillStyle = COLOR_PATH;
		ctx.fillText(text, 10, 15);		
	}

	function drawWallCounts() {								
		ctx.fillStyle = COLOR_PATH;
		ctx.fillText(board.wallCounts[PLAYER1], CANVAS_SIZE-HALF_GRID, CANVAS_SIZE);	//Player 1	
		ctx.fillText(board.wallCounts[PLAYER2],  CANVAS_SIZE-HALF_GRID, 20);	//Player 2	
	}
	
	function drawCoordinates() {
		var coords;
		if (cursor.type == FLOOR) coords = cursor.floor.r + ',' + cursor.floor.c;
		else coords = cursor.wall.r + ',' + cursor.wall.c;

		ctx.fillStyle = COLOR_PATH;
		ctx.fillText('(' + coords + ')', 10, CANVAS_SIZE);				
	}
		
	function drawPath(turn, color) {
		var path = board.paths[turn];
		ctx.fillStyle = color;
		var offset = turn*10;
		for (var p = 0; p < path.length; p++) {
			var pos = path[p];
			ctx.fillRect((pos.c*GRID_SIZE)+HALF_GRID-10, (pos.r*GRID_SIZE)+HALF_GRID-10+offset, 20, 20);	
		}

	}
	//Export
	return {init:init, sendMessage:sendMessage};
})();
//End Stage namespace