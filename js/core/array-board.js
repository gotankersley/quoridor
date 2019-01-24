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
const INVALID_PLACE_INTERSECT = 11;


const WALL_SIZE = 8;
const WALL_SPACES = 64;
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

const CHAR_NO_WALL = 'N';
const CHAR_H_WALL = 'H';
const CHAR_V_WALL = 'V';

const TQBN_SIZE = 73;
const MAX_SEARCH_ITERATIONS = 140;
var SEARCH_PATH_TYPE = 'B';

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
		{r:1, c:0, dir:'B'}, //Backward
		{r:0, c:1, dir:'R'}, //Right
		{r:0, c:-1, dir:'L'}, //Left
		{r:-1, c:0, dir:'F'}, //Forward
	],

	//Player2
	[
		{r:-1, c:0, dir:'F'}, //Backward
		{r:0, c:1, dir:'R'}, //Left
		{r:0, c:-1, dir:'L'}, //Right
		{r:1,c:0, dir:'B'}, //Forward
	],
];
const MOVE_DELTAS_BY_DIR = [
	{r:-1, c:0}, //Forward,
	{r:0, c:-1}, //Left,
	{r:0, c:1}, //Right,
	{r:1, c:0}, //Backward,
];



//Class Board 
function Board(boardStr, findPath) {	
			
	
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

	this.breadcrumbs = new Array(FLOOR_SIZE);	//Temp breadcrumbs for path finding
	for (var r = 0; r < FLOOR_SIZE; r++) {
		this.breadcrumbs[r] = new Array(FLOOR_SIZE);
		for (var c = 0; c < FLOOR_SIZE; c++) {
			this.breadcrumbs[r][c] = false;
		}
	}
	this.paths = [[],[]];

	if (boardStr && boardStr.length >= TQBN_SIZE) this.fromString(boardStr);
		
	if (typeof (findPath) == 'undefined' || findPath) {
		this.getPath(PLAYER1);
		this.getPath(PLAYER2);
	}

}

Board.prototype.copy = function() {
	
	var newBoard = new Board('', false);
	for (var r = 0; r < WALL_SIZE; r++) {
		for (var c = 0; c < WALL_SIZE; c++) {
			newBoard.walls[r][c] = this.walls[r][c];
		}
	}

	for (var p = 0; p < PLAYERS; p++) {
		newBoard.pawns[p] = {r:this.pawns[p].r, c:this.pawns[p].c};
		newBoard.wallCounts[p] = this.wallCounts[p];
		newBoard.paths[p] = [];		
		for (var i = 0; i < this.paths[p].length; i++) {
			var path = this.paths[p];
			newBoard.paths[p].push({r:path[i].r, c:path[i].c});
		}
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


Board.prototype.isGameOver = function() {
	//Reached the opposite end row
	if (this.pawns[this.turn].r == ENDING_ROWS[this.turn]) return true;		
	else return false;
}

Board.prototype.canJump = function(turn, sr, sc, dr, dc) {
	//Note - this doesn't validate current pawn's position
	var oppTurn = +(!turn);
	var oppPawn = this.pawns[oppTurn];			
	var deltaR = Math.abs(sr-dr);
	var deltaC = Math.abs(sc-dc);
	if (deltaR == 2 && deltaC == 0) {
		var dir = deltaR/(dr-sr);
		if (!this.collidesWithWall(sr, sc, sr+dir, dc) && !this.collidesWithWall(sr+dir,sc,dr,dc)){
			if (oppPawn.r == sr+dir && oppPawn.c == dc) return true;
		}
	}
	else if (deltaR == 0 && deltaC == 2) {
		var dir = deltaC/(dc-sc);
		if (!this.collidesWithWall(sr, sc, dr, sc+dir) && !this.collidesWithWall(sr,sc+dir,dr,dc)){
			if (oppPawn.c == sc+dir && oppPawn.r == dr) return true;
		}
	}
	return false;
}

Board.prototype.getMoveFromDir = function(dir) {		
	//Convenience function to move pawn with WASD
	var turn = this.turn;
	var pawn = this.pawns[turn];	
	var delta = MOVE_DELTAS_BY_DIR[dir];
	var move = {sr:pawn.r, sc:pawn.c, dr:pawn.r + delta.r, dc:pawn.c + delta.c, type:FLOOR};
	if (this.onBoard(move.dr+delta.r, move.dc+delta.c)) {
		if (this.canJump(turn, move.sr, move.sc, move.dr+delta.r, move.dc+delta.c)) {
			move.dr += delta.r;
			move.dc += delta.c;
			return move;
		}
		else return move;
	}
	else return move;
}

Board.prototype.makeMove = function(move) {
	//Moving Pawn
	if (move.type == FLOOR) {
		var moveCode = this.validateMove(move.sr, move.sc, move.dr, move.dc);		

		if (moveCode != VALID ) return moveCode;

		//Update board
		this.movePawn(move.dr, move.dc);
	}
	//Placing wall
	else {
		var placeCode = this.validatePlace(move.r, move.c, move.type);
		if (placeCode != VALID) return placeCode;
		this.placeWall(move.r, move.c, move.type);	
	}
	this.getPath(PLAYER1);
	this.getPath(PLAYER2);
	return VALID;
}

Board.prototype.validateMove = function(sr, sc, dr, dc) {	
	
	if (!this.onBoard(sr, sc) || !this.onBoard(dr, dc)) return INVALID_BOUNDS;	//Out of bounds
	else if (!this.canSelect(sr, sc)) return INVALID_SOURCE; //Invalid selection
	else {
		var oppTurn = +(!this.turn);
		var deltaR = Math.abs(sr-dr);
		var deltaC = Math.abs(sc-dc);
		
		if (deltaR <= 0 && deltaC <= 0) return INVALID_MOVE;
		else if (deltaR > 2 || deltaC > 2) return INVALID_MOVE;
		else if (deltaR == 1 && deltaC == 1) return INVALID_MOVE_DIAGONAL;
		else if (this.pawns[oppTurn].r == dr && this.pawns[oppTurn].c == dc) return INVALID_DESTINATION;		
		else if (this.collidesWithWall(sr, sc, dr, dc)) return INVALID_MOVE_WALL;						
	}

	//Test for jump
	if (this.canJump(this.turn, sr, sc, dr, dc)) return VALID;					
	
	return VALID;
}

Board.prototype.validatePlace = function(r, c, wallType) {
	if (this.wallCounts[this.turn] <= 0) return INVALID_WALL_COUNT;
	else if (this.intersectsWall(r, c, wallType)) return INVALID_PLACE_INTERSECT;	

	//Check for path - after it's placed
	this.walls[r][c] = wallType; //Temp place for checking
	var hasPath1 = this.getPathDFS(PLAYER1);
	var hasPath2 = false;
	if (hasPath1) hasPath2 = this.getPathDFS(PLAYER2);
	this.walls[r][c] = NO_WALL; //Undo temp place

	if (!hasPath1 || !hasPath2) return INVALID_PATH;	
	else return VALID;
}

Board.prototype.intersectsWall = function(r,c, wallType) {
				
	if (this.walls[r][c] != NO_WALL) return true;	
	else if (r-1 >= 0 && this.walls[r-1][c] == wallType && wallType == V_WALL) return INVALID_PLACE_INTERSECT;
	else if (r+1 < WALL_SIZE && this.walls[r+1][c] == wallType && wallType == V_WALL) return INVALID_PLACE_INTERSECT;
	else if (c-1 >= 0 && this.walls[r][c-1] == wallType && wallType == H_WALL) return INVALID_PLACE_INTERSECT;
	else if (c+1 < WALL_SIZE && this.walls[r][c+1] == wallType&& wallType == H_WALL) return INVALID_PLACE_INTERSECT;
	return false;
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
	
	var turn = this.turn;
	var oppTurn = +(!turn);
	var moves = [];	
	var dir = (this.turn * 2) - 1;
	
	//Create path hash-cache
	var pathCache = [{},{}];
	for (var p = 0; p < PLAYERS; p++) {
		var path = this.paths[p];
		for (var i = 0; i < path.length; i++) {
			var pos = path[i];
			pathCache[p][pos.r + ',' + pos.c] = true;
		}
	}
	//Pawn moves
	var pawn = this.pawns[turn];
	if (this.onBoard(pawn.r+1, pawn.c)) moves.push({sr:pawn.r, sc:pawn.c, dr:pawn.r+1,dc:pawn.c})
	if (this.onBoard(pawn.r-1, pawn.c)) moves.push({sr:pawn.r, sc:pawn.c, dr:pawn.r-1,dc:pawn.c})
	if (this.onBoard(pawn.r, pawn.c+1)) moves.push({sr:pawn.r, sc:pawn.c, dr:pawn.r,dc:pawn.c+1})
	if (this.onBoard(pawn.r, pawn.c-1)) moves.push({sr:pawn.r, sc:pawn.c, dr:pawn.r,dc:pawn.c-1})
	//TODO: jumps

	//Place moves
	if (this.wallCounts[turn] <= 0) return moves; //No places available

	for (var r = 0; r < WALL_SIZE; r++) {
		for (var c = 0; c < WALL_SIZE; c++) {
			//Horizontal walls
			if (!this.intersectsWall(r, c, H_WALL)) {
				var hasPath1 = false;				
				if (pathCache[PLAYER1][r + ',' + c]) { //Part of path
					this.walls[r][c] = H_WALL; //Temp place for checking
					hasPath1 = this.getPathDFS(PLAYER1);
					this.walls[r][c] = NO_WALL; 
				}
				else hasPath1 = true;

				var hasPath2 = false;
				if (hasPath1) {
					if (pathCache[PLAYER2][r + ',' + c]) { //Part of path
						this.walls[r][c] = H_WALL; //Temp place for checking
						hasPath2 = this.getPathDFS(PLAYER2);
						this.walls[r][c] = NO_WALL; 
					}
					else hasPath2 = true;
				}
				
				if (hasPath1 && hasPath2) moves.push({r:r, c:c, type:H_WALL});
			}

			//Vertical walls
			if (!this.intersectsWall(r, c, V_WALL)) {
				var hasPath1 = false;				
				if (pathCache[PLAYER1][r + ',' + c]) { //Part of path
					this.walls[r][c] = V_WALL; //Temp place for checking
					hasPath1 = this.getPathDFS(PLAYER1);
					this.walls[r][c] = NO_WALL; 
				}
				else hasPath1 = true;

				var hasPath2 = false;
				if (hasPath1) {
					if (pathCache[PLAYER2][r + ',' + c]) { //Part of path
						this.walls[r][c] = V_WALL; //Temp place for checking
						hasPath2 = this.getPathDFS(PLAYER2);
						this.walls[r][c] = NO_WALL; 
					}
					else hasPath2 = true;
				}
				
				if (hasPath1 && hasPath2) moves.push({r:r, c:c, type:V_WALL});
			}
		}
	}
	
	return moves;
}

Board.prototype.movePawn = function(r, c) {
	//Assume that it has already been validated	
	this.pawns[this.turn] = {r:r, c:c};
		
}


Board.prototype.placeWall = function(r, c, wallType) {
	//Assume that it has already been validated	
	this.wallCounts[this.turn]--;	
	this.walls[r][c] = wallType;
}

Board.prototype.getPath = function(turn) {
	if (SEARCH_PATH_TYPE == 'D') return this.getPathDFS(turn);
	else return this.getPathBFS(turn);

}

Board.prototype.getPathDFS = function(turn) {	
	

	//Clear breadcrumbs
	for (var r = 0; r < FLOOR_SIZE; r++) {		
		for (var c = 0; c < FLOOR_SIZE; c++) {
			this.breadcrumbs[r][c] = false;
		}
	}

	//Depth first search
	var oppTurn = +(!turn);
	var oppPawn = this.pawns[oppTurn];
	var pawn = this.pawns[turn];

	var searchDirs = SEARCH_DIRS_BY_PLAYER[turn];
	var queue = [{r:pawn.r, c:pawn.c, path:''}];
	var iterations = 0;
	while (queue.length) {
		//var first = queue.shift();
		var first = queue.pop();
		
		if (first.r == ENDING_ROWS[turn]) {
			var pathStr = first.path;
			var path = [];
			var pos = {r:pawn.r, c:pawn.c};
			for (var p = 0; p < pathStr.length; p++) {			
				var d = pathStr.charAt(p);
				if (d == 'F') pos.r--;
				else if (d == 'L') pos.c--;
				else if (d == 'R') pos.c++;
				else if (d == 'B') pos.r++;
				path.push({r:pos.r, c:pos.c});
			}
			this.paths[turn] = path;
			//console.log(turn, iterations);
			return true; 
		}
		for (var d = 0; d < 4; d++) {
			var dir = searchDirs[d];
			var deltaR = first.r + dir.r;
			var deltaC = first.c + dir.c;			
			if (deltaR >= 0 && deltaR < FLOOR_SIZE && deltaC >= 0 && deltaC < FLOOR_SIZE) {
				if (!this.breadcrumbs[deltaR][deltaC]) {
					
					if (oppPawn.r == deltaR && oppPawn.c == deltaC) {
						var jumpR = deltaR + dir.r;
						var jumpC = deltaC + dir.c;
						if (jumpR >= 0 && jumpR < FLOOR_SIZE && jumpC >= 0 && jumpC < FLOOR_SIZE) {
							if (this.canJump(turn, first.r, first.c, jumpR, jumpC)) {
								queue.push({r:jumpR, c:jumpC, path:first.path+dir.dir+dir.dir});
								this.breadcrumbs[jumpR][jumpC] = true;
							}
						}
					}
					else {
											
						if (!this.collidesWithWall(first.r, first.c, deltaR, deltaC)) {
							queue.push({r:deltaR, c:deltaC, path:first.path+dir.dir});
							this.breadcrumbs[deltaR][deltaC] = true;
						}
					}
				}
			}
		}

		if (iterations++ >= MAX_SEARCH_ITERATIONS) {
			throw new Error('Stuck in infinite loop');
		}
	}

	this.paths[turn] = [];
	return false;
}


Board.prototype.getPathBFS = function(turn) {
	
	
	//Clear breadcrumbs
	for (var r = 0; r < FLOOR_SIZE; r++) {		
		for (var c = 0; c < FLOOR_SIZE; c++) {
			this.breadcrumbs[r][c] = false;
		}
	}

	//Breadth first search
	var oppTurn = +(!turn);
	var oppPawn = this.pawns[oppTurn];
	var pawn = this.pawns[turn];

	var searchDirs = SEARCH_DIRS_BY_PLAYER[turn];
	var queue = [{r:pawn.r, c:pawn.c, path:''}];
	var iterations = 0;
	while (queue.length) {
		var first = queue.shift();		
		
		if (first.r == ENDING_ROWS[turn]) {
			var pathStr = first.path;
			var path = [];
			var pos = {r:pawn.r, c:pawn.c};
			for (var p = 0; p < pathStr.length; p++) {			
				var d = pathStr.charAt(p);
				if (d == 'F') pos.r--;
				else if (d == 'L') pos.c--;
				else if (d == 'R') pos.c++;
				else if (d == 'B') pos.r++;
				path.push({r:pos.r, c:pos.c});
			}
			this.paths[turn] = path;
			//console.log(turn, iterations);
			return true; 
		}
		for (var d = 3; d >= 0; d--) {
			var dir = searchDirs[d];
			var deltaR = first.r + dir.r;
			var deltaC = first.c + dir.c;			
			if (deltaR >= 0 && deltaR < FLOOR_SIZE && deltaC >= 0 && deltaC < FLOOR_SIZE) {
				if (!this.breadcrumbs[deltaR][deltaC]) {
					
					if (oppPawn.r == deltaR && oppPawn.c == deltaC) {
						var jumpR = deltaR + dir.r;
						var jumpC = deltaC + dir.c;
						if (jumpR >= 0 && jumpR < FLOOR_SIZE && jumpC >= 0 && jumpC < FLOOR_SIZE) {
							if (this.canJump(turn, first.r, first.c, jumpR, jumpC)) {
								queue.push({r:jumpR, c:jumpC, path:first.path+dir.dir+dir.dir});
								this.breadcrumbs[jumpR][jumpC] = true;
							}
						}
					}
					else {
											
						if (!this.collidesWithWall(first.r, first.c, deltaR, deltaC)) {
							queue.push({r:deltaR, c:deltaC, path:first.path+dir.dir});
							this.breadcrumbs[deltaR][deltaC] = true;
						}
					}
				}
			}
		}

		if (iterations++ >= MAX_SEARCH_ITERATIONS) {
			console.log('stuck in infinite loop');
			throw new Error('Stuck in infinite loop');			
		}
	}

	this.paths[turn] = [];
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
	
	//Serialize into Theseus Quoridor Board Notation (TQBN)
	var boardStr = '';
	for (var r = 0; r < WALL_SIZE; r++) {
		for (var c = 0; c < WALL_SIZE; c++) {
			var wallType = this.walls[r][c];			
			if (wallType == NO_WALL) boardStr += CHAR_NO_WALL;
			else if (wallType == H_WALL) boardStr += CHAR_H_WALL;
			else if (wallType == V_WALL) boardStr += CHAR_V_WALL;
			else throw new Error('Invalid wall type at ' + r + ',' + c + ':' + wallType);
		}
	}
	boardStr += (this.turn+1);

	for (var p = 0; p < PLAYERS; p++) {	
		//Pawn	
		boardStr += this.qmnFromRC(this.pawns[p]);

		//Wallcount
		var wallCount = this.wallCounts[p].toString();
		if (wallCount.length == 1) wallCount = '0' + wallCount;  //Zero pad
		boardStr += wallCount;
	}	
	
	return boardStr;
}

Board.prototype.fromString = function(boardStr) {
	for (var w = 0; w < WALL_SPACES; w++) {
		var wallChar = boardStr.charAt(w);
		var r = Math.floor(w / WALL_SIZE);
		var c = w % WALL_SIZE;

		if (wallChar == CHAR_H_WALL) this.walls[r][c] = H_WALL;
		else if (wallChar == CHAR_V_WALL) this.walls[r][c] = V_WALL;
		else if (wallChar != CHAR_NO_WALL) throw new Error('Invalid walltype: ' + wallChar);
	}

	this.turn = Number.parseInt(boardStr[WALL_SPACES])-1;

	var player = 0;
	for (var i = WALL_SPACES+1; i < boardStr.length; i+=4) {
		var pawnQmn = boardStr[i] + boardStr[i+1];
		var zeroPadWallCount = boardStr[i+2] + boardStr[i+3];

		this.pawns[player] = this.qmnToRC(pawnQmn);
		this.wallCounts[player] = Number.parseInt(zeroPadWallCount);
		player++;
	}
	
}

Board.prototype.qmnToRC = function(qmn) {
	//Assume pawn position only
	return {
		r:Number.parseInt(qmn.charAt(1))-1,
		c:qmn.charCodeAt(0)-65,
	};
}

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
			r : parseInt(qmn.charAt(1))-1,
			c : parseInt(qmn.charCodeAt(0))-97,						
			type: wall
		}
	}
	else throw new Error('Invalid QMN: ' + qmn);
	return INVALID;
}



//End class Board
