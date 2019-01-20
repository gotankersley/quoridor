const VALID = 0;
const INVALID = -1;
const INVALID_JUMP = 1;
const INVALID_SOURCE = 2;
const INVALID_MOVE = 3;
const INVALID_MOVE_WALL = 4;
const INVALID_MOVE_DIAGONAL = 5;
const INVALID_TURN = 6;
const INVALID_BOUNDS = 7;
const INVALID_DESTINATION = 8;
const INVALID_PATH = 9;
const INVALID_WALL_COUNT = 10;


const WALL_SIZE = 8;
const FLOOR_SIZE = 9;
const FLOOR_SPACES = 81;
const CENTER_SPACE = 4;

const PLAYER1 = 0;
const PLAYER2 = 1;
const PLAYERS = 2
const EMPTY = -1; 

const NO_WALL = 0;
const V_WALL = 1;
const H_WALL = 2;
const FLOOR = 3;


const FORWARD = 0;
const LEFT = 1;
const RIGHT = 2;
const BACKWARD = 3;

const STARTING_WALLS = 10;
const STARTING_ROWS = [FLOOR_SIZE-1, 0];
const ENDING_ROWS = [0, FLOOR_SIZE-1];
const SEARCH_DIRS_BY_PLAYER = [
	//Player1
	[
		{r:-1,c:0}, //Forward
		{r:0, c:1}, //Left
		{r:0, c:-1}, //Right
		{r:1, c:0}, //Backward
	],

	//Player2
	[
		{r:1,c:0}, //Forward
		{r:0, c:1}, //Left
		{r:0, c:-1}, //Right
		{r:-1, c:0}, //Backward
	],
];
const MOVE_DELTAS_BY_DIR = [
	{r:-1, c:0}, //Forward,
	{r:0, c:-1}, //Left,
	{r:0, c:1}, //Right,
	{r:1, c:0}, //Backward,
];


//Class Board 
function Board() {	
	
	this.turn = PLAYER1;
	this.pawns = [{r:WALL_SIZE, c:CENTER_SPACE},{r:0, c:CENTER_SPACE}];
	
	this.wallCounts = [STARTING_WALLS, STARTING_WALLS];
	this.walls = new Array(WALL_SIZE);	//Wall Centers	
	for (var r = 0; r < WALL_SIZE; r++) {
		this.walls[r] = new Array(WALL_SIZE);
		for (var c = 0; c < WALL_SIZE; c++) {
			this.walls[r][c] = NO_WALL;
		}
	}

	
}

Board.prototype.init = function(boardStr) {	
	
	//if (boardStr && boardStr.length == BOARD_SPACES + 1) this.fromString(boardStr);			
	//else { //Init
	//	
	//	for (var i = 0; i < BOARD_SIZE; i++) {
	//		this.board[0][i] = PLAYER2;
	//		this.board[1][i] = PLAYER2;
	//		
	//		this.board[2][i] = EMPTY;
	//		this.board[3][i] = EMPTY;
	//		this.board[4][i] = EMPTY;
	//		this.board[5][i] = EMPTY;				
	//		
	//		this.board[BOARD_SIZE-2][i] = PLAYER1;
	//		this.board[BOARD_SIZE_MINUS_1][i] = PLAYER1;
	//	}
	//}
	
}

Board.prototype.copy = function() {
	var newBoard = new Board();
	for (var r = 0; r < WALL_SIZE; r++) {
		for (var c = 0; c < WALL_SIZE; c++) {
			newBoard.walls[r][c] = this.walls[r][c];
		}
	}

	for (var p = 0; p < PLAYERS; p++) {
		newBoard.pawns[p] = {r:this.pawns[p].r, c:this.pawns[p].c};
		newBoard.wallCounts[p] = this.wallCounts[p];		
	}
	newBoard.turn = this.turn;
		
	return newBoard;	
}


Board.prototype.onBoard = function(r, c) {
	if (r < 0 || r >= FLOOR_SIZE || c < 0 || c >= FLOOR_SIZE) return false;
	else return true;
}

Board.prototype.canSelect = function(r, c) {	
	var pawn = this.pawns[this.turn];
	if (pawn.r == r && pawn.c == c) return true;
	else return false;
	
}

Board.prototype.getMoveFromDir = function(dir) {		
	//Convenience function to move pawn with WASD
	var turn = this.turn;
	var pawn = this.pawns[turn];	
	var delta = MOVE_DELTAS_BY_DIR[dir];
	return {sr:pawn.r, sc:pawn.c, dr:pawn.r + delta.r, dc:pawn.c + delta.c, type:FLOOR};		
}

Board.prototype.makeMove = function(move) {
	//Moving Pawn
	if (move.type == FLOOR) {
		var moveCode = this.validateMove(move.sr, move.sc, move.dr, move.dc);		
		if (moveCode != VALID) return moveCode;

		//Update board
		this.movePawn(move.dr, move.dc);
	}
	//Placing wall
	else {
		var placeCode = this.validatePlace(move.r, move.c, move.type);
		if (placeCode != VALID) return placeCode;
		this.placeWall(move.r, move.c, move.type);	
	}
	return VALID;
}

Board.prototype.validateMove = function(sr, sc, dr, dc) {	
	
	if (!this.onBoard(sr, sc) || !this.onBoard(dr, dc)) return INVALID_BOUNDS;	//Out of bounds
	else if (!this.canSelect(sr, sc)) return INVALID_SOURCE; //Invalid selection
	else {
		var oppTurn = +(!this.turn);
		var deltaR = Math.abs(sr-dr);
		var deltaC = Math.abs(sc-dc);

		if (deltaR > 1 || deltaC > 1) return INVALID_MOVE;
		if (deltaR == 0 && deltaC == 0) return INVALID_MOVE;
		else if (deltaR == 1 && deltaC == 1) return INVALID_MOVE_DIAGONAL;
		else if (this.collidesWithWall(sr, sc, dr, dc)) return INVALID_MOVE_WALL;		
		else if (this.pawns[oppTurn].r == dr && this.pawns[oppTurn].c == dc) return INVALID_DESTINATION;		
		//else if (this.board[dr][dc] != EMPTY) return INVALID_JUMP;
		
	}
	
	return VALID;
}

Board.prototype.collidesWithWall = function(sr, sc, dr, dc) {			
	//Same row
	if (sr == dr) {
		var wallC = Math.min(sc, dc);
		if (sr < WALL_SIZE && this.walls[sr][wallC] == V_WALL) return true;
		else if (sr-1 >= 0 && sr-1 >= 0 && this.walls[sr-1][wallC] == V_WALL) return true;
	}
	//Same col
	else {
		var wallR = Math.min(sr, dr);
		if (sc < WALL_SIZE && this.walls[wallR][sc] == H_WALL) return true;
		else if (sc-1 >= 0 && sc-1 >= 0 && this.walls[wallR][sc-1] == H_WALL) return true;
	}
	 
	return false;
}

Board.prototype.getMoves = function() {	
	return [];
	//var turn = this.turn;
	//var oppTurn = +(!turn);
	//var moves = [];
	//var dir = (this.turn * 2) - 1;
	//for (var r = 0; r < BOARD_SIZE; r++) {		
	//	for (var c = 0; c < BOARD_SIZE; c++) {
	//		var pin = this.board[r][c];
	//		if (pin == turn) {
	//			var dr = r+dir;
	//			if (dr < 0 || dr >= BOARD_SIZE) continue;
	//			if (this.board[dr][c] == EMPTY) moves.push({sr:r, sc:c, dr:dr, dc:c});
	//			if (this.board[dr][c+1] == EMPTY || this.board[dr][c+1] == oppTurn) moves.push({sr:r, sc:c, dr:dr, dc:c+1});
	//			if (this.board[dr][c-1] == EMPTY || this.board[dr][c-1] == oppTurn) moves.push({sr:r, sc:c, dr:dr, dc:c-1});
	//		}
	//	}
	//}
	//return moves;
}

Board.prototype.movePawn = function(r, c) {
	//Assume that it has already been validated	
	this.pawns[this.turn] = {r:r, c:c};
		
}

Board.prototype.validatePlace = function(r, c, wallType) {
	if (this.wallCounts[this.turn] <= 0) return INVALID_WALL_COUNT;
	else if (this.walls[r][c] != NO_WALL) return INVALID_DESTINATION;
	
	else if (r-1 >= 0 && this.walls[r-1][c] == wallType && wallType == V_WALL) return INVALID_DESTINATION;
	else if (r+1 < WALL_SIZE && this.walls[r+1][c] == wallType && wallType == V_WALL) return INVALID_DESTINATION;
	else if (c-1 >= 0 && this.walls[r][c-1] == wallType && wallType == H_WALL) return INVALID_DESTINATION;
	else if (c+1 < WALL_SIZE && this.walls[r][c+1] == wallType&& wallType == H_WALL) return INVALID_DESTINATION;

	//Check for path - after it's placed
	//else if (!this.hasPath(this.turn)) return INVALID_PATH;
	return VALID;
}

Board.prototype.placeWall = function(r, c, wallType) {
	//Assume that it has already been validated	
	this.wallCounts[this.turn]--;	
	this.walls[r][c] = wallType;
}

Board.prototype.hasPath = function(turn) {
	//Depth first search
	var oppTurn = +(!turn);
	var oppPawn = this.pawns[oppTurn];

	var searchDirs = SEARCH_DIRS_BY_PLAYER[turn];
	var queue = [this.pawns[turn]];
	while (queue.length) {
		var first = queue.unshift();
		
		if (first.r == ENDING_ROWS[turn]) return true; //Todo, check for wall collisions
		for (var d = 0; d < 4; d++) {
			var dir = searchDirs[d];
			var deltaR = first.r + dir.r;
			var deltaC = first.c + dir.c;
			if (deltaR >= 0 && deltaR < FLOOR_SIZE && deltaC >= 0 && deltaC < FLOOR_SIZE) {
				if (this.oppPawn.r != deltaR && this.oppPawn != deltaC) {
					//Todo, check for wall collisions
					queue.push({r:deltaR, c:deltaC});
				}
			}
		}
	}
	return false;
}

Board.prototype.score = function() {
	return 0; //TODO	
}


Board.prototype.getTurn = function() {
	return this.turn;
}



Board.prototype.changeTurn = function() {
	this.turn = +(!this.turn);
}


Board.prototype.toString = function() {	
	
	//Serialize into Quoridor Board Notation (QBN)
	var boardStr = 
		'players=' + PLAYERS + ',' +		
		'turn=' + (this.turn+1) + ',';

	for (var p = 0; p < PLAYERS; p++) {
		boardStr += 'pawn' + (p+1) + '=' + this.qmnFromRC(this.pawns[p]) + ',';
	}

	for (var p = 0; p < PLAYERS; p++) {
		boardStr += 'wallcount' + (p+1) + '=' + this.wallCounts[p] + ',';
	}

	boardStr += 'wallcenters=';
	for (var r = 0; r < WALL_SIZE; r++) {
		for (var c = 0; c < WALL_SIZE; c++) {
			var wallType = this.walls[r][c];			
			if (wallType == NO_WALL) boardStr += 'N';
			else if (wallType == H_WALL) boardStr += 'H';
			else if (wallType == V_WALL) boardStr += 'V';
			else throw new Error('Invalid wall type at ' + r + ',' + c + ':' + wallType);
		}
	}
	
	return boardStr;
}

//Board.prototype.qmnToRC = function(qmn) {
//}

Board.prototype.qmnFromRC = function(pos) {
	return String.fromCharCode(65+pos.c) + (pos.r+1);
}

Board.prototype.qmnToMove = function(qmn) {	
	//Example E2, or A2V	
	if (qmn.length == 2) { //Move pawn
		qmn = qmn.toLowerCase().replace(/[^a-i][^1-9]/g, '');
		return {
			sr : this.pawns[this.turn].r,
			sc : this.pawns[this.turn].c,
			
			dr : parseInt(qmn.charAt(1))-1,
			dc : parseInt(qmn.charCodeAt(0))-97,
			type: FLOOR
		}
	}
	else if (qmn.length == 3) { //Place wall
		qmn = qmn.toLowerCase().replace(/[^a-i][^1-9][hv]/g, '');
		var wall = qmn.charAt(2);
		if (wall == 'v') wall = V_WALL;
		else if (wall == 'h') wall = H_WALL;
		else throw new Error('Invalid QMN wall type:' + wall);

		return {
			r : parseInt(qmn.charAt(1))-2,
			c : parseInt(qmn.charCodeAt(0))-97,						
			type: wall
		}
	}
	else throw new Error('Invalid QMN: ' + qmn);
	return INVALID;
}

Board.prototype.fromString = function(boardStr) {
	//for (var i = 0; i < BOARD_SPACES; i++) {
	//	var pin = boardStr.charAt(i);
	//	var r = BOARD_SIZE_MINUS_1 - Math.floor(i / BOARD_SIZE);
	//	var c = i % BOARD_SIZE;
	//	if (pin == '1') this.board[r][c] = PLAYER1;
	//	else if (pin == '2') this.board[r][c] = PLAYER2;
	//	else this.board[r][c] = EMPTY;
	//}
	//this.turn = boardStr[BOARD_SPACES] == '1'? PLAYER1 : PLAYER2;
}


Board.prototype.isGameOver = function() {
	//Reached the opposite end row
	if (this.pawns[this.turn].r == ENDING_ROWS[this.turn]) return true;		
	else return false;
}


//End class Board
