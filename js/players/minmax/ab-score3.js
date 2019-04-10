var MinotaurPlusPlayer = (function() { //Poor man's namespace (module pattern)
const DEBUG = true;
const MAX_DEPTH = 6;
	
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
	totalNodes = 0; //Debug
	
	//START SEARCH
	var timeStart = performance.now();
	var bestScore = negamax(bl, turn, oppTurn, -INFINITY, INFINITY, 0, INVALID, INVALID);
	var duration = performance.now() - timeStart;
	
	
	//CHOOSE MOVE		
	var bestTypeDest = bestTypeDestAtDepth[0];		
	var bestScore = bestScoreAtDepth[0];

	
	//Debugging info
	if (bestScore >= INFINITY) game.sendMessage('EvilKingMinos: Win found');
	else if (bestScore <= -INFINITY) {
		game.sendMessage('EvilKingMinos: Inevitable loss'); 
	}			
	if (DEBUG) {
		
		console.log ('AlphaBeta Stats:');
		console.log ('- time: ' + duration + ' ms');
		console.log ('- total nodes: ' + totalNodes);			
		console.log ('- best score: ' + bestScore);
		
		console.log ('- best move: ' + bestTypeDest);								
	}	
	
	
	if (bestTypeDest == INVALID) { //Probably gonna lose - start walking min path
		var minPathAndOrigin = BoardLite_Path_Min_getDistAndOrigin(bl, turn);    		
		var origin = minPathAndOrigin[1];     
		var move = BoardLite_toBoardMove(bl, turn, TYPE_MOVE | origin);	
		return onPlayed(move);
	}		
	else { //Use the best move found			
		var move = BoardLite_toBoardMove(bl, turn, bestTypeDest);	
		return onPlayed(move);
	}
}


//Recursive Alpha-Beta tree search	
function negamax (bl, turn, oppTurn, alpha, beta, depth, noPlaceCount1, noPlaceCount2) { 						
	
	if (depth >= MAX_DEPTH) return BoardLite_score3(bl, turn, noPlaceCount2, noPlaceCount1); //noPlaceCounts switched because from parent, and recursed
	//EXPANSION	
	var bestScore = -INFINITY;
	
	var plays = new Uint16Array(MAX_PLAYS+1);
	var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
	var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]	
	

	var useMinCache = false;	
	var getAllMoves = false;//Restrict to crit region
	var gameOverScore;
	if (turn == PLAYER1) gameOverScore = BoardLite_getPlays(bl, turn, plays, cachePath1, cachePath2, useMinCache, getAllMoves); //Pass play by reference
	else gameOverScore = BoardLite_getPlays(bl, turn, plays, cachePath2, cachePath1, useMinCache, getAllMoves); //Pass play by reference
	if (gameOverScore == INFINITY) { //Game theoretical win			
		bestTypeDestAtDepth[depth] = plays[0];
		bestScoreAtDepth[depth] = gameOverScore;
		return INFINITY; 
	}
	else if (gameOverScore == -INFINITY) return -INFINITY;
	
	noPlaceCount1 = plays[MAX_PLAYS-1-turn];
	noPlaceCount2 = plays[MAX_PLAYS-1-oppTurn];
	
	//Loop through child states						
	totalNodes += plays[MAX_PLAYS];
	for (var c = 0; c < plays[MAX_PLAYS]; c++) { 		
		var typeDest = plays[c];
		var dest = typeDest & MASK_DEST;
		var type = typeDest & MASK_TYPE;

		var childBoard = bl.slice();			
		

		if (type & TYPE_MOVE_JUMP) BoardLite_makeMove(childBoard, turn, dest);					
		else BoardLite_makePlace(childBoard, turn, dest, type);									
		

		var currentScore;	
		var recursedScore;		
		
		recursedScore = negamax(childBoard, oppTurn, turn, -beta, -Math.max(alpha, bestScore), depth+1, noPlaceCount1, noPlaceCount2); //Swap cur player as we descend
		var currentScore = -recursedScore;
		
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

})(); //End namespace MinotaurPlusPlayer