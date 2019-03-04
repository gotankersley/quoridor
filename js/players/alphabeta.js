var AlphaBetaPlayer = (function() { //Poor man's namespace (module pattern)
	const DEBUG = true;
	const MAX_DEPTH = 4;
		
	var bestTypeDestAtDepth = new Array(MAX_DEPTH);		
	var bestScoreAtDepth = new Array(MAX_DEPTH);

	var totalNodes = 0;	
	
	function play(board, onPlayed) {					
		
				
		var turn = board.turn;
		var oppTurn = OPP_TURN[turn];
		var bl = BoardLite_fromBoard(board);	
				

		//Reset runtime variables				
		bestTypeDestAtDepth = bestTypeDestAtDepth.fill(INVALID);		
		bestScoreAtDepth = bestScoreAtDepth.fill(-INFINITY);
		BoardLite_clean();
		totalNodes = 0; //Debug
		
		//START SEARCH
		var timeStart = performance.now();
		var bestScore = negamax(bl, turn, oppTurn, -INFINITY, INFINITY, 0);
		var duration = performance.now() - timeStart;
		
		
		//CHOOSE MOVE		
		var bestTypeDest = bestTypeDestAtDepth[0];		
		var bestScore = bestScoreAtDepth[0];

		
		//Debugging info
		if (DEBUG) {
			if (bestScore >= INFINITY) Stage.sendMessage('AB: Win found');
			else if (bestScore <= -INFINITY) {
				Stage.sendMessage('AB: Inevitable loss'); 
			}			
			
			console.log ('AlphaBeta Stats:');
			console.log ('- time: ' + duration + ' ms');
			console.log ('- total nodes: ' + totalNodes);			
			console.log ('- best score: ' + bestScore);
			
			console.log ('- best move: ' + bestTypeDest);				
			//console.log ('- depth: ' + MAX_DEPTH);
			//console.log ('J/S AB score: ' + bestScore);			
		}	
		
		
		if (bestTypeDest == INVALID) { //Probably gonna lose - Get first avail
			var moves = board.getMoves();
			if (!moves.length) return onPlayed();	
			else return onPlayed(moves[0]);
		}		
		else { //Use the best move found			
			var move = BoardLite_toBoardMove(bl, turn, bestTypeDest);	
			return onPlayed(move);
		}
	}
	
	//Recursive Alpha-Beta tree search	
	function negamax (bl, turn, oppTurn, alpha, beta, depth) { 						
		
		//EXPANSION	
		var bestScore = -INFINITY;
		
		var plays = new Uint16Array(MAX_PLAYS+1);
		var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]	
		
		var useMinCache = depth+1 >= MAX_DEPTH? true : false;
		var gameTheoreticalScore = BoardLite_getPlays(bl, turn, plays, cachePath1, cachePath2, useMinCache); //Pass play by reference
		if (gameTheoreticalScore == INFINITY) { //Game theoretical win			
			bestTypeDestAtDepth[depth] = typeDest;
			bestScoreAtDepth[depth] = gameTheoreticalScore;
			return INFINITY; 
		}
		else if (gameTheoreticalScore == -INFINITY) return -INFINITY;


		//Loop through child states						
		totalNodes += plays[MAX_PLAYS];
		for (var c = 0; c < plays[MAX_PLAYS]; c++) { 		
			var typeDest = plays[c];
			var dest = typeDest & MASK_DEST;
			var type = typeDest & MASK_TYPE;

			var childBoard = bl.slice();
			if (type == TYPE_MOVE) BoardLite_makeMove(childBoard, turn, dest);
			else BoardLite_makePlace(childBoard, turn, dest, type);						
				
			var recursedScore;
			//Pre-Recursive Anchor
			if (depth+1 >= MAX_DEPTH) {
				//Reversed turns, because it would have switched
				recursedScore = BoardLite_score(childBoard, oppTurn, dest, type, cachePath2, cachePath1); 
			}
			else recursedScore = negamax(childBoard, oppTurn, turn, -beta, -Math.max(alpha, bestScore), depth+1); //Swap cur player as we descend

			var currentScore = -recursedScore; //This is for the 'nega' part of negamax
			
			if (currentScore > bestScore) { 
				bestScore = currentScore;								
				bestTypeDestAtDepth[depth] = typeDest;
				bestScoreAtDepth[depth] = currentScore;				
				
				if (bestScore >= beta) return bestScore;//AB cut-off
			}	
		}
		
		return bestScore;
	}
	
	//Exports
	return {
		getPlay:play
	}

})(); //End namespace AlphaBetaPlayer