var MENU_PREFIX = 'qo.';
//Struct MenuProperties
function MenuProperties() {	
	this.player1 = PLAYER_RANDOM;
	this.player2 = PLAYER_RANDOM;

	//Display
	this.showMoveCount = this.getDefault('showMoveCount', true);
	this.showWinDelta = this.getDefault('showWinDelta', true);
	this.showDuration = this.getDefault('showDuration', true);
	this.showAvgMoveTime = this.getDefault('showAvgMoveTime', true);

	//Options
	this.initialTQBN = this.getDefault('initialTQBN', '');
	this.moveLimit = this.getDefault('moveLimit', 200);
	this.earlyTermination = this.getDefault('earlyTermination', false);
	//this.randInitialMoves = this.getDefault('randInitialMoves', 0);

	
	//Settings
    this.matches = parseInt(this.getDefault('matches', 10));
	this.alternateStart = this.getDefault('alternateStart', true);
    
    this.start = function() { arena.start(); }
    this.stop = function() { arena.stop(); }
}

MenuProperties.prototype.getDefault = function(propertyName, defaultValue) {
	propertyName = MENU_PREFIX + propertyName;
	if (localStorage.getItem(propertyName) !== null) {
		var val = localStorage.getItem(propertyName);
		if (val == 'true') return true;
		else if (val == 'false') return false;
		else return val;
	}
	else return defaultValue;
}
//End struct MenuProperties

//Class MenuManager
function MenuManager() {
	var PLAYER_OPTIONS = {
		//Human:PLAYER_HUMAN, 	
		Random:PLAYER_RANDOM,		
		Weak:PLAYER_HEURISTIC,		
		Theseus:PLAYER_THESEUS,	
		Minotaur:PLAYER_ALPHABETA,	
		Network:PLAYER_NETWORK,				
		//wasm:PLAYER_WASM,	
		//MonteCarlo:PLAYER_MONTECARLO,
		//MCTS:PLAYER_MCTS,
	};	
		
	this.properties = new MenuProperties();
	this.rootMenu = new dat.GUI();	
	
	//Display - secondary root	
	var displayMenu = this.rootMenu.addFolder('Display');			
	displayMenu.add(this.properties, 'showWinDelta').onChange(this.persistChangeAndUpdate);												
	displayMenu.add(this.properties, 'showMoveCount').onChange(this.persistChangeAndUpdate);												
	displayMenu.add(this.properties, 'showDuration').onChange(this.persistChangeAndUpdate);		
	displayMenu.add(this.properties, 'showAvgMoveTime').onChange(this.persistChangeAndUpdate);												

	
	//Options - secondary root	
	var optionsMenu = this.rootMenu.addFolder('Options');			
    optionsMenu.add(this.properties, 'initialTQBN').onChange(this.persistChange);						
    optionsMenu.add(this.properties, 'moveLimit').onChange(this.persistChange);						
    optionsMenu.add(this.properties, 'earlyTermination').onChange(this.persistChange);						
    //optionsMenu.add(this.properties, 'randInitialMoves').onChange(this.persistChange);						
	
	//Root menu			
	this.rootMenu.add(this.properties, 'player1', PLAYER_OPTIONS).onChange(this.onChangePlayer);
    this.rootMenu.add(this.properties, 'player2', PLAYER_OPTIONS).onChange(this.onChangePlayer);	
    
	this.rootMenu.add(this.properties, 'matches').onChange(this.persistChange);
	this.rootMenu.add(this.properties, 'alternateStart').onChange(this.persistChange);			
    this.rootMenu.add(this.properties, 'start');
    this.rootMenu.add(this.properties, 'stop');
	
	//Configure button hack
	var propertyNodes = document.querySelectorAll('.dg.main .property-name');			
	for (var n = 0; n < propertyNodes.length; n++) {
		var title = propertyNodes[n].innerHTML;			
		if (title == 'player1' || title == 'player2') {
			var node = propertyNodes[n];
			
			var btnNode = document.createElement('img');		
			btnNode.className += 'config-button ' + title;	
			btnNode.setAttribute('data-name', title);
			node.nextSibling.appendChild(btnNode);
			btnNode.onclick = function(e) {
				if (!e) var e = window.event;
				var player = (this.dataset["name"] == "player1")? PLAYER1 : PLAYER2;
				game.onPlayerConfig(player);
				
			}
		}		
	}	
	
}


//Events
MenuManager.prototype.onChangePlayer = function(val, player) {
	
	
	var selectedPlayer = parseInt(val);			
	
	//Show / Hide player config buttons
	if (typeof(player) == 'undefined') player = this.property;
	var configButton = document.querySelectorAll('.config-button.' + player)[0];
	if (configButton) {		
		if (selectedPlayer == PLAYER_RANDOM) configButton.style.visibility = 'visible';		
		else if (selectedPlayer == PLAYER_THESEUS) configButton.style.visibility = 'visible';		
		else if (selectedPlayer == PLAYER_NETWORK) configButton.style.visibility = 'visible';	
		else configButton.style.visibility = 'hidden';
	}
	else configButton.style.visibility = 'hidden';

	game.players = [parseInt(menu.player1), parseInt(menu.player2)]; //Information hiding - pshaww...			
}


MenuManager.prototype.persistChange = function(val) {
	var propertyName = MENU_PREFIX + this.property;	
	localStorage.setItem(propertyName, val);		
}

MenuManager.prototype.persistChangeAndUpdate = function(val) {
	var propertyName = MENU_PREFIX + this.property;	
	localStorage.setItem(propertyName, val);	
	arena.display();	
}

