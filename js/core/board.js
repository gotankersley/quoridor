const VALID = 0;
const INVALID_JUMP = 1;
const INVALID_SOURCE = 2;
const INVALID_MOVE = 3;
const INVALID_MOVE_WALL = 4;
const INVALID_TURN = 6;
const INVALID_BOUNDS = 7;
const INVALID_DESTINATION = 8;
const INVALID_PATH_OWN = 9;
const INVALID_PATH_OPP = 10;
const INVALID_WALL_COUNT = 11;
const INVALID_PLACE_INTERSECT = 12;
const INVALID_SILENT = 13; //Discretion is the better part of valor


const CENTER_SPACE = 4;

const EMPTY = -1; 

const NO_WALL = 0;
const H_WALL = 1;
const V_WALL = 2;
const FLOOR = 3;

const CHAR_NO_WALL = 'N';
const CHAR_H_WALL = 'H';
const CHAR_V_WALL = 'V';

const TQBN_SIZE = 73; 
const MAX_SEARCH_ITERATIONS = 200;
var SEARCH_PATH_TYPE = 'B';

const FORWARD = 0;
const LEFT = 1;
const RIGHT = 2;
const BACKWARD = 3;

const STARTING_WALLS = 10;
const STARTING_ROWS = [FLOOR_SIZE-1, 0];

const ENDING_WALL_ROWS = [0, WALL_SIZE-1];
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

const ADVANCE_DIR = [1, -1];
//const B64 = [ //Custom charset to put 0-1, [A-F], where you'd expect
//	'0','1','2','3','4','5','6','7','8','9',
//	'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
//	'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
//	'+','-'
//];

function getInvalidMessage(invalidCode) {
	switch(invalidCode) {
		case VALID: return 'Valid';
		case INVALID_MOVE: throw new Error('Invalid: can only move 1'); //return 'Nope: can only move one square...'; 
		case INVALID_MOVE_WALL: return 'Nope: unable to move through wall...'; 			
		case INVALID_JUMP: return 'Nope: jumps must be over a pawn or diagonal with a wall behind...'; 
		case INVALID_SOURCE: return 'Nope: not your pawn...'; 
		case INVALID_TURN: return 'Nope: wrong player...';
		case INVALID_BOUNDS: return 'Nope: must move on the board...';
		case INVALID_DESTINATION: return 'Nope: destination not empty...';
		case INVALID_PATH_OWN: return 'Nope: you can\'t entirely block your own pawn\'s path...';
		case INVALID_PATH_OPP: return 'Nope: you can\'t entirely block the other pawn\'s path...';
		case INVALID_WALL_COUNT: return 'Nope: you are out of walls to place...';
		case INVALID_PLACE_INTERSECT: return 'Nope: this intersects an existing wall...';
		case INVALID_SILENT: return ''; //Fail silently
		default: return 'Nope: invalid move...';
	}
}

//Class Board 
function Board(boardStr, findPath) {	
			
	
	this.turn = PLAYER1;
	this.pawns = [{r:WALL_SIZE, c:CENTER_SPACE},{r:0, c:CENTER_SPACE}];
	
	this.wallCounts = [STARTING_WALLS, STARTING_WALLS];

	this.walls = new Array(WALL_SIZE);	//Wall Centers		
	this.wallPlacers = new Array(WALL_SIZE);
	for (var r = 0; r < WALL_SIZE; r++) {
		this.walls[r] = new Array(WALL_SIZE);
		this.wallPlacers[r] = new Array(WALL_SIZE);

		for (var c = 0; c < WALL_SIZE; c++) {
			this.walls[r][c] = NO_WALL;
			this.wallPlacers[r][c] = INVALID;
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
			newBoard.wallPlacers[r][c] = this.wallPlacers[r][c];
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
	if (this.pawns[this.turn].r == WIN_ROWS[this.turn]) return true;		
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
	else if (deltaR == 1 && deltaC == 1) { //diagonal
		var dirR = 0;
		var dirC = 0;
		if (oppPawn.r == sr) dirC = oppPawn.c-sc;
		else dirR = oppPawn.r-sr;
		
		if (this.onBoard(dr, dc)) {
			if (oppPawn.r == sr+dirR && oppPawn.c == sc+dirC) { //Pawn in front
				if (!this.collidesWithWall(sr, sc, oppPawn.r, oppPawn.c) && !this.collidesWithWall(sr+dirR, sc+dirC, dr, dc) && !this.collidesWithWall(oppPawn.r, oppPawn.c, dr, dc)) {	//No wall betwixt pawns
					if (!this.onBoard(oppPawn.r+dirR, oppPawn.c+dirC)) return true; //edge case
					else if (this.collidesWithWall(oppPawn.r, oppPawn.c, oppPawn.r+dirR, oppPawn.c+dirC)) return true;	//Wall behind opp pawn						
					
				}
			}
		}
	}
	return false;
}

/* unused?
Board.prototype.isPawnAdjacent = function() {
	var pawn1 = this.pawns[PLAYER1];
	var pawn2 = this.pawns[PLAYER2];
	var deltaR = Math.abs(pawn1.r-pawn2.r);
	var deltaC = Math.abs(pawn1.c-pawn2.c);

	if (deltaR + deltaC == 1) return true; //either one is 1, but not both
	else return false;
}
*/


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
	
	var oppTurn = +(!this.turn);
	var oppPawn = this.pawns[oppTurn];
	var deltaR = Math.abs(sr-dr);
	var deltaC = Math.abs(sc-dc);
	var deltaSum = deltaR + deltaC;

	if (!this.onBoard(sr, sc) || !this.onBoard(dr, dc)) return INVALID_BOUNDS;	//Out of bounds
	else if (oppPawn.r == sr && oppPawn.c == sc) return INVALID_SOURCE;
	else if (oppPawn.r == dr && oppPawn.c == dc) return INVALID_SOURCE;		
	else if (!this.canSelect(sr, sc)) return INVALID_SILENT; //Fail silently
		
	//Moving
	if (deltaSum <= 0) return INVALID_MOVE;
	else if (deltaSum == 2 ) { //Jump
		if (!this.canJump(this.turn, sr, sc, dr, dc)) return INVALID_JUMP;	
		else return VALID;		
	} 
	else if (deltaSum != 1) return INVALID_MOVE;
		
	else if (this.collidesWithWall(sr, sc, dr, dc)) return INVALID_MOVE_WALL;						

						
	return VALID;
}

Board.prototype.validatePlace = function(r, c, wallType) {
	var oppTurn = +(!this.turn);
	if (this.wallCounts[this.turn] <= 0) return INVALID_WALL_COUNT;
	else if (r < 0 || r >= WALL_SIZE || c < 0 || c >= WALL_SIZE) return INVALID;
	else if (this.intersectsWall(r, c, wallType)) return INVALID_PLACE_INTERSECT;	

	//Check for path - after it's placed
	this.walls[r][c] = wallType; //Temp place for checking
	var hasPaths = [this.getPathDFS(PLAYER1), false];
	
	if (hasPaths[PLAYER1]) hasPaths[PLAYER2] = this.getPathDFS(PLAYER2);
	this.walls[r][c] = NO_WALL; //Undo temp place
	
	if (!hasPaths[this.turn]) return INVALID_PATH_OWN;
	else if(!hasPaths[oppTurn]) return INVALID_PATH_OPP;	
	else return VALID;
}

Board.prototype.removeWall = function(r,c){
	
	this.walls[r][c] = NO_WALL;

}

Board.prototype.intersectsWall = function(r,c, wallType) {
				
	if (this.walls[r][c] != NO_WALL) return true;	//Occupied
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



Board.prototype.getMoves = function(moveType) {	
	
	var turn = this.turn;
	var oppTurn = +(!turn);
	var moves = [];	
	
	var pawn = this.pawns[turn];
	var oppPawn = this.pawns[oppTurn];
	
	//Create path hash-cache
	var pathCache = [{},{}];
	for (var p = 0; p < PLAYERS; p++) {
		var path = this.paths[p];
		for (var i = 0; i < path.length; i++) {
			var pos = path[i];
			pathCache[p][pos.r + ',' + pos.c] = true;
		}
	}
	
	if (moveType == FLOOR || typeof(moveType) == 'undefined') {
		//Pawn moves
		if (this.validateMove(pawn.r, pawn.c, pawn.r+1, pawn.c) == VALID) moves.push({sr:pawn.r, sc:pawn.c, dr:pawn.r+1,dc:pawn.c, type:FLOOR});
		if (this.validateMove(pawn.r, pawn.c, pawn.r-1, pawn.c) == VALID) moves.push({sr:pawn.r, sc:pawn.c, dr:pawn.r-1,dc:pawn.c, type:FLOOR});
		if (this.validateMove(pawn.r, pawn.c, pawn.r, pawn.c+1) == VALID) moves.push({sr:pawn.r, sc:pawn.c, dr:pawn.r,dc:pawn.c+1, type:FLOOR});
		if (this.validateMove(pawn.r, pawn.c, pawn.r, pawn.c-1) == VALID) moves.push({sr:pawn.r, sc:pawn.c, dr:pawn.r,dc:pawn.c-1, type:FLOOR});

		//Jumps
		var dir = {r:oppPawn.r-pawn.r, c:oppPawn.c-pawn.c};
		var jump = {r:oppPawn.r+(1*dir.r), c:oppPawn.c+(1*dir.c)};
		if(this.onBoard(jump.r, jump.c) && this.canJump(turn, pawn.r, pawn.c, jump.r, jump.c)) {
			moves.push({sr:pawn.r, sc:pawn.c, dr:jump.r, dc:jump.c, type:FLOOR}); //Straight jump				
		}
		if (dir.c == 0) {
			if (this.onBoard(oppPawn.r, oppPawn.c-1) && this.canJump(pawn.r, pawn.c, oppPawn.r, oppPawn.c-1)) {
				moves.push({sr:pawn.r, sc:pawn.c, dr:oppPawn.r, dc:oppPawn.c-1, type:FLOOR}); //Diag jump
			}
			if (this.onBoard(oppPawn.r, oppPawn.c+1) && this.canJump(pawn.r, pawn.c, oppPawn.r, oppPawn.c+1)) {
				moves.push({sr:pawn.r, sc:pawn.c, dr:oppPawn.r, dc:oppPawn.c+1, type:FLOOR}); //Diag jump
			}
		}
		else {
			if (this.onBoard(oppPawn.r-1, oppPawn.c) && this.canJump(pawn.r, pawn.c, oppPawn.r-1, oppPawn.c)) {
				moves.push({sr:pawn.r, sc:pawn.c, dr:oppPawn.r-1, dc:oppPawn.c, type:FLOOR}); //Diag jump
			}
			if (this.onBoard(oppPawn.r+1, oppPawn.c) && this.canJump(pawn.r, pawn.c, oppPawn.r+1, oppPawn.c)) {
				moves.push({sr:pawn.r, sc:pawn.c, dr:oppPawn.r+1, dc:oppPawn.c, type:FLOOR}); //Diag jump
			}
		}
	}
	
	
	//Place moves
	if (this.wallCounts[turn] <= 0) return moves; //No places available
	else if (moveType == FLOOR) return moves;
	
	for (var r = 0; r < WALL_SIZE; r++) {		
		for (var c = 0; c < WALL_SIZE; c++) {
			//Horizontal walls
			if (!this.intersectsWall(r, c, H_WALL)) {
				var hasPath1 = false;				
				if (pathCache[PLAYER1][r + ',' + c] ||
					pathCache[PLAYER1][(r+1) + ',' + c] ||
					pathCache[PLAYER1][(r) + ',' + (c+1)] ||
					pathCache[PLAYER1][(r+1) + ',' + (c+1)]) { //Part of path
					this.walls[r][c] = H_WALL; //Temp place for checking
					hasPath1 = this.getPathDFS(PLAYER1);
					this.walls[r][c] = NO_WALL; 
				}
				else hasPath1 = true;

				var hasPath2 = false;
				if (hasPath1) {
					if (pathCache[PLAYER2][r + ',' + c] ||
						pathCache[PLAYER2][(r+1) + ',' + c] ||
						pathCache[PLAYER2][(r) + ',' + (c+1)] ||
						pathCache[PLAYER2][(r+1) + ',' + (c+1)]) { //Part of path
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
				if (pathCache[PLAYER1][r + ',' + c] ||
					pathCache[PLAYER1][(r+1) + ',' + c] ||
					pathCache[PLAYER1][(r) + ',' + (c+1)] ||
					pathCache[PLAYER1][(r+1) + ',' + (c+1)]) { //Part of path
					this.walls[r][c] = V_WALL; //Temp place for checking
					hasPath1 = this.getPathDFS(PLAYER1);
					this.walls[r][c] = NO_WALL; 
				}
				else hasPath1 = true;

				var hasPath2 = false;
				if (hasPath1) {
					if (pathCache[PLAYER2][r + ',' + c] ||
						pathCache[PLAYER2][(r+1) + ',' + c] ||
						pathCache[PLAYER2][(r) + ',' + (c+1)] ||
						pathCache[PLAYER2][(r+1) + ',' + (c+1)]) { //Part of path
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
	this.wallPlacers[r][c] = this.turn; //Store Placer for optional display
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
	this.breadcrumbs[pawn.r][pawn.c] = true;
	var iterations = 0;
	while (queue.length) {
		
		var first = queue.pop();
		
		if (first.r == WIN_ROWS[turn]) {
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
			//console.log('DFS:', turn, iterations);
			return true; 
		}
		for (var d = 0; d < 4; d++) {
			var dir = searchDirs[d];
			var deltaR = first.r + dir.r;
			var deltaC = first.c + dir.c;			
			if (deltaR >= 0 && deltaR < FLOOR_SIZE && deltaC >= 0 && deltaC < FLOOR_SIZE) {
				if (!this.breadcrumbs[deltaR][deltaC]) {										
					if (!this.collidesWithWall(first.r, first.c, deltaR, deltaC)) {
						queue.push({r:deltaR, c:deltaC, path:first.path+dir.dir});							
						this.breadcrumbs[deltaR][deltaC] = true;
					}										
				}
			}
		}

		if (iterations++ >= MAX_SEARCH_ITERATIONS) {
			throw new Error('DFS: Stuck in infinite loop');
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
	this.breadcrumbs[pawn.r][pawn.c] = true;
	var iterations = 0;
	while (queue.length) {
		var first = queue.shift();		
		
		if (first.r == WIN_ROWS[turn]) {
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
			//console.log('BFS:', turn, iterations);
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
						//Straight
						if (jumpR >= 0 && jumpR < FLOOR_SIZE && jumpC >= 0 && jumpC < FLOOR_SIZE) {
							if (this.canJump(turn, first.r, first.c, jumpR, jumpC)) {
								queue.push({r:jumpR, c:jumpC, path:first.path+dir.dir+dir.dir});								
								this.breadcrumbs[jumpR][jumpC] = true;
								this.breadcrumbs[deltaR][deltaC] = true;
							}
							
						}
						//Diagonal
						if (dir.c == 0) {
							if (this.onBoard(oppPawn.r, oppPawn.c-1) && this.canJump(turn, first.r, first.c, oppPawn.r, oppPawn.c-1)) {
								queue.push({r:oppPawn.r, c:oppPawn.c-1, path:first.path+dir.dir+this.getTurnedDir(0,-1)});								
								this.breadcrumbs[deltaR][deltaC] = true;
								this.breadcrumbs[oppPawn.r][oppPawn.c-1] = true;								
							}
							if (this.onBoard(oppPawn.r, oppPawn.c+1) && this.canJump(turn, first.r, first.c, oppPawn.r, oppPawn.c+1)) {
								queue.push({r:oppPawn.r, c:oppPawn.c+1, path:first.path+dir.dir+this.getTurnedDir(0,1)});								
								this.breadcrumbs[deltaR][deltaC] = true;
								this.breadcrumbs[oppPawn.r][oppPawn.c+1] = true;
							}
						}
						else {
							if (this.onBoard(oppPawn.r-1, oppPawn.c) && this.canJump(turn, first.r, first.c, oppPawn.r-1, oppPawn.c)) {
								queue.push({r:oppPawn.r-1, c:oppPawn.c, path:first.path+dir.dir+this.getTurnedDir(-1,0)});								
								this.breadcrumbs[deltaR][deltaC] = true;
								this.breadcrumbs[oppPawn.r-1][oppPawn.c] = true;								
							}
							if (this.onBoard(oppPawn.r+1, oppPawn.c) && this.canJump(turn, first.r, first.c, oppPawn.r+1, oppPawn.c)) {
								queue.push({r:oppPawn.r+1, c:oppPawn.c, path:first.path+dir.dir+this.getTurnedDir(1,0)});								
								this.breadcrumbs[deltaR][deltaC] = true;
								this.breadcrumbs[oppPawn.r+1][oppPawn.c] = true;
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
			//console.log('BFS: stuck in infinite loop');
			throw new Error('BFS: Stuck in infinite loop');			
		}
	}

	this.paths[turn] = [];
	return false;
}

Board.prototype.score = function() {
	var oppTurn = +(!this.turn);
	return this.scoreSide(this.turn)-this.scoreSide(oppTurn);
}

Board.prototype.scoreSide = function(turn) {	
	return this.wallCounts[turn] + ((FLOOR_SPACES-this.paths[turn].length)*100);	
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
			var wallChar;		
			if (wallType == NO_WALL) wallChar = CHAR_NO_WALL;
			else if (wallType == H_WALL) wallChar = CHAR_H_WALL;
			else if (wallType == V_WALL) wallChar = CHAR_V_WALL;
			else throw new Error('Invalid wall type at ' + r + ',' + c + ':' + wallType);
			
			if (this.wallPlacers[r][c] == PLAYER2) boardStr += wallChar.toLowerCase();
			else boardStr += wallChar;
			
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
		var wallChar = boardStr[w];
		var wallCharUpper = wallChar.toUpperCase();
		var r = Math.floor(w / WALL_SIZE);
		var c = w % WALL_SIZE;

		if (wallCharUpper == CHAR_H_WALL) this.walls[r][c] = H_WALL;
		else if (wallCharUpper == CHAR_V_WALL) this.walls[r][c] = V_WALL;
		else if (wallCharUpper != CHAR_NO_WALL) throw new Error('Invalid walltype: ' + wallChar);
				
		if (wallChar < 'Z') this.wallPlacers[r][c] = PLAYER1;
		else this.wallPlacers[r][c] = PLAYER2;
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

Board.prototype.omnFromRC = function(pos) {
	return String.fromCharCode(65+pos.c) + (FLOOR_SIZE-pos.r);
}

Board.prototype.qmnMove = function(qmn) {	
	var move = this.qmnToMove(qmn);
	var moveCode = this.makeMove(move);
	if (moveCode == VALID) this.changeTurn();
	return moveCode;
	
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
}

Board.prototype.omnToMove = function(omn) {	
	//Example E2, or A2V	
	if (omn.length == 2) { //Move pawn
		omn = omn.toLowerCase().replace(/[^a-i][^1-9]/g, '');
		return {
			sr : this.pawns[this.turn].r,
			sc : this.pawns[this.turn].c,
			
			dr : FLOOR_SIZE-parseInt(omn.charAt(1)),
			dc : parseInt(omn.charCodeAt(0))-97,
			type: FLOOR
		}
	}
	else if (omn.length == 3) { //Place wall
		omn = omn.toLowerCase().replace(/[^a-i][^1-9][hv]/g, '');
		var wall = omn.charAt(2);
		if (wall == 'v') wall = V_WALL;
		else if (wall == 'h') wall = H_WALL;
		else throw new Error('Invalid OMN wall type:' + wall);

		return {
			r : FLOOR_SIZE-parseInt(omn.charAt(1))-1, //lower left
			c : parseInt(omn.charCodeAt(0))-97,						
			type: wall
		}
	}
	else throw new Error('Invalid OMN: ' + omn);	
}

Board.prototype.qmnFromMove = function(move) {	
	//Move pawn
	if (move.type == FLOOR) return this.qmnFromRC({r:move.dr, c:move.dc}); 

	//Place wall
	else { 
		var wallType = move.type == H_WALL? CHAR_H_WALL : CHAR_V_WALL;
		return this.qmnFromRC(move) + wallType; 		
	}
		
}

Board.prototype.omnFromMove = function(move) {	
	//Move pawn
	if (move.type == FLOOR) return this.omnFromRC({r:move.dr, c:move.dc}); 

	//Place wall
	else { 
		var wallType = move.type == H_WALL? CHAR_H_WALL : CHAR_V_WALL;
		var omn = String.fromCharCode(65+move.c) + (FLOOR_SIZE-move.r-1); //For lower left corner
		return omn + wallType; 		
	}
		
}

Board.prototype.getTurnedDir = function (r, c) {
	if (r == 0) {
		if (c == 1) return 'R';					
		else if (c == -1) return 'L';								
	}
	else { //c == 0
		if (r == 1) return 'B';		
		else if (r == -1) return 'F';			
	}
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




//End class Board
