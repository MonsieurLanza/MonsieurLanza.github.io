// ======================
// = Calcul de vecteurs =
// ======================

var K = 250;
function Vector( deltaX, deltaY ) {
	this.x = deltaX;
	this.y = deltaY;
} 

Vector.prototype = {
	x: 0,
	y: 0,
	opposite: function() {
		return new Vector( -this.x, -this.y );
	},
 	add: function( v ) {
 		return new Vector( this.x + v.x, this.y + v.y );
 	},
 	substract: function( v ) {
 		var neg = v.opposite();
 		return this.add( neg );
 	},
 	multiply: function( a ) {
 		return new Vector( this.x * a, this.y * a );
 	},
 	norm: function() {
 		return Math.sqrt( (this.x * this.x) + (this.y * this.y) );
 	},
 	normalize: function() {
 		var n = this.norm();
 		if( n > 0 )
 			return new Vector( this.x / n, this.y / n );
 		else
 			return new Vector( 0,0 );
 	}
};


// =======================
// = Point               =
// =======================

function Point( x, y ) {
	this.x = x;
	this.y = y;
}

Point.prototype = {
	vectorTo: function( point ) {
		return new Vector( point.x - this.x, point.y - this.y );
	} 
}

// =======================
// = GraphNode           =
// =======================

function Node( x, y, spring ) {
	Point.call( this, x, y );
	this.spring = spring;
	this.direction = new Vector(0,0);
	this.speed = new Vector( 0, 0 );
}

Node.prototype = new Point;

// Fonction de répulsion.
Node.prototype.repulse = function( node, coef ) {
	coef = coef || 1;
	var distance = node.vectorTo(this);
	var dist = distance.norm();
	dist = dist > K ? 0 : dist;
	if( dist > 0 ) {
		var strength =  -dist * (( Math.cos( dist / K * Math.PI ) + 1) );
			
		node.direction = node.direction.add( 
			distance.normalize().multiply( strength *coef )
		);
	}
	return node.direction;
}

Node.prototype.attract = function() {
	var distance = this.spring;
	var dist = distance.norm();
	this.direction = this.direction.substract( 
		distance.normalize().multiply( (dist*dist) / K )
	);
	 
	 return this.direction;
}

// =======================================
// = Node Set. Nodes couramment affichés =
// =======================================


function NodeSet() {
	this.index = 0;
}

NodeSet.prototype = new Array;
NodeSet.prototype.ratataPlop = function(me) {
	if( me == undefined ) me = this; // setTimeOut assigne l'objet "window" à "this", donc on sauve "this" ailleurs.

	if( me.index == me.length )
		me.attractionRepulsion();
	else
		me[me.index].plop();

	if( me.index < me.length ) {
		me.index += 1;
		setTimeout( function(){ me.ratataPlop(me) }, 100 ); // delayed recursivity. Love that.
	}
}

NodeSet.prototype.attractionRepulsion = function( me ) {
	if( me == undefined ) me = this; // setTimeOut assigne l'objet "window" à "this", donc on sauve "this" ailleurs.

	if( this.temperature == undefined )
		this.temperature = 5;

	var nodes = new Array(me.length);
	var origins = new Array(me.length);
	
	for( var i = 0; i< me.length; i++) {
		nodes[i] = nodes[i] || me[i].getNode();
		for( var j = 0; j < me.length; j++ ) {
			if( i != j ) {
				// histoire de ne pas masquer les points.
				origins[j] = origins[j] || me[j].getNodeOrigin(); 
				origins[j].repulse(nodes[i], 0.2);
				
				nodes[j] = nodes[j] || me[j].getNode();
				nodes[j].repulse(nodes[i]);				
				// les positions géo des spots repoussent les bulles qui ne leur appartiennent pas.

			}
		}
		nodes[i].attract();
	}
	
	for( var i = me.length-1; i >=0; i-=2 ) {
		//
	}
	
	for( var i = 0; i < me.length; i ++ )
			me[i].applyForce( nodes[i].direction.multiply( 0.25 ) );
	
	if( this.temperature > 0 ) {
		this.temperature -= 0.035; 
		
	} else {
		this.temperature = 0;
	}
		
	setTimeout( function(){ me.attractionRepulsion(me) }, 40 );
}



