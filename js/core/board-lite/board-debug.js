//*DEBUG METHODS*
var topBoard;
//function BoardLite_drawCache(b, cacheRef) {}
function BLP(b, cacheRef) {
    topBoard = game.board.copy();
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            topBoard.walls[r][c] = TYPE_NONE;
        }
    }
    for (var w = 0; w < WALL_SPACES; w++) {
        var r = WALL_POS_TO_R[w];
        var c = w%WALL_SIZE;

        var boardType;
        var wallType = cacheRef[w];
        if (wallType & TYPE_HORZ) boardType = H_WALL;
        else if (wallType & TYPE_VERT) boardType = V_WALL;
        else continue;
        topBoard.walls[r][c] = boardType;
    }
        
    throw new Error('disp');    
}

function convertBoardMoves(board, type) {
    var boardMoves = board.getMoves();
    
    var moves = {};
    var filter = typeof(type) == 'undefined'? false : true;		
        
    for (var m = 0; m < boardMoves.length; m++) {
        var move = boardMoves[m];
        if (filter) {
            if (type & TYPE_MOVE_JUMP && move.type == FLOOR) moves[getPos(move.dr, move.dc)] = TYPE_MOVE;
            else if (type & TYPE_WALL) {
                if (move.type == H_WALL) moves[getWallPos(move.r, move.c)] = TYPE_HORZ;
                else moves[getWallPos(move.r, move.c)] = TYPE_VERT;
                
            }
        }
        else {
            if (move.type == FLOOR) moves[getPos(move.dr, move.dc)] = TYPE_MOVE;
            else if (move.type != NO_WALL) {
                if (move.type == H_WALL) moves[getWallPos(move.r, move.c)] = TYPE_HORZ;
                else moves[getWallPos(move.r, move.c)] = TYPE_VERT;		
                
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

function areEqual(array1, array2) {
    var keys1 = Object.keys(array1);
    var keys2 = Object.keys(array2);

    var isSame = true;	
    for (var k = 0; k < keys1.length; k++) {
        var key = keys1[k];
        if (!array2[key]) {
            isSame = false;
            console.log('boardMoves missing:', key, array1[key]);
        }
    }

    for (var k = 0; k < keys2.length; k++) {
        var key = keys2[k];
        if (!array1[key]) {
            console.log('blMoves missing:', key, array2[key]);        
            isSame = false;
        }
    }


    return isSame;
}

function BoardLite_getMoves(b, turn, filterType) {
    var plays = new Uint16Array(MAX_PLAYS+1); //+1 for count on endFLOOR
    var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
    var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]	
    BoardLite_getPlays(b, turn, plays, cachePath1, cachePath2);

    var filter = typeof(filterType) == 'undefined'? false : true;
    var moves = [];
    for (var m = 0; m < plays[MAX_PLAYS]; m++){
        var typeDest = plays[m];        
        var type = typeDest & MASK_TYPE;
        if (filter) {
            if (type & filterType) moves.push(typeDest);
        }
        else moves.push(typeDest);
    }
    
    return moves;
}

function BoardLite_playsToArray(playsRef, filterType) {

    var filter = typeof(filterType) == 'undefined'? false : true;
    var moves = {};
    for (var m = 0; m < playsRef[MAX_PLAYS]; m++){
        var typeDest = playsRef[m];        
        var type = typeDest & MASK_TYPE;
        var dest = typeDest & MASK_DEST;
        if (filter) {
            if (type & filterType) moves[dest] = type;
        }
        else moves[dest] = type;
    }
    
    return moves;
}

/*
function BoardLite_filterPlays(playsRef, filter) {
   
    var total = 0;
    for (var m = 0; m < playsRef[MAX_PLAYS]; m++){
        var typeDest = playsRef[m];        
        var type = typeDest & MASK_TYPE;
        if (type & filter) {
            playsRef[total] = playsRef[m];
            total++;
        }
        
    }
    playsRef[MAX_PLAYS] = total;
}
*/