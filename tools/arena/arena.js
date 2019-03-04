//Start
function run() {
	document.open(); //clear	
	document.write('<label>Population: ');
	document.write('<input onchange="onChangePopulation(this.value)" type="text" value="' + POPULATION + '" id="population" />');
	document.write('</label>');
	document.write('<br/>');

	document.write('<label>Generations: ');
	document.write('<input onchange="onChangeGeneration(this.value)" type="text" value="' + GENERATIONS + '" id="generations" />');
	document.write('</label>');	
	document.write('<br/>');
	
	
	var pool = new Pool();
	for (var g = 0; g < GENERATIONS; g++) {		
		pool.evolveStep();	
		break;			
	}
	displayPool();
	sorttable.makeSortable(document.getElementById('info-table'));
	
}


function displayPool() {
	document.write('<h3>Cost: ' + this.cost + '</h3>');
	document.write('<table id="info-table" border="1">');
	document.write('<tr>');
	document.write('<th>TID</th>');		
	document.write('<th>Total</th>');
	document.write('<th>Wins</th>');
	document.write('<th>Losses</th>');
	document.write('<th>Rank</th>');
	document.write('<th>Real</th>');
	document.write('</tr>');
	
	for (var p = 0; p < POPULATION; p++) {
		var team = this.pool[p];
		var rank = (team.wins/team.total)*100;//percent
		
		document.write('<tr>');
		
		document.write('<td>' + p + '</td>');	//TID	
		document.write('<td>' + team.total + '</td>'); //Total
		document.write('<td>' + team.wins + '</td>'); //Wins
		document.write('<td>' + team.losses + '</td>'); //Losses
		document.write('<td>' + rank + '</td>'); //Rank
		document.write('<td>' + team.realVal + '</td>'); //Real
		
		
		document.write('</td>');
		document.write('</tr>');
	}
	document.write('</table>');
}

run();