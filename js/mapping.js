Microsoft.Maps.Map.prototype.panTo = function( b )
{
	if( this.anchoredCenter == undefined )
		this.anchoredCenter = this.getCenter();
	
	if( this.oldLocation == undefined )
		this.oldLocation = this.anchoredCenter;
	
	if( b instanceof Microsoft.Maps.Location ) {
		map.setView({ 
			bounds: Microsoft.Maps.LocationRect.fromLocations(
						[
							b,
							this.oldLocation,
							this.anchoredCenter
						]),
			animate: true
		});
		
		this.oldLocation = b;
		
	}
}

Microsoft.Maps.Map.prototype.zoomTo = function( b, double )
{
		
	if( b instanceof Microsoft.Maps.Location ) {
		map.setView({ 
			center: b,
			zoom: double ? 15 : 12,
			animate: true
		});
		this.oldLocation = b;
	}
}


// =========
// = Image =
// =========

function Image( url ) {
	this.url = url;
}

Image.prototype.href = function( p ) {
	
	var qs = [];
	var querystring = "";
	
	if( p ) {
	 	if( p.width ) 
			qs.push( "w=" + p.width );
		
		if( p.height )
			qs.push("h=" + p.height );
			
		if( p.color ) 
			qs.push("color=" + p.color );
			
		if( p.crop )
			qs.push("crop=true");
			
		if( qs.length > 0 )
			querystring = "?" + qs.join("&");
	}
	return this.url + querystring; 
}

function Spot( SpotOptions ) {
	Microsoft.Maps.Location.call( this, SpotOptions.latitude, SpotOptions.longitude );
	this.ID = SpotOptions.ID;
	this.title = SpotOptions.title;
	this.photo = new Image( SpotOptions.photoUrl );
	var zindex = Math.round((1-(this.latitude-47)) * 1000);
	this.pin = new Microsoft.Maps.Pushpin(this, {text:"1", visible:true, zIndex: zindex });
	this.bubble = new PowerBubble( this );

	if( SpotOptions.map ) {
		this.Map = SpotOptions.map;
	}
}


Spot.prototype = new Microsoft.Maps.Location;

Spot.prototype.get_x = function() {
	var x = NaN;
	
	if( this.Map.getBounds().contains( this ) )
		x =  Math.round( this.Map.tryLocationToPixel(this, Microsoft.Maps.PixelReference.control).x ); 
	
	return x;	
}

Spot.prototype.get_y = function() {
	var y = NaN;
	
	if( this.Map.getBounds().contains( this ) )
		y =  Math.round( this.Map.tryLocationToPixel(this, Microsoft.Maps.PixelReference.control).y ); 
	
	return y;
		
}

Spot.prototype.findOnMap = function(map) {


	if( map )
		this.Map = map;

	if( !this.Map.getBounds().contains(this) ) {
		
		this.Map.panTo(this);
	}
	

}

Spot.prototype.focusOnMap = function(map, double ) {
	/* map.entities.clear(); 
	map.entities.push(this.pin);*/
	
	if( map )
		this.Map = map;

	
	this.Map.zoomTo(this, double);	
}

Spot.prototype.attachToMap = function( map ) {
	this.Map = map;
}

Spot.prototype.listView = function() {
	var root = document.createElement("figure");
	root.className= "item";
	
	var img = document.createElement("img");
	img.src = this.photo.href({ height: 87 });
	img.alt = this.title;
	
	var link = document.createElement("a");
	link.href = this.photo.href({ height: 87 });
	
	link.appendChild( img );
	root.appendChild( link );
	
	var me = this;
	$(root).mouseenter(function(){
		me.findOnMap(me.Map);
		me.bubble.highlight();
	});
	
 	$(root).mouseleave(function(){
		me.bubble.normal();
	});
	
	
	$(root).click(function(e){
		me.focusOnMap(me.Map);
		e.preventDefault();
	});

	$(root).dblclick(function( e ){
		me.focusOnMap(me.Map, true);
		e.preventDefault();
	});

	return root;
}

// =================================================
// = PowerBubbles : Des infoBox en SVG/VML animées =
// =================================================

// Needs raphael-min.js, jQuery & Microsoft Maps.

function PowerBubble( Spot ) {
	this.Spot = Spot;
	this.id = "bubble_" + Spot.ID;
	this.gravCenter = this.pt(
		0,
		0
	);
	this.origin = this.pt( 0,0 );
	
	Microsoft.Maps.Infobox.call( this, this.Spot, {
			width: this.canvas.width, height: this.canvas.height, 
			offset: new Microsoft.Maps.Point(-this.canvas.width/2, -this.canvas.height/2),
			htmlContent: '<div id="' + this.id + '" class="bubble"></div>'  
		});
	
};

PowerBubble.prototype = new Microsoft.Maps.Infobox;

PowerBubble.prototype.canvas = { width: 2000, height: 2000 };
PowerBubble.prototype.rectSize = { width: 115, height: 85 };
PowerBubble.prototype.pt = function(x, y) {
	x = this.canvas.width / 2 + x;
	y = this.canvas.height / 2 + y;
	
	return { x: x, y: y };
}

PowerBubble.prototype.init = function() {

	
	this.bubblediv = $("#" + this.id).get()[0];
	this.paper = Raphael( this.bubblediv, this.canvas.width, this.canvas.height );
	this.circle = this.paper.circle(this.origin.x, this.origin.y, 4);
	this.circle.glow({color: "#FF017D" });
	this.circle.attr("fill", "#FFFFFF");
	this.circle.attr("stroke-width", "0");
	
	this.paper.setStart();
	this.paper.rect(this.origin.x, this.origin.y, 0, 0, 0).attr("fill", "#716F70" ).attr("stroke-width", "10").attr("stroke", "#716F70");
	this.paper.image( this.Spot.photo.href({width:105, height:85, color: "#716F70"}), this.origin.x, this.origin.y, 0 );	
	this.rect = this.paper.setFinish();
	
 	this.line = this.paper.path( "M"+ this.origin.x +"," +this.origin.y +"L"+ this.origin.x +","+this.origin.y );
	this.line.attr("stroke-width", "7");
	this.line.attr("stroke", "#716F70");
	
	this.rect.toFront();
	
	var me = this;
	$(this.bubblediv).mouseenter(function(){
		me.highlight();
	});
	
	$(this.bubblediv).mouseleave(function(){
		me.normal();
	});
}

PowerBubble.prototype.getNode = function() {
	var point = this.Spot.Map.tryLocationToPixel( this.Spot );
	
	return new Node( 
		point.x + (this.gravCenter.x), 
		point.y + (this.gravCenter.y), 
		new Vector( 
			(this.gravCenter.x - this.origin.x ),
			(this.gravCenter.y - this.origin.x )
		 ) );
}

PowerBubble.prototype.getNodeOrigin = function() {
	var point = this.Spot.Map.tryLocationToPixel( this.Spot );
	
	return new Node(
		point.x + this.origin.x, point.y + this.origin.x, null
	);
}

PowerBubble.prototype.applyForce = function( force ) {
	this.gravCenter.x += force.x;
	this.gravCenter.y += force.y;
	this.floatAround();
	
	$(this.bubblediv.parentNode.parentNode).css( "z-index", Math.round( 1000 - (new Vector( 
			(this.gravCenter.x - this.origin.x ),
			(this.gravCenter.y - this.origin.x )
		 ).norm() *2) ) );
}


PowerBubble.prototype.floatAround = function() {
	this.rect.attr({ x:this.gravCenter.x - this.rectSize.width / 2, y: this.gravCenter.y - this.rectSize.height / 2 });
	this.line.attr({path: "M"+ this.origin.x +"," +this.origin.y +"L"+ this.gravCenter.x +","+this.gravCenter.y  });
}

PowerBubble.prototype.highlight = function() {
	this.line.attr("stroke", "#FF017D");
	this.rect.attr("stroke", "#FF017D");
	this.circle.attr("fill", "#FF017D");
}

PowerBubble.prototype.normal = function() {
	this.line.attr("stroke", "#716F70");
	this.rect.attr("stroke", "#716F70");
	this.circle.attr("fill", "#FFFFFF");
}

PowerBubble.prototype.plop = function() {
	this.rectAppear = Raphael.animation( { x:this.gravCenter.x - this.rectSize.width / 2, y: this.gravCenter.y - this.rectSize.height / 2, width: this.rectSize.width , height: this.rectSize.height }, 500, "bounce" );
	this.lineAppear = Raphael.animation( { path:  "M"+ this.origin.x +"," +this.origin.y +"L"+ this.gravCenter.x +","+this.gravCenter.y }, 500, "bounce" );
	
	this.rect.animate(this.rectAppear);
	this.line.animateWith( this.rect, this.rectAppear, this.lineAppear );

}

PowerBubble.prototype.slurp = function() {
	this.rectDisappear = Raphael.animation( { x: this.origin.x, y: this.origin.y, width: 0, height: 0, r:0}, 200, "<" );
	this.lineDisappear = Raphael.animation( { path: "M"+ this.origin.x +"," +this.origin.y +"L"+ this.origin.x +","+this.origin.y }, 200, "<" );
	this.rect.stop();
	this.line.stop();
	this.rect.animate( this.rectDisappear );
	this.line.animateWith( this.rect, this.rectDisappear, this.lineDisappear );
	/* this.circle.stop();
	this.circle.attr("fill", "#FFFFFF");
	this.circle.attr("r", 4); */
}
