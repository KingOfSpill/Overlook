var PACMAP = { REVISION: '1' };

/*PACMAP.piece = function( width, height, map ){

	this.map = new Array();

	for( var i = 0; i < height; i++ )
		for( var j = 0; j < width; j++ )
			this.map[i][j] = map[ (height*i) + j];


	this.percentFull = function(){

		var sum = 0;

		for( var i = 0; i < map.length; i++ )
			for( var j = 0; j < map[i].length; j++)
				sum += map[i][j] ? 1 : 0;

		return sum/(width*height);

	}

}*/

PACMAP.generateMap = function( width, height ){

	var map = new Array();
	for( var i = 0; i < height; i++ ){

		map[i] = new Array();

		for( var j = 0; j < width; j++ )
			map[i][j] = false;

	}

	for( var i = 0; i < height*width*0.4; i++ ){

		var j = Math.floor( Math.random() * height );
		var k = Math.floor( Math.random() * width );

		map[j][k] = true;

	}

	return map;

}

PACMAP.toHTML = function( map ){

	var html = "";

	for( var i = 0; i < map.length; i++ ){

		html = html + (i > 0 ? "<br/>" : "");

		for( var j = 0; j < map[i].length; j++)
			html = html + (j > 0 ? " " : "") + map[i][j];

	}

	return html;

}