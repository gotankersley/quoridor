var HeuristicPlayer = (function() { //Poor man's namespace (module pattern)
		

	function getPlay(board, onPlayed) {	
	
		var turn = board.turn;
		var oppTurn = OPP_TURN[turn];

		var bl = BoardLite_fromBoard(board);
		var pawn = bl[turn];

		//var blMoves = BoardLite_getMoves(bl, turn).sort(sortNumber);
		//var boardMoves = convertBoardMoves(board).sort(sortNumber);
		//if (!areEqual(blMoves, boardMoves)) {
			//displayArray(blMoves, 'blMoves');
			//displayArray(boardMoves, 'boardMoves');
			//throw new Error('Plays not equal');		
		//}

		var plays = new Uint16Array(MAX_PLAYS+1);
		var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]	
		
		var gameTheoreticalScore = BoardLite_getPlays(bl, turn, plays, cachePath1, cachePath2, true);
		if (plays[MAX_PLAYS] == 0) throw new Error('No moves available');
		else if (gameTheoreticalScore == -INFINITY) {
			console.log('Heuristic: Inevitable loss');
			var typeDest = plays[0];
			var dest = typeDest & MASK_DEST;
			var type = typeDest & MASK_TYPE;
			var move = BoardLite_toBoardMove(bl, turn, dest, type);
			return onPlayed(move);			
		}	
		//else BoardLite_filterPlays(plays, TYPE_MOVE);
			
					
		var bestScore = -INFINITY;
		var bestPlayIndex = -1;
		
		for (var p = 0; p < plays[MAX_PLAYS]; p++) {
			var typeDest = plays[p];
			var dest = typeDest & MASK_DEST;
			var type = typeDest & MASK_TYPE;				
			
			var childBoard = bl.slice();
			
			if (type == TYPE_MOVE) BoardLite_makeMove(childBoard, turn, dest);
			else BoardLite_makePlace(childBoard, turn, dest, type);


			var score = BoardLite_score(childBoard, turn, dest, type, cachePath1, cachePath2); 
			//console.log(p + '-', score)	
			
			if (score > bestScore){ 
				bestScore = score;
				bestPlayIndex = p;
			}
			
		}

				
		//Pick best move
		console.log('BestScore: ' + bestScore);
		var typeDest = plays[bestPlayIndex];
		var dest = typeDest & MASK_DEST;
		var type = typeDest & MASK_TYPE;		
		var move = BoardLite_toBoardMove(bl, turn, typeDest);
		return onPlayed(move);			
		
	}

	//Debug functions
	function areEqual(array1, array2) {
		var isSame = true;		
		var longest = Math.max(array1.length, array2.length);
		for (var a = 0; a < longest; a++) {
			if (a >= array1.length || a >= array2.length || array1[a] != array2[a]) {
				console.log('bl', array1[a], 'board', array2[a]);
				isSame = false;
			}
		}

		return isSame;
	}
	

	function convertBoardMoves(board, type) {
		var boardMoves = board.getMoves();
		var moves = [];
		var filter = typeof(type) == 'undefined'? false : true;		
		
		for (var m = 0; m < boardMoves.length; m++) {
			var move = boardMoves[m];
			if (filter) {
				if (type & TYPE_MOVE_JUMP && move.type == FLOOR) moves.push(TYPE_MOVE | getPos(move.dr, move.dc));
				else if (type & TYPE_WALL) {
					if (move.type == H_WALL) moves.push(TYPE_HORZ | getWallPos(move.r, move.c));		
					else moves.push(TYPE_VERT | getWallPos(move.r, move.c));		
				}
			}
			else {
				if (move.type == FLOOR)	moves.push(TYPE_MOVE | getPos(move.dr, move.dc));			
				else if (move.type != NO_WALL) {
					if (move.type == H_WALL) moves.push(TYPE_HORZ | getWallPos(move.r, move.c));		
					else moves.push(TYPE_VERT | getWallPos(move.r, move.c));		
				} 
			}

		}
		return moves;
	}

	function getPos(r, c) {
		return (r*FLOOR_SIZE)+c;
	}
	function getWallPos(r, c) {
		return (r*WALL_SIZE)+c;
	}
	
	function sortNumber(a,b) {
		return a - b;
	}

	function displayArray(moves, name) {
		console.log(name, moves.length);
		for (var m = 0; m < moves.length; m++) {
			var typeDest = moves[m];
			var dest = typeDest & MASK_DEST;
			var type = typeDest & MASK_TYPE;
			console.log(m, dest, getTypeName(type));
		}
	}

	function getTypeName(type) {
		if (type == TYPE_MOVE) return 'Move';
		else if (type == TYPE_HORZ) return 'HWall';
		else if (type == TYPE_VERT) return 'VWall';
		else return 'Invalid type: ' + type;
	}
	
	//Exports
	return {
		getPlay:getPlay
	}

})(); //End namespace HeuristicPlayer
