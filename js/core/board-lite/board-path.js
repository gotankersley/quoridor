//Ill-advised globals
var g_breadcrumbs = new Uint32Array(FLOOR_SPACES);

var g_stack = new Uint16Array(FLOOR_SPACES); //[pos]
var g_cachePrev = new Uint16Array(FLOOR_SPACES); //[prevIndex] - Used when populating g_cachePaths(s) to store chain of previous positions back to pawn


function BoardLite_Path_DFS_has(b, turn) { //Depth First Search - DFS
    
    var pawn = b[turn];    
    g_breadcrumbs = g_breadcrumbs.fill(0);    
    g_breadcrumbs[pawn] = 1;
    g_stack[0] = pawn;
    var stackTop = 1;
    
	while (stackTop > 0) {
        var topPos = g_stack[--stackTop];  //Pop the stack      

        var searchDests = SEARCH_DESTS_BY_PLAYER_POS[turn][topPos];                
        for (var d = 0; d < searchDests.length; d+=3) {
            
            var dir = searchDests[d]; //Dir 
            var destR = searchDests[d+1]; //DestR
            var dest = searchDests[d+2]; //Dest pos
            
            if (g_breadcrumbs[dest]) continue; //Already checked                        
            else if (BoardLite_isWallBetween(b, topPos, dir)) continue; //Wall between
            else if (destR == WIN_ROWS[turn]) return true; //End reached
                
            g_stack[stackTop++] = dest; //Push on to stack
            g_breadcrumbs[dest] = 1; //Visited
        }

    }

    return false;
}

function BoardLite_Path_DFS_populateCache(b, turn, cacheRef) { //Depth First Search - DFS    
    
    var pawn = b[turn];    
    
    g_breadcrumbs = g_breadcrumbs.fill(0);   
    g_breadcrumbs[pawn] = 1;
    g_stack[0] = pawn;
    var stackTop = 1;
    g_cachePrev[pawn] = FLOOR_SPACES; //End of the line    
    
	while (stackTop > 0) {
        var topPos = g_stack[--stackTop];  //Pop the stack      

        var searchDests = SEARCH_DESTS_BY_PLAYER_POS[turn][topPos];                
        for (var d = 0; d < searchDests.length; d+=3) {
            
            var dir = searchDests[d]; //Dir 
            var destR = searchDests[d+1]; //DestR
            var dest = searchDests[d+2]; //Dest pos
            
            
            if (g_breadcrumbs[dest]) continue; //Already checked                        
            else if (BoardLite_isWallBetween(b, topPos, dir)) continue; //Wall between
            else if (destR == WIN_ROWS[turn]) { //End reached                                                
                BoardLite_addWallsToCachePath(topPos, dest, cacheRef); 
                return true; 
            }
                
            g_stack[stackTop++] = dest; //Push on to stack
            g_breadcrumbs[dest] = 1;
            g_cachePrev[dest] = topPos; //Store chain back to pawn            
        }

    }
    return false;
}

/*
Note about G* Methods:
There are 4 different methods which, while similar, have slightly different purposes:
1. BoardLite_Path_Min_getDist - Simplest and fastest, only returns the numerical distance
-> Use for scoring

2. BoardLite_Path_Min_getDistAndOrigin - Returns [numerical distance, origin pos of path]
-> Used for early termination when neither player has walls 

3. BoardLite_Path_Min_populateCache - Populates an array of walls that intersect the min path, and appends the path length on the end
-> Used when getting available wall places to figure out if the minPath needs to be recalculated

4. BoardLite_Path_getScoreMeta - returns [minDist, overlap, circumlocation, origin] for scoring
-> Used for more accurate scoring
*/
function BoardLite_Path_Min_getDist(b, turn) { //G*  - Distance only
    
    var pawn = b[turn];        
    
    g_breadcrumbs = g_breadcrumbs.fill(FLOOR_SPACES); //Use for distance
    g_breadcrumbs[pawn] = 0; 
    var pawnTheoMin = THEORETICAL_MIN[turn][pawn];

    g_stack[0] = pawn;
    var stackTop = 1;

    var minPathLength = FLOOR_SPACES; //Current best
    
    
    //The following label is used to 'continue' from a nested loop    
    mainLoop:
	while (stackTop > 0) {
        var topPos = g_stack[--stackTop];  //Pop the stack      
        var dist = g_breadcrumbs[topPos]+1;
        
        if (dist+THEORETICAL_MIN[turn][topPos] >= minPathLength) continue; //Already have a better solution
        
        var searchDests = SEARCH_DESTS_BY_PLAYER_POS[turn][topPos];                
        for (var d = 0; d < searchDests.length; d+=3) {
            
            var dir = searchDests[d]; //Dir 
            var destR = searchDests[d+1]; //DestR
            var dest = searchDests[d+2]; //Dest pos
   
            if (dist >= g_breadcrumbs[dest]) continue; //Already checked - or not better
            else if (BoardLite_isWallBetween(b, topPos, dir)) continue; //Wall between
            else if (destR == WIN_ROWS[turn]) {  //End reached               

                //Straight line - Can't do better than this   
                if (dist == pawnTheoMin) return pawnTheoMin;
                    

                //Maybe not min - see if any other ones in the stack need to be considered
                else if (dist < minPathLength) {
                    minPathLength = dist;
                    do { //Pop down looking for better                                    
                        var potentialPos = g_stack[--stackTop]; 
                        var theoDist = g_breadcrumbs[potentialPos]+THEORETICAL_MIN[turn][potentialPos];                        
                        if (theoDist < minPathLength) {
                            stackTop++; //Add back to stack
                            continue mainLoop;                             
                        }
                    }
                    while (stackTop > 0);
                    
                    //Nothing better found, so this must be the min
                    return minPathLength;    
                }                
            }
                
            g_stack[stackTop++] = dest; //Push on to stack
            g_breadcrumbs[dest] = dist;            
        }

    }
    
    if (minPathLength == FLOOR_SPACES) throw new Error('BoardLite_Path_Min_getDist: no path available- ' + BoardLite_toString(b, turn)); 
    return minPathLength;    
}

function BoardLite_Path_Min_getDistAndOrigin(b, turn) { //G*  - [Distance, origin pos]
    
    var pawn = b[turn];        
    
    g_breadcrumbs = g_breadcrumbs.fill(FLOOR_SPACES); //Use for distance
    g_breadcrumbs[pawn] = 0; 
    var pawnTheoMin = THEORETICAL_MIN[turn][pawn];

    g_stack[0] = pawn;
    var stackTop = 1;

    var minPathLength = FLOOR_SPACES; //Current best
    var minOrigin = INVALID;
    
    //The following label is used to 'continue' from a nested loop    
    mainLoop:
	while (stackTop > 0) {
        var topPos = g_stack[--stackTop];  //Pop the stack      
        var dist = g_breadcrumbs[topPos]+1;
        
        if (dist+THEORETICAL_MIN[turn][topPos] >= minPathLength) continue; //Already have a better solution
        
        var searchDests = SEARCH_DESTS_BY_PLAYER_POS[turn][topPos];                
        for (var d = 0; d < searchDests.length; d+=3) {
            
            var dir = searchDests[d]; //Dir 
            var destR = searchDests[d+1]; //DestR
            var dest = searchDests[d+2]; //Dest pos
            
            if (dist >= g_breadcrumbs[dest]) continue; //Already checked - or not better
            else if (BoardLite_isWallBetween(b, topPos, dir)) continue; //Wall between
            else if (destR == WIN_ROWS[turn]) {  //End reached               
                var topOrigin = g_cachePrev[topPos];
                //Straight line - Can't do better than this   
                if (dist == pawnTheoMin) return [pawnTheoMin, topOrigin];
                    

                //Maybe not min - see if any other ones in the stack need to be considered
                else if (dist < minPathLength) {
                    minPathLength = dist;
                    minOrigin = topOrigin;
                    do { //Pop down looking for better                                    
                        var potentialPos = g_stack[--stackTop]; 
                        var theoDist = g_breadcrumbs[potentialPos]+THEORETICAL_MIN[turn][potentialPos];                        
                        if (theoDist < minPathLength) {
                            stackTop++; //Add back to stack
                            continue mainLoop;             
                        }                
                    }
                    while (stackTop > 0);
                    
                    //Nothing better found, so this must be the min
                    return [minPathLength, minOrigin];    
                }                
            }
                
            g_stack[stackTop++] = dest; //Push on to stack
            g_breadcrumbs[dest] = dist;     
            if (dist == 1) g_cachePrev[dest] = dest;
            else g_cachePrev[dest] = g_cachePrev[topPos];        
        }

    }
    
    if (minPathLength == FLOOR_SPACES) throw new Error('BoardLite_Path_Min_getDistAndOrigin: no path available- ' + BoardLite_toString(b, turn)); 
    return [minPathLength, minOrigin];
}

function BoardLite_Path_Min_populateCache(b, turn, cacheRef) { // Populate walls that intersect cachePath, and append distance
    
    var pawn = b[turn];        
    
    g_breadcrumbs = g_breadcrumbs.fill(FLOOR_SPACES); //Use for distance
    g_breadcrumbs[pawn] = 0; 
    var pawnTheoMin = THEORETICAL_MIN[turn][pawn];

    g_stack[0] = pawn;
    var stackTop = 1;
    g_cachePrev[pawn] = FLOOR_SPACES; //End of the line    
    var minPathLength = FLOOR_SPACES; //Current best
    var minTop = INVALID;
    var minDest = INVALID;
    
    //The following label is used to 'continue' from a nested loop    
    mainLoop:
	while (stackTop > 0) {
        var topPos = g_stack[--stackTop];  //Pop the stack      
        var dist = g_breadcrumbs[topPos]+1;
        
        if (dist+THEORETICAL_MIN[turn][topPos] >= minPathLength) continue; //Already have a better solution
        
        var searchDests = SEARCH_DESTS_BY_PLAYER_POS[turn][topPos];                
        for (var d = 0; d < searchDests.length; d+=3) {
            
            var dir = searchDests[d]; //Dir 
            var destR = searchDests[d+1]; //DestR
            var dest = searchDests[d+2]; //Dest pos

            if (dist >= g_breadcrumbs[dest]) continue; //Already checked - or not better
            else if (BoardLite_isWallBetween(b, topPos, dir)) continue; //Wall between
            else if (destR == WIN_ROWS[turn]) {  //End reached               

                //Straight line - Can't do better than this   
                if (dist == pawnTheoMin) {
                    BoardLite_addWallsToCachePath(topPos, dest, cacheRef); 
                    cacheRef[WALL_SPACES] = dist;
                    return;
                }
                    

                //Maybe not min - see if any other ones in the stack need to be considered
                else if (dist < minPathLength) {
                    minPathLength = dist;
                    minTop = topPos;
                    minDest = dest;
                    do { //Pop down looking for better                                    
                        var potentialPos = g_stack[--stackTop]; 
                        var theoDist = g_breadcrumbs[potentialPos]+THEORETICAL_MIN[turn][potentialPos];                        
                        if (theoDist < minPathLength) {
                            stackTop++; //Add back to stack
                            continue mainLoop;                             
                        }
                    }
                    while (stackTop > 0);
                    
                    //Nothing better found, so this must be the min
                    BoardLite_addWallsToCachePath(topPos, dest, cacheRef); 
                    cacheRef[WALL_SPACES] = minPathLength;
                    return;
                }                
            }
                
            g_stack[stackTop++] = dest; //Push on to stack
            g_breadcrumbs[dest] = dist; 
            g_cachePrev[dest] = topPos; //Store chain back to pawn                       
        }

    }
    
    if (minTop == INVALID || minDest == INVALID) throw new Error('BoardLite_Path_Min_populateCache: no path available- ' + BoardLite_toString(b, turn));
        
    BoardLite_addWallsToCachePath(minTop, minDest, cacheRef); 
    cacheRef[WALL_SPACES] = minPathLength;    
    return;
}

function BoardLite_Path_getScoreMeta(b, turn, overlapRef) { //returns [minDist, overlap, circumlocation, origin] for scoring

    var pawn = b[turn];        
    
    g_breadcrumbs = g_breadcrumbs.fill(FLOOR_SPACES); //Use for distance
    g_breadcrumbs[pawn] = 0; 
    var pawnTheoMin = THEORETICAL_MIN[turn][pawn];

    g_stack[0] = pawn;
    var stackTop = 1;

    var minPathLength = FLOOR_SPACES; //Current best
    var minPrev = INVALID;
    
    //The following label is used to 'continue' from a nested loop    
    mainLoop:
    while (stackTop > 0) {
        var topPos = g_stack[--stackTop];  //Pop the stack      
        var dist = g_breadcrumbs[topPos]+1;
        
        if (dist+THEORETICAL_MIN[turn][topPos] >= minPathLength) continue; //Already have a better solution
        
        var searchDests = SEARCH_DESTS_BY_PLAYER_POS[turn][topPos];                
        for (var d = 0; d < searchDests.length; d+=3) {
            
            var dir = searchDests[d]; //Dir 
            var destR = searchDests[d+1]; //DestR
            var dest = searchDests[d+2]; //Dest pos
            
            if (dist >= g_breadcrumbs[dest]) continue; //Already checked - or not better
            else if (BoardLite_isWallBetween(b, topPos, dir)) continue; //Wall between
            else if (destR == WIN_ROWS[turn]) {  //End reached               
                g_cachePrev[dest] = topPos;

                //Straight line - Can't do better than this   
                if (dist == pawnTheoMin) return BoardLite_Path_addMetadata(turn, dest, pawn, overlapRef, pawnTheoMin);                                

                //Maybe not min - see if any other ones in the stack need to be considered
                else if (dist < minPathLength) {                    
                    minPathLength = dist;
                    minPrev = dest;
                    
                    do { //Pop down looking for better                                    
                        var potentialPos = g_stack[--stackTop]; 
                        var theoDist = g_breadcrumbs[potentialPos]+THEORETICAL_MIN[turn][potentialPos];                        
                        if (theoDist < minPathLength) {
                            stackTop++; //Add back to stack
                            continue mainLoop;             
                        }                
                    }
                    while (stackTop > 0);
                    
                    //Nothing better found, so this must be the min                    
                    return BoardLite_Path_addMetadata(turn, minPrev, pawn, overlapRef, minPathLength);
                }                
            }
                
            g_stack[stackTop++] = dest; //Push on to stack
            g_breadcrumbs[dest] = dist;     
            g_cachePrev[dest] = topPos;
        }

    }
        
    
    return BoardLite_Path_addMetadata(turn, minPrev, pawn, overlapRef, minPathLength);
}


function BoardLite_Path_addMetadata(turn, start, end, overlapRef, minDist) { //Used by BoardLite_Path_getScoreMeta once path has been found
    
    var cur = start;
    var prev = g_cachePrev[start];
    var dir = POS_DELTA_TO_DIR[9+cur-prev]; 
    var overlap = 0;
    var circumlocation = 0;
    
    while (prev != end) {
        overlapRef[prev]++;
        if (overlapRef[prev] > 1) overlap++;
        circumlocation += CIRCUMLOCATION_BY_DIR[turn][dir];
        cur = prev;
        prev = g_cachePrev[prev];                        
        dir = POS_DELTA_TO_DIR[9+prev-cur];
    }
    //if (i >= 100) throw new Error('stuck');
    var origin = cur;
    return [minDist, overlap, circumlocation, origin];
}
function BoardLite_addWallsToCachePath(prev, cur, cacheRef) {
    //Requires g_cachePrev to be populated
    var prevDir = POS_DELTA_TO_DIR[9+prev-cur];
    do {                                    
                            
        //Set walls between
        var betweenIndex = (prev*8)+(prevDir*2);
        var wallType = WALLTYPE_BY_DIR[prevDir];
        var wallPos1 = WALLS_BETWEEN[betweenIndex];
        var wallPos2 = WALLS_BETWEEN[betweenIndex+1];
        cacheRef[wallPos1] |= wallType; //Allow for potential multiple walls at single center - otherwise it will overwrite when turning corners
        cacheRef[wallPos2] |= wallType;                    
                             
        cur = prev;
        prev = g_cachePrev[prev];
        prevDir = POS_DELTA_TO_DIR[9+prev-cur];        
    }
    while (prev < FLOOR_SPACES);     
}