var MENU_PREFIX = 'bt.';
//Struct MenuProperties
function MenuProperties() {	
	this.player1 = PLAYER_HUMAN;
	this.player2 = PLAYER_HUMAN;
	this.showGrid = this.getDefault('showGrid', false);
	this.showLabels = this.getDefault('showLabels', true);
	this.showCenters = this.getDefault('showCenters', false);
	this.showPositions = this.getDefault('showPositions', false);
	this.showCoordinates = this.getDefault('showCoordinates', true);
	this.animSpeed = 500;	
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
		Human:PLAYER_HUMAN, 	
		Theseus:PLAYER_THESEUS,	
		Network:PLAYER_NETWORK,				
		//Random:PLAYER_RANDOM,		
	};	
		
	this.properties = new MenuProperties();
	this.rootMenu = new dat.GUI();	
	
	//Options - secondary root	
	var optionsMenu = this.rootMenu.addFolder('Options');			
	
	//Display menu
	var displayMenu = optionsMenu.addFolder('Display');	
	displayMenu.add(this.properties, 'showGrid').onChange(this.persistChange);		
	displayMenu.add(this.properties, 'showLabels').onChange(this.persistChange);		
	displayMenu.add(this.properties, 'showCenters').onChange(this.persistChange);			
	displayMenu.add(this.properties, 'showPositions').onChange(this.persistChange);		
	displayMenu.add(this.properties, 'showCoordinates').onChange(this.persistChange);		
	displayMenu.add(this.properties, 'animSpeed', 0, 5000);	
	
	//Links menu
	//var linksMenu = optionsMenu.addFolder('Links');				
	
	//Root menu			
	this.rootMenu.add(this.properties, 'player1', PLAYER_OPTIONS).onChange(this.onChangePlayer);
	this.rootMenu.add(this.properties, 'player2', PLAYER_OPTIONS).onChange(this.onChangePlayer);	
	
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
MenuManager.prototype.onChangePlayer = function(val) {
	
	
	var selectedPlayer = parseInt(val);			
	
	//Show / Hide player config buttons
	var configButton = document.querySelectorAll('.config-button.' + this.property)[0];
	if (configButton) {
		if (selectedPlayer == PLAYER_NETWORK) configButton.style.visibility = 'visible';		
	}
	else configButton.style.visibility = 'hidden';

	game.players = [parseInt(menu.player1), parseInt(menu.player2)]; //Information hiding - pshaww...		
	game.play();
}


MenuManager.prototype.persistChange = function(val) {
	var propertyName = MENU_PREFIX + this.property;	
	localStorage.setItem(propertyName, val);	
}
