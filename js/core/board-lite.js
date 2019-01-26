//Weights
const WEIGHT_WALLCOUNT = 1;
const WEIGHT_PATH = 1;

const OPP_TURN = [1,0];

const PATH_LENGTH = 0;
const PAWN = 0;
const PAWN1 = 0; //Same as PLAYER1
const PAWN2 = 1; //Same as PLAYER2
const WALL_COUNT = 3;
const WALL_COUNT1 = 3;
const WALL_COUNT2 = 4;
const WALLS = 6;
const MIN_PATH = WALLS+WALL_SPACES; //70
const MIN_PATH1 = MIN_PATH;
const MIN_PATH2 = MIN_PATH+1;
const STRUCT_SIZE = 136;

//global
var breadcrumbs = new Uint32Array(FLOOR_SPACES); //Keep from needing to re-allocate when pathfinding (penny-wise, pound-folish)
var maxBreadcrumb = 0;

//Now with 75% less (syntactic) sugar...
function BoardLite_new() { //2 players only
    //this.turn = PLAYER1;
    //this.pawns = new Uint8Array(2);
    //this.wallCounts = new Uint8Array(2);
    //this.walls = new Uint8Array(WALL_SIZE);
    //this.minPath = new Uint8Array(WALL_SIZE); //Hard to prove, but it can't exceed this, right?       
    return new Uint8Array(STRUCT_SIZE);
}    
    

function BoardLite_makeMove(b, turn, dst) { 
    //No validation provided        
    b[turn] = dst;  //this.pawns[turn] = dst; 
    //Simple update path(s)?     
}

//Make one for jumps also... 


function BoardLite_makePlace(b, turn, src, wallType) {
    //No validation provided    
    b[WALL_COUNT+turn]--; //this.wallCounts[this.turn]--;	
    b[WALLS+src] = wallType; //this.walls[src] = wallType; 
    //Update paths?   
}

function BoardLite_getMoves() {
    //Pawn moves
    //Jumps
    //Places 
    //TODO: getMovesNoVerify();
    return [];
}

function BoardLite_scoreSide(b, turn) {
    return (
        (b[WALL_COUNTS+turn] * WEIGHT_WALLCOUNT) +
        (b[MIN_PATH] * WEIGHT_PATH)
    );
}

function BoardLite_isGameOver(b, turn) {        
    //Reached the opposite end row
    if (turn == 0){
        if (b[turn] < 9) return true;
    }
    else if (b[turn] > 71) return true;
    return false;        
}


function BoardLite_getMinPaths(b) { 
    BoardLite_getMinPath(b, PLAYER1);
    if (true)BoardLite_getMinPath(b, PLAYER2);
}

function BoardLite_getMinPath(b, turn) { //G*
    //This has two important side effects:
    //1. Populating b[MIN_PATH]
    //2. Creating a cachePath of the wall centers that the paths goes through
    var pawn = b[turn];
    var queuePos = [pawn];
    var queuePath = [''];

    maxBreadcrumb++; //Cheap clear breadcrumbs
    b.fill(0,MIN_PATH2+1); //clear cachePath

    var iterations = 0;
	while (queuePos.length) {
        var first = queue.shift();


        if (iterations++ >= MAX_SEARCH_ITERATIONS) {			
			throw new Error('getMinPath: Stuck in infinite loop');			
		}
    }


}

function BoardLite_toString(b, turn) {
    //Serialize into Theseus Quoridor Board Notation (TQBN)
	var boardStr = '';
	for (var w = WALLS; w < WALLS+WALL_SIZE; w++) {
        var wallType = b[w];
        if (wallType == NO_WALL) boardStr += CHAR_NO_WALL;
        else if (wallType == H_WALL) boardStr += CHAR_H_WALL;
        else if (wallType == V_WALL) boardStr += CHAR_V_WALL;
    }
	
	boardStr += (turn+1);

	for (var p = 0; p < 2; p++) {	
        //Pawn	
        var pawn = b[PAWN+p];
        boardStr += String.fromCharCode(65+(pawn%FLOOR_SIZE)) + (Math.floor(pawn/FLOOR_SIZE)+1);        

		//Wallcount
		var wallCount = b[WALL_COUNTS+p].toString();
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
                            
        if (wallChar == CHAR_H_WALL) b[WALLS+p] = H_WALL;
        else if (wallChar == CHAR_V_WALL) b[WALLS+p] = V_WALL;
    }

    this.turn = Number.parseInt(boardStr[WALL_SPACES])-1;

    //Get pawn position, and wall counts
    var player = 0;
    for (var i = WALL_SPACES+1; i < boardStr.length; i+=4) {
        var pawnQmn = boardStr[i] + boardStr[i+1];
        
        var r = Number.parseInt(pawnQmn.charAt(1))-1;
        var c = pawnQmn.charCodeAt(0)-65;
        b[player] = (r*FLOOR_SIZE)+c; //this.pawns[player] = (r*FLOOR_SIZE)+c;

        var zeroPadWallCount = boardStr[i+2] + boardStr[i+3];
        this.wallCounts[player] = Number.parseInt(zeroPadWallCount);
        player++;
    }    

    //Update min path
    BoardLite_getMinPaths(b);

    return b;
}