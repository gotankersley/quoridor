//Menu				
var menuManager = new MenuManager();
var	menu = menuManager.properties;	

var game = new Game();		
game.players = [parseInt(menu.player1), parseInt(menu.player2)];

//Game event callbacks
game.addEventListener(EVENT_INVALID, onGameInvalid.bind(this));
game.addEventListener(EVENT_GAME_OVER, onGameOver.bind(this));
game.addEventListener(EVENT_PLAYED, onGamePlayed.bind(this));
game.addEventListener(EVENT_MESSAGE, function(msg){ console.log(msg); });

//Config options
menuManager.onChangePlayer(menu.player1, 'player1');
menuManager.onChangePlayer(menu.player2, 'player2');

var results = document.getElementById('results');
var running = false;

var arena = {
    gamesPlayed:0,
    winners:[],
    players:[],
    startTime:0,
    durations:[],
    moveCount:[],
}


function onGamePlayed() {
    arena.moveCount[arena.gamesPlayed]++;
    if (arena.moveCount[arena.gamesPlayed] > menu.moveCap) {
        console.log('move cap reached');
        onGameOver(PLAYER1, PLAYER2); //TODO
    }
    else if (running) {
        setTimeout(function() {
            game.play();
        }, 10);
    }    
}


function onGameInvalid(msg) {
    var message = msg + getInvalidMessage(code);
    alert(message);
}


function onGameOver(winner, loser) {
    if (winner == PLAYER1) arena.winners.push(game.players[PLAYER1]);
    else arena.winners.push(game.players[PLAYER2]);
    arena.moveCount.push(0);
    arena.gamesPlayed++;
    arena.durations.push(performance.now() - arena.startTime);    

    if (arena.gamesPlayed < menu.matches) { //Still running
        display();
        game.board = new Board(menu.initialTQBN);                
        if (menu.alternateStart) { //Swap
            var tmpPlayer = game.players[PLAYER1];
            game.players[PLAYER1] = game.players[PLAYER2];
            game.players[PLAYER2] = tmpPlayer;
        }
        arena.players.push([game.players[PLAYER1], game.players[PLAYER2]]);
        arena.startTime = performance.now();
        game.play();
    }
    else {
        running = false;
        display();
    }
}

function startMatches() {
    
    arena.gamesPlayed = 0;
    arena.players = [[game.players[PLAYER1], game.players[PLAYER2]]];
    arena.winners = [];
    arena.durations = [];
    arena.startTime = performance.now();
    arena.moveCount = [0];
    running = true;
    results.innerHTML = '<h3>Running: ' + arena.gamesPlayed + '/' + menu.matches + '</h3>';

    game.board = new Board(menu.initialTQBN);
    game.play();
    
}

function stopMatches() {
    running = false;
    display();
}


function display() { 
    var output = '';
    if (running) output += '<h3>Running: ' + arena.gamesPlayed + '/' + menu.matches + '</h3>';
    else output += '<h3>Done: ' + arena.gamesPlayed + '/' + menu.matches + '</h3>';

    output += '<table id="info-table" border="1">';
    output += '<tr>';
    output += '<th>Game</th>';		
    output += '<th>Player1</th>';
    output += '<th>Player2</th>';
    output += '<th>Winner</th>';
    output += '<th>Duration</th>';
    output += '<th>Moves Made</th>';
    
    output += '</tr>';
    
    var totalWins = {};
    var initialPlayer1 = game.players[PLAYER1];
    var initialPlayer2 = game.players[PLAYER2];
    totalWins[initialPlayer1] = 0;
    totalWins[initialPlayer2] = 0;

    for (var g = 0; g < arena.gamesPlayed; g++) {

        var duration = arena.durations[g];
        var players = arena.players[g];
        var player1 = players[PLAYER1];
        var player2 = players[PLAYER2];
        var name1 = game.getPlayerName(player1);
        var name2 = game.getPlayerName(player2);
        var winner = arena.winners[g];
        if (winner == player1) totalWins[player1]++;
        else totalWins[player2]++;        
        var moveCount = arena.moveCount[g];

        output += '<tr>';        
        output += '<td>' + g + '</td>';	//Game	
        output += '<td>' + name1 + '</td>'; //Player1
        output += '<td>' + name2 + '</td>'; //Player2
        output += '<td>' + game.getPlayerName(winner) + '</td>'; //Wins        
        output += '<td>' + duration + '</td>'; //Duration        
        output += '<td>' + moveCount + '</td>'; //Move count        
        
        
        output += '</td>';
        output += '</tr>';
    }
    output += '</table>';    
    var wins1 = totalWins[initialPlayer1];
    var wins2 = totalWins[initialPlayer2];
    
    if (!running) {
        output += '<h3>Overall winner: ';
        if (wins1 > wins2) output += game.getPlayerName(initialPlayer1) + ' ' + wins1 + '/' + arena.gamesPlayed;    
        else if (wins2 > wins1) output += game.getPlayerName(initialPlayer2) + ' ' + wins2 + '/' + arena.gamesPlayed;
        else output += 'tie ' + wins1 + '/' + arena.gamesPlayed;
        output += '</h3>';
    }

	results.innerHTML = output;
    sorttable.makeSortable(document.getElementById('info-table'));    
}
