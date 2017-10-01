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

	if( width == 26 && height == 29){

		for( var i = 0; i < 26; i++){

			map[i] = new Array();

			for( var j = 0; j < 29; j++){

				map[i][j] = (PACMAP.DEFAULTMAPSTRING.charAt( (26*j) + i ) == '1');

			}

		}

	}else{
		for( var i = 0; i < width; i++ ){

			map[i] = new Array();

			for( var j = 0; j < height; j++ )
				map[i][j] = false;

		}

		for( var i = 0; i < height*width*0.4; i++ ){

			var j = Math.floor( Math.random() * width );
			var k = Math.floor( Math.random() * height );

			map[j][k] = true;

		}
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

PACMAP.DEFAULTMAPSTRING = 
"00000000000011000000000000" +
"01111011111011011111011110" +
"01111011111011011111011110" +
"01111011111011011111011110" +
"00000000000000000000000000" +
"01111011011111111011011110" +
"01111011011111111011011110" +
"00000011000011000011000000" +
"01111011111011011111011110" +
"01111011111011011111011110" +
"01111011000000000011011110" +
"01111011011100111011011110" +
"01111011011000011011011110" +
"01111000011000011000011110" +
"01111011011000011011011110" +
"01111011011111111011011110" +
"01111011000000000011011110" +
"01111011011111111011011110" +
"01111011011111111011011110" +
"00000000000011000000000000" +
"01111011111011011111011110" +
"01111011111011011111011110" +
"00011000000000000000011000" +
"11011011011111111011011011" +
"11011011011111111011011011" +
"00000011000011000011000000" +
"01111111111011011111111110" +
"01111111111011011111111110" +
"00000000000000000000000000";