'use strict'


const CANVAS_SIZE = 700;
const INFO_CANVAS_SIZE = 800;
const INFO_OFFSET = 45;
const GRID_SIZE = CANVAS_SIZE/FLOOR_SIZE;
const HALF_GRID = GRID_SIZE/2;
const WIDTH_FLOOR = GRID_SIZE - 20;
const WIDTH_FLOOR_OFFSET = (GRID_SIZE-WIDTH_FLOOR)/2;

var Stage = (function() { //Stage namespace (module pattern)						

	var COLOR_WALL = '#71BF76';
	var COLOR_OUTLINE = '#786f5e';
	var COLOR_PLAYER1 = '#ff4242';
	var COLOR_PLAYER2 = '#7092BE';//'#3333aa';		

	var COLOR_SELECTED = '#aaa';
	var COLOR_HOVER_FLOOR = '#eeeeff';
	var COLOR_HOVER_WALL = '#eeeeff';
			
	var COLOR_GRID = '#333';	
	var COLOR_PLAYERS = [COLOR_PLAYER1, COLOR_PLAYER2];
	var COLOR_PATHS = ['#FF7575', '#BDDFFF'];
	var COLOR_PAWN_OUTLINES = ['#E62929', '#5779A5' ];	
	
	//TODO: change to size?
	var WIDTH_PATH = 8;
	var WIDTH_WIN = 3;	
	var WIDTH_PAWN = HALF_GRID/2;
	var WIDTH_GRID = 0.5;	
	var WIDTH_HOVER = WIDTH_PAWN + 5;
	var WIDTH_OUTLINE = 1;
	var WIDTH_SELECTED = 5;	
	
	var WIDTH_WALL_LONG = (GRID_SIZE * 2)-WIDTH_FLOOR_OFFSET;
	var WIDTH_WALL_SHORT = 20;
		
					
	const KEY_Z = 90;
	const KEY_Y = 89;
	const KEY_LEFT = 37;
	const KEY_RIGHT = 39;
	const KEY_UP = 38;
	const KEY_DOWN = 40;

	const KEY_W = 87;
	const KEY_A = 65;
	const KEY_S = 83;
	const KEY_D = 68;

	const KEY_1 = 49;
	const KEY_2 = 50;

	const KEY_SPACE = 32;
	
	var DELAY_MOVE = 500;
	var DELAY_WIN_MESSAGE = 100;
		
	//var MODE_PLAY = 0;
	var MODE_ANIM = 1;
	var MODE_EDIT = 2;
		
	var canvas;	
	var canvasBounds;	
	
	var ctx;	
	var infoCtx;
	
	var board;
	var cursor = new Cursor();	
	
	var tween;
	var animInfo = {};	
	var mode = MODE_PLAY;
		
					

	function init(newGame) { 	

		//Menu				
		var menuManager = new MenuManager();
		menu = menuManager.properties;				
		
		board = newGame.board.copy();			

		canvas = document.getElementById('mainCanvas');
		canvasBounds = canvas.getBoundingClientRect(); 
		ctx = canvas.getContext('2d');    			
		ctx.font = 'bold 15px Verdana';

		var infoCanvas = document.getElementById('infoCanvas');
		infoCtx = infoCanvas.getContext('2d');
		infoCtx.font = 'bold 15px Verdana';
		
		
		//Event callbacks
		canvas.addEventListener('click', onMouseClick.bind(this), false);
		canvas.addEventListener('mousemove', onMouseMove.bind(this), false);		
		window.addEventListener('keydown', onKeyDown.bind(this), false);				
		window.addEventListener('keyup', onKeyUp.bind(this), false);		
		window.addEventListener('scroll', onWindowScroll.bind(this), false);		
		
		//Game event callbacks
		game.addEventListener(EVENT_INVALID, onGameInvalid.bind(this));
		game.addEventListener(EVENT_GAME_OVER, onGameOver.bind(this));
		game.addEventListener(EVENT_PLAYED, onGamePlayed.bind(this));
		game.addEventListener(EVENT_BOARD_UPDATE, onGameBoardUpdate.bind(this));		
		game.addEventListener(EVENT_MESSAGE, sendMessage.bind(this));		
		
		draw(); 		
	}

	
	//Mouse and Keyboard Events	
	function onKeyDown(e) {	
		if (mode == MODE_ANIM) { //Snap to position
			mode = MODE_PLAY;			
			return;
		}			
		else if (!game.canHumanPlay()) return; //AI's turn
		
		var move = INVALID;		
		
		if (e.ctrlKey ) {
			
			//Undo move with Ctrl + Z
			if (e.keyCode == KEY_Z) game.undoMove();
							
			//Redo move with Ctrl + Y
			else if (e.keyCode == KEY_Y) game.redoMove(); 
				
			else if (e.keyCode == KEY_1) {
				board.turn = PLAYER1;
				game.updateBoard(board);
				e.preventDefault();
			}
			else if (e.keyCode == KEY_2) {
				board.turn = PLAYER2;
				game.updateBoard(board);
				e.preventDefault();
			}
			
			else if (e.keyCode == KEY_UP) {
				move = board.getMoveFromDir(FORWARD);
				board.makeMove(move);
				game.updateBoard(board);
			}
			else if (e.keyCode == KEY_LEFT) {
				move = board.getMoveFromDir(LEFT);
				board.makeMove(move);
				game.updateBoard(board);
			}
			else if (e.keyCode == KEY_DOWN) {
				move = board.getMoveFromDir(BACKWARD);
				board.makeMove(move);
				game.updateBoard(board);
			}
			else if (e.keyCode == KEY_RIGHT) {
				move = board.getMoveFromDir(RIGHT);
				board.makeMove(move);
				game.updateBoard(board);
			}

			else mode = MODE_EDIT;
		}
		else if (e.keyCode == KEY_W || e.keyCode == KEY_UP) move = board.getMoveFromDir(FORWARD);
		else if (e.keyCode == KEY_A || e.keyCode == KEY_LEFT) move = board.getMoveFromDir(LEFT);
		else if (e.keyCode == KEY_S || e.keyCode == KEY_DOWN) move = board.getMoveFromDir(BACKWARD);
		else if (e.keyCode == KEY_D || e.keyCode == KEY_RIGHT) move = board.getMoveFromDir(RIGHT);
		else if (e.keyCode == KEY_SPACE) {			
			console.log('here');
			if (game.players[board.turn] != PLAYER_HUMAN) game.play();
		}

		if (move != INVALID) {
			if (board.onBoard(move.sr, move.sc) && board.onBoard(move.dr, move.dc)) {			
				game.onPlayed(move);
			}
		}


	}
	
	function onKeyUp(e) {	
		if (mode == MODE_EDIT) mode = MODE_PLAY;
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
		var turn = board.turn;
		if (!game.canHumanPlay()) return; //AI's turn
		
		var x = e.clientX - canvasBounds.left; 
		var y = e.clientY - canvasBounds.top;  

		cursor.update(x,y);	
		

		//Check bounds
		if (!board.onBoard(cursor.floor.r, cursor.floor.c)) return;
		
						
		//Pawn moving on floor		
		var wallType = cursor.type;
		if (wallType == FLOOR) {
			var pawn = board.pawns[turn];
			if (board.canSelect(cursor.floor.r, cursor.floor.c)) cursor.selectCurrent();
			else game.onPlayed({sr:cursor.selected.r, sc:cursor.selected.c, dr:cursor.floor.r, dc:cursor.floor.c, type:FLOOR});			
		}
		//Wall placement
		else if (wallType == V_WALL || wallType == H_WALL) {
			if (mode == MODE_EDIT) {
				var wr = cursor.wall.r;
				var wc = cursor.wall.c;
				if (board.walls[wr][wc] != NO_WALL) board.removeWall(cursor.wall.r, cursor.wall.c);
				else board.walls[wr][wc] = wallType;
				game.updateBoard(board);
			}
			else game.onPlayed({r:cursor.wall.r, c:cursor.wall.c, type:wallType});			
		}
	}			
	
	function onWindowScroll(e) {
		canvasBounds = canvas.getBoundingClientRect(); 
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
		var winDelta = game.board.paths[loser].length;
		var winText = (winner == PLAYER1)? 'Player 1' : 'Player 2';
		var message;
		if (winDelta < 10) message = 'Game over! ' + winText + ' wins';
		else if (winDelta < 15) message = 'GLORIOUS WIN!!\r\n' + winText + ' wins';
		else if (winDelta < 25) message = 'DOMINATING WIN!!\r\n' + winText + ' wins';
		else message = 'GOD-LIKE WIN!!\r\n' + winText + ' wins';		

		board = game.board.copy();
		setTimeout(function() {
			alert(message);
			sendMessage(message);
		}, DELAY_WIN_MESSAGE);
	}
	
	function onGamePlayed(playerType, move, oldTurn) {		
		cursor.selectOn = false;
		animMove(move, playerType, oldTurn, function() {			
			board = game.board.copy();
			var boardStr = board.toString();
			Url.setHash(boardStr);
						
			//var nextPlayer = game.players[board.turn];
			//var moveDelay = DELAY_MOVE;
			setTimeout(function() {
				if (!board.isGameOver()) game.play();
			}, DELAY_MOVE); //Next move
		});
	}
	
	function onGameBoardUpdate(newBoard) {		
		board = newBoard;	
	}
		
	
	function animMove(move, initiatingPlayer, oldTurn, callback) {	
		if (initiatingPlayer == PLAYER_HUMAN || move.type != FLOOR) {		
			return callback();//Skip animation for human
		}
		mode = MODE_ANIM;	
		animInfo = {
			r:move.sr,
			c:move.sc,
			x:(move.sc * GRID_SIZE), 
			y:(move.sr * GRID_SIZE),
			oldTurn:oldTurn
		};	
		
		tween = new TWEEN.Tween(animInfo)
			.to({x:(move.dc * GRID_SIZE), y:(move.dr * GRID_SIZE)}, menu.animSpeed)	
			.easing(TWEEN.Easing.Quadratic.In)		
			.onUpdate(function() {				
				if (mode != MODE_ANIM) { //Prematurely end animation				
					tween.stop();
					callback();
				}			
			})
			.onComplete(function() {
				mode = MODE_PLAY;
				callback();
			})
			.start();
	}
	
	//Drawing
	function draw(time) {			
		ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		infoCtx.clearRect(0, 0, INFO_CANVAS_SIZE, INFO_CANVAS_SIZE+20);
		
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
			ctx.fillStyle = COLOR_HOVER_WALL;
			ctx.fillRect(cursor.wall.x - WIDTH_FLOOR, cursor.wall.y, WIDTH_WALL_LONG-WIDTH_FLOOR_OFFSET, WIDTH_WALL_SHORT);			
		}
		else if (cursor.type == V_WALL) { //Vertical			
			ctx.fillStyle = COLOR_HOVER_WALL;
			ctx.fillRect(cursor.wall.x, cursor.wall.y - WIDTH_FLOOR, WIDTH_WALL_SHORT, WIDTH_WALL_LONG-WIDTH_FLOOR_OFFSET);			
		}
		else if (cursor.type == FLOOR) { //Floor
			ctx.fillStyle = COLOR_HOVER_FLOOR;
			ctx.fillRect((cursor.floor.c*GRID_SIZE)+WIDTH_FLOOR_OFFSET, (cursor.floor.r*GRID_SIZE)+WIDTH_FLOOR_OFFSET, WIDTH_FLOOR, WIDTH_FLOOR);
		}

		//Walls
		var wallPos = 0;
		for (var r = 0; r < WALL_SIZE; r++) {
			var y = (r* GRID_SIZE) + GRID_SIZE;
			for (var c = 0; c < WALL_SIZE; c++) {
				var x = (c * GRID_SIZE)+GRID_SIZE;
				var wall = board.walls[r][c];

				//Wall Centers				
				if (menu.showCenters) {
					ctx.fillStyle = COLOR_OUTLINE;
					drawCircle(ctx, x-WIDTH_FLOOR_OFFSET, y-WIDTH_FLOOR_OFFSET, WIDTH_FLOOR_OFFSET, 0 );
					
					if (menu.showPositions) {
						ctx.fillStyle = '#FFFFFF';	
						ctx.fillText(wallPos, x-5, y+5)
					}
					
				}
				else if (menu.showPositions) {					
					ctx.fillStyle = 'darkblue';	
					ctx.fillText(wallPos, x-5, y+5)					
				}
									
	
				//Walls
				if (wall == H_WALL){ //Horizontal
					if (menu.showWallColors && board.wallPlacers[r][c] != INVALID) ctx.fillStyle = COLOR_PLAYERS[board.wallPlacers[r][c]];
					else ctx.fillStyle = COLOR_WALL;
					ctx.fillRect(x - WIDTH_FLOOR-WIDTH_FLOOR_OFFSET, y-WIDTH_FLOOR_OFFSET, WIDTH_WALL_LONG-WIDTH_FLOOR_OFFSET, WIDTH_WALL_SHORT);
				}
				else if (wall == V_WALL) { //Vertical
					if (menu.showWallColors && board.wallPlacers[r][c] != INVALID) ctx.fillStyle = COLOR_PLAYERS[board.wallPlacers[r][c]];
					else ctx.fillStyle = COLOR_WALL;
					ctx.fillRect(x-WIDTH_FLOOR_OFFSET, y - WIDTH_FLOOR-WIDTH_FLOOR_OFFSET, WIDTH_WALL_SHORT, WIDTH_WALL_LONG-WIDTH_FLOOR_OFFSET);
				}
				
			wallPos++;
			}
		}
		

		//Hover Wall Center
		if (menu.showCenters) {
			ctx.fillStyle = 'red';		
			drawCircle(ctx, cursor.wall.x, cursor.wall.y, WIDTH_FLOOR_OFFSET, 0);
		}
		
		if (menu.showPath) {
			drawPath(PLAYER1, COLOR_PATHS[PLAYER1]);
			drawPath(PLAYER2, COLOR_PATHS[PLAYER2]);			
		}
		
		//Selected Pawn outline
		if (cursor.selectOn) {					
			ctx.fillStyle = COLOR_HOVER_FLOOR;
			ctx.fillRect((cursor.selected.c*GRID_SIZE)+WIDTH_FLOOR_OFFSET, (cursor.selected.r*GRID_SIZE)+WIDTH_FLOOR_OFFSET, WIDTH_FLOOR, WIDTH_FLOOR);			
		}
		

		//Pawns
		for (var p = 0; p < PLAYERS; p++) {			
			var pawn = board.pawns[p];			
			//Active pawn outline	
			if (mode == MODE_ANIM && animInfo.oldTurn == p) continue;	
			else if (p == board.turn) drawPawn(pawn.c * GRID_SIZE, pawn.r * GRID_SIZE, COLOR_PAWN_OUTLINES[board.turn], WIDTH_PAWN+WIDTH_SELECTED, p, false);	
						
			drawPawn(pawn.c * GRID_SIZE, pawn.r * GRID_SIZE, COLOR_PLAYERS[p], WIDTH_PAWN, p, true);
			
		}
						
		drawWallCount((CANVAS_SIZE/2), CANVAS_SIZE+INFO_OFFSET+15, PLAYER1);
		drawWallCount((CANVAS_SIZE/2), 5, PLAYER2);

		//Draw debug
		if (menu.showGrid) drawGrid();
		if (menu.showLabels) drawLabels();
		if (menu.showCoordinates) drawCoordinates();
		if (menu.showPositions) drawPositions();
		
		
		//Animation
		if (mode == MODE_ANIM) {
			var x = animInfo.x;
			var y = animInfo.y;			
			drawPawn(x, y, COLOR_PLAYERS[animInfo.oldTurn], WIDTH_PAWN, animInfo.oldTurn, true);			
		}
		

		TWEEN.update(time);
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
		infoCtx.fillStyle = COLOR_OUTLINE;					
		for (var i = 0; i < FLOOR_SIZE; i++) {
			var unit = i * GRID_SIZE;			
			var offset = unit + HALF_GRID + INFO_OFFSET + 5;
			infoCtx.fillText(FLOOR_SIZE-i, INFO_OFFSET-5, offset);	//Vertical left label
			infoCtx.fillText(FLOOR_SIZE-i, CANVAS_SIZE+INFO_OFFSET-5, offset);	//Vertical right label

			infoCtx.fillText(String.fromCharCode(65 + i), offset-10, INFO_OFFSET+5);	//Horizontal top label
			infoCtx.fillText(String.fromCharCode(65 + i), offset-10, CANVAS_SIZE+INFO_OFFSET+5);	//Horizontal bottom label
		}	
	}
		
	function drawPawn(x, y, color, size, turn, drawDist) {
		
		var pawnCenter = HALF_GRID-size;
		ctx.fillStyle = color;
		drawCircle(ctx, x + pawnCenter, y + pawnCenter, size, 0); 

		//Number on top of path
		if (drawDist && menu.showDistance) {
			ctx.fillStyle = COLOR_PAWN_OUTLINES[turn];
			var path = board.paths[turn].length.toString();		
			ctx.fillText(path, x+HALF_GRID-(path.length*5), y+HALF_GRID+5);
		}
	}
			
	
	function drawTurn(turn) {		
		var text = (turn == PLAYER1)? 'Player 1' : 'Player 2';
				
		infoCtx.fillStyle = COLOR_OUTLINE;
		infoCtx.fillText(text, 10, 20);		
	}

	function drawPositions() {
		ctx.fillStyle = '#b0b0b0';
		var i = 0;
		for (var r = 0; r < FLOOR_SIZE; r++) {
			var y = (r+1) *GRID_SIZE;
			for (var c = 0; c < FLOOR_SIZE; c++) {
				var x = (c+1) * GRID_SIZE;
				ctx.fillText(i++, x-35, y-15);
			}
		}
	}

	function drawWallCount(x, y, turn) {
		var WIDTH_WALLCOUNT = 30;
		var wallCounts = board.wallCounts[turn];
		var center = (WIDTH_WALLCOUNT*wallCounts)/2-20;				

		//Digit(s)		
		infoCtx.fillStyle = COLOR_PLAYERS[turn];
		infoCtx.fillText(wallCounts, x-center+(WIDTH_WALLCOUNT*wallCounts)-5, y+15);

		//Symbolic representation		
		for (var w = 0; w < wallCounts; w++) {
			var unit = w * WIDTH_WALLCOUNT;
			infoCtx.fillRect(x-center+unit, y, 15, 20);	
		}
		
	}
	
	function drawCoordinates() {
		var coords;
		if (cursor.type == FLOOR) coords = cursor.floor.r + ',' + cursor.floor.c;
		else coords = cursor.wall.r + ',' + cursor.wall.c;

		infoCtx.fillStyle = COLOR_OUTLINE;
		infoCtx.fillText('(' + coords + ')', 10, INFO_CANVAS_SIZE+5);				
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