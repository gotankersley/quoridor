const UNIT_SIZE_X = 50;
const UNIT_SIZE_Y = 60;

const NODE_SIZE_X = UNIT_SIZE_X-10;
const NODE_SIZE_Y = UNIT_SIZE_Y-20;

const HALF_NODE_X = NODE_SIZE_X/2;
const HALF_NODE_Y = NODE_SIZE_Y/2;

const UCT_TUNING = 0.9;//0.9; //Controls exploration (< 1) vs. exploitation (> 1)	
const MAX_GAMES = 100;
//Init fabric
var canvas;
initFabric();



function addNode(x, y, text1, text2, text3) {
    var rect = new fabric.Rect({ 
        top:-HALF_NODE_X,
        left:-HALF_NODE_X,           
        fill: 'red',
        width: NODE_SIZE_X,
        height: NODE_SIZE_Y,
    });

    var label1 = new fabric.Text(text1.toString(), {
        fontSize: 10,
        originX: 'center',
        originY: 'bottom'
    });
    var label2 = new fabric.Text(text2.toString(), {
        fontSize: 10,
        originX: 'center',
        originY: 'bottom',
        top: 10
    });

    var label3 = new fabric.Text(text3.toString(), {
        fontSize: 10,
        originX: 'center',
        originY: 'bottom',
        top: 20
    });

    var group = new fabric.Group([ rect, label1, label2, label3 ], {
        left: x,
        top: y
    });

    canvas.add(group);
}

//Get move
var board = new Board();
MCTSPlayer.getPlay(board, function(move) {

    //Draw tree - BFS
    addNode(0, 0, '', 'root', '');
    var queue = [root];

    
    while (queue.length) {    
       
        var parent = queue.shift();
        var parentY = (parent.depth*UNIT_SIZE_Y)+NODE_SIZE_Y;
        var parentX = ((rowIds[parent.depth]*UNIT_SIZE_X)/2) -(parent.rowId*UNIT_SIZE_X);

        var y = (parent.depth+1)*UNIT_SIZE_Y;
        for (var i = 0; i < parent.children.length; i++) {
            var child = parent.children[i];

            var x = ((rowIds[child.depth]*UNIT_SIZE_X)/2) - (child.rowId*UNIT_SIZE_X); //Center nodes
            var visits = 'visits: ' + child.visits;
            var score = 'score:' + Math.floor(child.score);
            var id = '';//'id:' + child.rowId;
            
            addNode(x, y, visits, score, id);

            var line = new fabric.Line([x+HALF_NODE_X, y, parentX+HALF_NODE_Y, parentY], {                
                stroke: 'black'
            });
            canvas.add(line);
            queue.push(child);
        }
        
    }
});



      