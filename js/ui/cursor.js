function Cursor() {

    this.floor = {r:0, c:0, x:0, y:0};
    this.wall = {r:0, c:0, x:0, y:0};
    this.selected = {r:0, c:0, x:0, y:0};
    this.selectOn = false;
    this.type = NO_WALL;    
}

Cursor.prototype.update = function(x, y) {	

    this.floor.x = x;
    this.floor.y = y;
    
    this.floor.r = Math.floor(y/GRID_SIZE);
    this.floor.c = Math.floor(x/GRID_SIZE);		
    
    
    var wallR = Math.floor((y+HALF_GRID)/GRID_SIZE);
    var wallC = Math.floor((x+HALF_GRID)/GRID_SIZE);

    wallR = Math.max(1, Math.min(wallR, WALL_SIZE));
    wallC = Math.max(1, Math.min(wallC, WALL_SIZE));		

    this.wall.x = (wallC * GRID_SIZE)-WIDTH_FLOOR_OFFSET;
    this.wall.y = (wallR * GRID_SIZE)-WIDTH_FLOOR_OFFSET;

    this.wall.r = wallR-1;
    this.wall.c = wallC-1;
                
    //Inside floor square
    var localX = x % GRID_SIZE;
    var localY = y % GRID_SIZE;

    if (localX < WIDTH_FLOOR_OFFSET) { //Left			
        if (localY > WIDTH_FLOOR_OFFSET && localY < WIDTH_FLOOR_OFFSET+WIDTH_FLOOR) this.type= V_WALL; //Left-Middle			
        else if (this.type == FLOOR){  //Keep from getting stuck in the corner
            if (localY < WIDTH_FLOOR_OFFSET) this.type= this.getCornerWallType(localX, localY); //Left-Top
            else this.type= this.getCornerWallType(localX, localY%WIDTH_FLOOR_OFFSET); //Left-Bottom
        }
    }
    else if (localX < WIDTH_FLOOR_OFFSET+WIDTH_FLOOR) { //Middle
        if (localY < WIDTH_FLOOR_OFFSET) this.type= H_WALL; //Middle-Top
        else if (localY < WIDTH_FLOOR_OFFSET+WIDTH_FLOOR) { //Middle-Middle            
            this.type= FLOOR; //Non-pawn floor square
        }
        else this.type= this.type= H_WALL; //Middle-Bottom
    }
    else { //Right			
        if (localY > WIDTH_FLOOR_OFFSET && localY < WIDTH_FLOOR_OFFSET+WIDTH_FLOOR) this.type= V_WALL; //Right-Middle			
        else if (this.type== FLOOR) { //Keep from getting stuck in the corner
            if (localY < WIDTH_FLOOR_OFFSET) this.type= this.getCornerWallType(localX%WIDTH_FLOOR_OFFSET, localY); //Right-Top
            else this.type= this.getCornerWallType(localX%WIDTH_FLOOR_OFFSET, localY%WIDTH_FLOOR_OFFSET); //Right-Bottom
            
        }
    }
}

Cursor.prototype.getCornerWallType = function(x, y) {
    if (x < y) { //Bottom left			
        if (x > WIDTH_FLOOR_OFFSET-y) return V_WALL; //South
        else return H_WALL; //West
        
    }
    else { // Top Right
        if (x > WIDTH_FLOOR_OFFSET-y) return H_WALL; //East
        else return V_WALL; //North
    }
}

Cursor.prototype.selectCurrent = function() {
    this.selectOn = true;
    this.selected.r = this.floor.r;
    this.selected.c = this.floor.c;
    this.selected.x = this.floor.c*GRID_SIZE;
    this.selected.y = this.floor.r*GRID_SIZE;
}