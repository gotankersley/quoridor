var HeuristicPlayer = (function() { //Poor man's namespace (module pattern)
		
	function getPlayOld(board, onPlayed) {	
		
		var oppTurn = +(!board.turn);
		var oppPawn = board.pawns[oppTurn];
		//Try to block
		var oppPreWinRow = WIN_ROWS[oppTurn]+(2*ADVANCE_DIR[oppTurn]);
		var endingRow = WIN_ROWS[oppTurn];
		if (oppPawn.r == oppPreWinRow) {
			var placeCode;
			if (oppPawn.c - 1 >= 0) {
				placeCode = board.validatePlace(endingRow, oppPawn.c-1, H_WALL);
				if (placeCode == VALID) return onPlayed({r:endingRow, c:oppPawn.c-1, type:H_WALL});
			}
			else if (oppPawn.c < WALL_SIZE) {
				placeCode = board.validatePlace(endingRow, oppPawn.c, H_WALL);
				if (placeCode == VALID) return onPlayed({r:endingRow, c:oppPawn.c, type:H_WALL});
			}
		}

		var moves = board.getMoves();		
		if (!moves.length) throw new Error('No moves available');
		
		var bestScore = -INFINITY;
		var bestMoveIndex = -1;
		for (var m = 0; m < moves.length; m++) {
			var move = moves[m];
			var boardCopy = board.copy();
			boardCopy.makeMove(move);
			var score = boardCopy.score();
			if (score > bestScore){ 
				bestScore = score;
				bestMoveIndex = m;
			}
		}
				
		
		if (bestMoveIndex < 0) {
			console.log('No best move found');			
			return onPlayed();
		}
		else {	
			console.log('BestScore: ' + bestScore);
			return onPlayed(moves[bestMoveIndex]);														
		}
		
	}

	function getPlay(board, onPlayed) {	
	
		var turn = board.turn;
		var oppTurn = OPP_TURN[turn];

		var bl = BoardLite_fromBoard(board);
		var pawn = bl[turn];


		var plays = new Uint16Array(MAX_PLAYS+1);
		var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]	
		
		var gameTheoreticalScore = BoardLite_getPlays(bl, turn, plays, cachePath1, cachePath2, true);
		if (plays[MAX_PLAYS] == 0) throw new Error('No moves available');
		else if (gameTheoreticalScore == -INFINITY) {
			console.log('Heuristic: Inevitable loss');
			var typeDest = plays[0];			
			var move = BoardLite_toBoardMove(bl, turn, typeDest);
			return onPlayed(move);			
		}	

					
		var bestScore = -INFINITY;
		var bestPlayIndex = -1;
		
		for (var p = 0; p < plays[MAX_PLAYS]; p++) {
			var typeDest = plays[p];
			var dest = typeDest & MASK_DEST;
			var type = typeDest & MASK_TYPE;				
			
			var childBoard = bl.slice();
			
			if (type == TYPE_MOVE) BoardLite_makeMove(childBoard, turn, dest);
			else BoardLite_makePlace(childBoard, turn, dest, type);


			//var score = BoardLite_score(childBoard, turn, dest, type, cachePath1, cachePath2); 
			var score = BoardLite_score2(childBoard, turn);
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

	
	//Exports
	return {
		getPlay:getPlay
	}

})(); //End namespace HeuristicPlayer
