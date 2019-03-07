//Weights - MOVE to AI
const WEIGHT_WALLCOUNT = 1;
const WEIGHT_PATH = 100;

const PAWN = 0;
const PAWN1 = 0; //Same as PLAYER1
const PAWN2 = 1; //Same as PLAYER2

const WALL_COUNT = PAWN+PLAYERS;
const WALL_COUNT1 = WALL_COUNT;
const WALL_COUNT2 = WALL_COUNT+1;

const WALL_CENTERS = WALL_COUNT+PLAYERS;

const BL_STRUCT_SIZE = 
    PLAYERS + //PAWNS
    PLAYERS + //WALL_COUNTS
    WALL_SPACES; //WALL_CENTERS



const MAX_PLAYS = (WALL_SPACES*2)+5; //Max branching factor, 64x2 walls, 5 pawn moves
const INFINITY = 1000000;
const INVALID = -1;

//Now with 75% less (syntactic) sugar...
function BoardLite_new() { //2 players only   
    return new Uint16Array(BL_STRUCT_SIZE);
}   



function BoardLite_makeMove(b, turn, dest) { 
    //No validation provided        
    b[turn] = dest;  //this.pawns[turn] = dest;       
}


function BoardLite_makePlace(b, turn, dest, wallType) {
    //No validation provided    
    b[WALL_COUNT+turn]--; //this.wallCounts[this.turn]--;	
    b[WALL_CENTERS+dest] = wallType; //this.walls[dest] = wallType;     
}


function BoardLite_getPlays(b, turn, playsRef, cacheRef1, cacheRef2, getMinCache, debug) {  //#thanks for the memories
        
    var oppTurn = OPP_TURN[turn];
    var oppPawn = b[oppTurn];

    //Get Moves
    BoardLite_addMoves(b, turn, playsRef);
    BoardLite_addJumps(b, turn, playsRef);

    
    //Take win if available
    for (var m = 0; m < playsRef[MAX_PLAYS]; m++) {
        var typeDest = playsRef[m];
        var dest = typeDest & MASK_DEST;
        var type = typeDest & MASK_TYPE;
        var destR = FLOOR_POS_TO_R[dest];
        if (destR == WIN_ROWS[turn]){ //Win
            playsRef[MAX_PLAYS] = 1; //Only 1 option available                                                  
            playsRef[0] = type | dest;            
            return INFINITY;
        }
    }

    //Block opponent if necessary 
    var oppPawnR = FLOOR_POS_TO_R[oppPawn];
    if (oppPawnR == PRE_WIN_ROWS[oppTurn] || oppPawnR == PRE_WIN_ROWS2[oppTurn]) {
        var betweenIndex = (oppPawn*8)+(DIR_ADVANCE[oppTurn]*2);        
        var wallPos1 = WALLS_BETWEEN[betweenIndex];
        var wallPos2 = WALLS_BETWEEN[betweenIndex+1];   

        
        if (b[WALL_CENTERS+wallPos1] != TYPE_HORZ && b[WALL_CENTERS+wallPos2] != TYPE_HORZ) { //See if spot is open
            
            if (b[WALL_COUNT+turn] == 0) return -INFINITY; //No walls to place
            var maxPlays = 0;
            if (BoardLite_canPlace(b, wallPos1, TYPE_HORZ)) playsRef[maxPlays++] = TYPE_HORZ | wallPos1;                       
            if (BoardLite_canPlace(b, wallPos2, TYPE_HORZ)) playsRef[maxPlays++] = TYPE_HORZ | wallPos2;
                
            if (maxPlays) { //Only return the moves that will block
                playsRef[MAX_PLAYS] = maxPlays;
                return 0;
            }                  
            else return -INFINITY; //Unable to block
        }
    }   
   
    //Wallcounts are both zero - shortest path wins
    if (b[WALL_COUNT1] + b[WALL_COUNT2]  == 0) {
        
        var minPathAndOrigin1 = BoardLite_Path_Min_getDistAndOrigin(b, turn);         
        var minDist1 = minPathAndOrigin1[0];       
        var origin1 = minPathAndOrigin1[1];        
        if (b[oppTurn] == origin1) { //Jump
            for (var p = 0; p < playsRef[MAX_PLAYS]; p++) {
                if (playsRef[p] & TYPE_JUMP) playsRef[0] = TYPE_MOVE | (playsRef[p] & MASK_DEST);
            }
            minDist1--; 
        }
        else playsRef[0] = TYPE_MOVE | origin1;          
        playsRef[MAX_PLAYS] = 1; //Only 1 option available
        
        var minDist2 = BoardLite_Path_Min_getDist(b, oppTurn); //Todo, potential for jump as well
        if (minDist1 <= minDist2) return INFINITY;   //Tie goes to player
        else return -INFINITY; //Loss 
    
    }   
    
   
    //Add Places
    else if (b[WALL_COUNT+turn] > 0) { 
        //Populate cachePath - assume this will succeed, or we have bigger problems...
        if (getMinCache) {            
            BoardLite_Path_Min_populateCache(b, PLAYER1, cacheRef1); 
            BoardLite_Path_Min_populateCache(b, PLAYER2, cacheRef2); 
        }
        else {
            BoardLite_Path_DFS_populateCache(b, PLAYER1, cacheRef1);
            BoardLite_Path_DFS_populateCache(b, PLAYER2, cacheRef2);
        }        
       
        BoardLite_addPlaces(b, TYPE_HORZ, playsRef, cacheRef1, cacheRef2); 
        BoardLite_addPlaces(b, TYPE_VERT, playsRef, cacheRef1, cacheRef2);         
    }        
    //Else just use the moves and jumps    

    return 0; //In play
}


function BoardLite_addMoves(b, turn, playsRef) { //playsRef passed by reference        
        
    var pawn = b[turn];
	var oppTurn = OPP_TURN[turn];
	var oppPawn = b[oppTurn];
    var maxPlays = playsRef[MAX_PLAYS];

	//Pawn moves
    var availMoves = MOVES_BY_POS[pawn];
    for (var m = 0; m < availMoves.length; m+=2) { //[dest, dir]...
        var dest = availMoves[m];
        var dir = availMoves[m+1];
        if (oppPawn == dest) continue; //Occupied        
        else if (!BoardLite_isWallBetween(b, pawn, dir)) {            
            playsRef[maxPlays++] = TYPE_MOVE | dest;            
        }
    }
    playsRef[MAX_PLAYS] = maxPlays;
}

function BoardLite_addJumps(b, turn, playsRef) { //playsRef passed by reference        
    var pawn = b[turn];
    var oppTurn = OPP_TURN[turn];
    var oppPawn = b[oppTurn];	

    //Adjacent - check for jumps     
    if (BoardLite_isAdjacent(pawn, oppPawn)) {	
		//Make sure there isn't an intersecting wall between jumper and jumpee
		var dir = POS_DELTA_TO_DIR[9+pawn-oppPawn];
        
        if (!BoardLite_isWallBetween(b, pawn, dir)) {		            
            //Straight
            var jumpDest = BoardLite_AddJumpToPlaysIfOpen(b, oppPawn, dir, playsRef);
            
            //Diagonal  
            if (jumpDest < 0) {                          
                var diagIndex = 2*dir;
                BoardLite_AddJumpToPlaysIfOpen(b, oppPawn, DIAG_DIRS[diagIndex], playsRef);
                BoardLite_AddJumpToPlaysIfOpen(b, oppPawn, DIAG_DIRS[diagIndex+1], playsRef);              
            }
			
		}
		
	}
	            
}

function BoardLite_AddJumpToPlaysIfOpen(b, pos, dir, playsRef) { 
    var jumpDestR = FLOOR_POS_TO_R[pos] + DELTA_R_BY_DIR[dir];
    var jumpDestC = (pos%FLOOR_SIZE) + DELTA_C_BY_DIR[dir];
    var jumpDest = (jumpDestR*FLOOR_SIZE)+jumpDestC;
    
    //On Board    
    if (jumpDestR >= 0 && jumpDestR < FLOOR_SIZE && jumpDestC >= 0 && jumpDestC < FLOOR_SIZE) { 
        if (!BoardLite_isWallBetween(b, pos, dir)) {                        
            playsRef[playsRef[MAX_PLAYS]++] = TYPE_JUMP | jumpDest;
            
            return jumpDest;
        }
    }
    return -1;
}


function BoardLite_addPlaces(b, wallType, playsRef, cacheRef1, cacheRef2) { //playsRef, and cacheRefs passed by reference            
   
    var maxPlays = playsRef[MAX_PLAYS];           
    var wallTypeIndex = wallType >>> 9;

    for (var w = 0; w < WALL_SPACES; w++) {      
        var adjIndex = (w*4)+(wallTypeIndex*2);
        var adjacent1 = ADJACENT[adjIndex]; 
        var adjacent2 = ADJACENT[adjIndex+1];             
        var canPlace = true;
        

        //See if we can place at this location:
        if (b[WALL_CENTERS+w] != TYPE_NONE) continue; //No - Intersects existing wall            
        else if (b[WALL_CENTERS+adjacent1] == wallType || b[WALL_CENTERS+adjacent2] == wallType) continue; //No - Intersects adjacent wall
        
        else if ((cacheRef1[w] | cacheRef2[w]) & TYPE_WALL) { //Part of player(s) path - Have to do further checking to make sure this is legal
            if (BoardLite_touchesNeighbor(b, w, wallTypeIndex)) { //Touches neighbor - Have to verify this doesn't block a player
                b[WALL_CENTERS+w] = wallType; //Temp place for checking
                                    
                if ((cacheRef1[w] & wallType) && (cacheRef2[w] & wallType)) {// Both affected
                    var hasPath = BoardLite_Path_DFS_has(b, PLAYER1); //Start by checking player1 - DFS 
                    if (hasPath) canPlace = BoardLite_Path_DFS_has(b, PLAYER2); //Player1 has a path, so also check Player2 - DFS
                    else canPlace = false; //Player1 blocked, so no need to check Player2
                }
                else if (cacheRef1[w] & wallType) canPlace = BoardLite_Path_DFS_has(b, PLAYER1); //Only check Player1 - DFS
                else canPlace = BoardLite_Path_DFS_has(b, PLAYER2); //Only check Player2 - DFS
                
                b[WALL_CENTERS+w] = TYPE_NONE; //Undo temp place                                   
            }     
            //else canPlace = false;         
            //Else not touching any other walls, so it can't be blocking any players and has to be legal
        }
        //else canPlace = false;
        //Else not part of cachePath, so it has to be legal

        //Legal place
        if (canPlace) {
            playsRef[maxPlays++] = wallType | w;            
        }
    }                     
         	
    playsRef[MAX_PLAYS] = maxPlays;

}

function BoardLite_canPlace(b, wallPos, wallType) {
    var wallTypeIndex = wallType >>> 9;
    var adjIndex = (wallPos*4)+(wallTypeIndex*2);
    var adjacent1 = ADJACENT[adjIndex]; 
    var adjacent2 = ADJACENT[adjIndex+1];    

    if (b[WALL_CENTERS+wallPos] != TYPE_NONE) return false; //No - Intersects existing wall       
    else if (b[WALL_CENTERS+adjacent1] == wallType || b[WALL_CENTERS+adjacent2] == wallType) return false; //No - Intersects adjacent wall   

    b[WALL_CENTERS+wallPos] = wallType; //Temp place for checking
    var hasPath = BoardLite_Path_DFS_has(b, PLAYER1); //Start by checking player1 - DFS 
    if (hasPath) hasPath = BoardLite_Path_DFS_has(b, PLAYER2); //Player1 has a path, so also check Player2 - DFS
    b[WALL_CENTERS+wallPos] = TYPE_NONE; //Undo temp place  
    return hasPath;  
}

function BoardLite_touchesNeighbor(b, pos, wallTypeIndex) {
    
    var neighbors = NEIGHBOR_WALLS[wallTypeIndex][pos];
    for (var n = 0; n < neighbors.length; n+=2) {
        var neighborPos = neighbors[n];
        var neighborType = neighbors[n+1];

        if (b[WALL_CENTERS+neighborPos] == neighborType) return true;
        
    }
    return false;
}



function BoardLite_isWallBetween(b, pos, dir) {    
    var betweenIndex = (pos*8)+(dir*2);
    var wallType = WALLTYPE_BY_DIR[dir];
    var wallPos1 = WALLS_BETWEEN[betweenIndex];
    var wallPos2 = WALLS_BETWEEN[betweenIndex+1];
    
    if (b[WALL_CENTERS+wallPos1] == wallType || b[WALL_CENTERS+wallPos2] == wallType) return true;
    else return false;
}

function BoardLite_score2(b, turn) {
    var oppTurn = OPP_TURN[turn];            
           
    var dist1 = BoardLite_Path_Min_getDist(b, turn); //Always recalc
    var dist2;           
    if (BoardLite_isAdjacent(b[turn], b[oppTurn])) { //See if opp is adjacent, and can jump
        var minPathAndOrigin2 = BoardLite_Path_Min_getDistAndOrigin(b, oppTurn); 
        var origin2 = minPathAndOrigin2[1];
        dist2 = minPathAndOrigin2[0];
        if (origin2 == b[turn]) dist2--; //Also has the potential for a jump			
    }
    else dist2 = BoardLite_Path_Min_getDist(b, oppTurn);

    var score1 = BoardLite_scoreSide(b, turn, dist1); 
    var score2 = BoardLite_scoreSide(b, oppTurn, dist2+1); //Extra dist, because it's not their turn    
    return score1 - score2;         
}

function BoardLite_score(b, turn, dest, type, cacheRef1, cacheRef2) {
    var oppTurn = OPP_TURN[turn];
    var dist1 = cacheRef1[WALL_SPACES];
    var dist2 = cacheRef2[WALL_SPACES];
        
    
    if (type & TYPE_MOVE_JUMP) {        
        dist1 = BoardLite_Path_Min_getDist(b, turn); //Always need to recalculate for moves, (jump -1 already handled by starting position)
                    
        if (BoardLite_isAdjacent(b[turn], b[oppTurn])) { //See if opp is adjacent, and can jump
            var minPathAndOrigin2 = BoardLite_Path_Min_getDistAndOrigin(b, oppTurn); 
            var origin2 = minPathAndOrigin2[1];
            dist2 = minPathAndOrigin2[0];
            if (origin2 == b[turn]) dist2--; //Also has the potential for a jump			
        }
                
    }
    else { //Place
        if (cacheRef1[dest] & type) dist1 = BoardLite_Path_Min_getDist(b, turn); //Blocks min path, have to recalc        
        if (cacheRef2[dest] & type) dist2 = BoardLite_Path_Min_getDist(b, oppTurn); //Blocks min path, have to recalc        
    }				

    var score1 = BoardLite_scoreSide(b, turn, dist1); 
    var score2 = BoardLite_scoreSide(b, oppTurn, dist2+1); //Extra dist, because it's not their turn    
    return score1 - score2;         
}

function BoardLite_scoreSide(b, turn, minDist) {    
    //return FLOOR_SPACES-minDist;
    return (
        (b[WALL_COUNT+turn] * WEIGHT_WALLCOUNT) +
        ((FLOOR_SPACES-minDist) * WEIGHT_PATH)
    );
}

function BoardLite_isGameOver(b, turn) {        
    //Reached the opposite end row
    var pawnR = FLOOR_POS_TO_R[b[turn]];
    if (pawnR == WIN_ROWS[turn]) return true;
    else return false;
    
}

function BoardLite_toString(b, turn) {
    //Serialize into Theseus Quoridor Board Notation (TQBN)
	var boardStr = '';
	for (var w = WALL_CENTERS; w < WALL_CENTERS+WALL_SPACES; w++) {
        var wallType = b[w];
        if (wallType == TYPE_NONE) boardStr += CHAR_NO_WALL;
        else if (wallType == TYPE_HORZ) boardStr += CHAR_H_WALL;
        else if (wallType == TYPE_VERT) boardStr += CHAR_V_WALL;
    }
	
	boardStr += (turn+1);

	for (var p = 0; p < 2; p++) {	
        //Pawn	
        var pawn = b[PAWN+p];
        boardStr += String.fromCharCode(65+(pawn%FLOOR_SIZE)) + (FLOOR_POS_TO_R[pawn]+1);        

		//Wallcount
		var wallCount = b[WALL_COUNT+p].toString();
		if (wallCount.length == 1) wallCount = '0' + wallCount;  //Zero pad
		boardStr += wallCount;
	}	
	
	return boardStr;        
}

function BoardLite_fromString(boardStr) {
    var b = BoardLite_new();

    //Get walls
    for (var p = 0; p < WALL_SPACES; p++) {
        var wallChar = boardStr[p];
                            
        if (wallChar == CHAR_H_WALL) b[WALL_CENTERS+p] = TYPE_HORZ;
        else if (wallChar == CHAR_V_WALL) b[WALL_CENTERS+p] = TYPE_VERT;
    }
    

    //Get pawn position, and wall counts
    var player = 0;
    for (var i = WALL_SPACES+1; i < boardStr.length; i+=4) {
        var pawnQmn = boardStr[i] + boardStr[i+1];
        
        var r = Number.parseInt(pawnQmn.charAt(1))-1;
        var c = pawnQmn.charCodeAt(0)-65;
        b[player] = (r*FLOOR_SIZE)+c; //this.pawns[player] = (r*FLOOR_SIZE)+c;

        var zeroPadWallCount = boardStr[i+2] + boardStr[i+3];
        b[WALL_COUNT+player] = Number.parseInt(zeroPadWallCount);//this.wallCounts[player] = Number.parseInt(zeroPadWallCount);
        player++;
    }    
    
    return b;
}

function BoardLite_fromBoard(board) {
    var tqbn = board.toString();
    return BoardLite_fromString(tqbn);
}

function BoardLite_toBoardMove(b, turn, typeDest) {
    var pawn = b[turn];
    if (typeof (typeDest) == 'undefined' || typeDest === null || typeDest < 0) throw new Error('Invalid move:', typeDest);
    var dest = typeDest & MASK_DEST;
    var type = typeDest & MASK_TYPE;

    //console.log('Dest:', dest, 'Type:', type);
    if (type & TYPE_MOVE_JUMP) return {sr:FLOOR_POS_TO_R[pawn], sc:pawn%FLOOR_SIZE, dr:FLOOR_POS_TO_R[dest], dc:dest%FLOOR_SIZE, type:FLOOR}; 
    else {
        var wallType = (type == TYPE_HORZ)? H_WALL : V_WALL;
        return {r:WALL_POS_TO_R[dest], c:dest%WALL_SIZE, type:wallType};
    }
}



function BoardLite_isAdjacent(pawn, oppPawn) {
    
    var pawnR = FLOOR_POS_TO_R[pawn];
    var pawnC = pawn%FLOOR_SIZE;

    var oppPawnR = FLOOR_POS_TO_R[oppPawn];
    var oppPawnC = oppPawn%FLOOR_SIZE;
    
    //There are a bunch of ways this could be handled, but just converting to R,C coordinates, and checking delta ended up being one of the easiest 
    if (Math.abs(pawnR - oppPawnR) + Math.abs(pawnC - oppPawnC) == 1) return true;
    else return false;
}



