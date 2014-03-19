var NO_EVENT = -1;
var SLIDER_EVENT = 1;
var BUTTON_EVENT = 2;
var timer = null;
	
// HueTouch v0.1
(function (jQuery) {
  
var __debug = true;

jQuery.fn.hueTouch = function (options) {
  jQuery.hueTouch(this, options);
  return this;
};

jQuery.hueTouch = function (container, options) {
  var container = jQuery(container)[0];
  return container.hueTouch || (container.hueTouch = new jQuery._hueTouch(container, options));
}

jQuery._hueTouch = function (container, options) {
  var ht = this;
  
  /////////////////////////////////////////////////////

  /**
   * Link to the given element(s) or callback.
   */
  ht.linkTo = function (callback) {
    // Unbind previous nodes
    if (typeof ht.callback == 'object') {
      jQuery(ht.callback).unbind('keyup', ht.updateValue);
    }

    // Reset color
    ht.color = null;

    // Bind callback or elements
    if (typeof callback == 'function') {
      ht.callback = callback;
    }
    else if (typeof callback == 'object' || typeof callback == 'string') {
      ht.callback = jQuery(callback);
      ht.callback.bind('keyup', ht.updateValue);
      if (ht.callback[0].value) {
        ht.setColor(ht.callback[0].value);
      }
    }
    return this;
  }
  ht.updateValue = function (event) {
    if (this.value && this.value != ht.color) {
      ht.setColor(this.value);
    }
  }

  /**
   * Change color with HTML syntax #123456
   */
  ht.setColor = function (color) {
    var unpack = ht.unpack(color);
    if (ht.color != color && unpack) {
      ht.color = color;
      ht.rgb = unpack;
      ht.hsl = ht.RGBToHSL(ht.rgb);
      ht.updateDisplay();
    }
    return this;
  }

  /**
   * Change color with HSL triplet [0..1, 0..1, 0..1]
   */
  ht.setHSL = function (hsl) {
    ht.hsl = hsl;
    ht.rgb = ht.HSLToRGB(hsl);
    ht.color = ht.pack(ht.rgb);
    ht.updateDisplay();
    return this;
  }
  ht.setON = function (on) {
    ht.switchONOFF = on;
    ht.updateDisplay();
    return this;
  }

  
  /////////////////////////////////////////////////////

  /**
   * Initialize the color picker widget.
   */
  ht.initWidget = function () {

    // Insert markup and size accordingly.
    var dim = {
      width: options.width*2,
      height: options.width+2.0*options.toolbars
    };
    jQuery(container)
      .html(
        '<div class="hueTouch" style="position: relative">' +
		  '<div class="hueTouch-solid"></div>' +
          '<canvas class="hueTouch-mask"></canvas>' +
          '<canvas class="hueTouch-overlay"></canvas>' +
        '</div>'
      )
      .find('*').attr(dim).css(dim).end()
      .find('div>*').css('position', 'absolute');

    // Determine layout
    ht.radius = (options.width - options.wheelWidth) / 2 - 1;
	
    ht.square = Math.floor((ht.radius - options.wheelWidth)) - 1;
    ht.mid = Math.floor(options.width / 2);
    ht.markerSize = options.wheelWidth * 0.5;
    
	ht.solidFill = jQuery('.hueTouch-solid', container).css({
      width: ht.square * 2 - 1,
      height: ht.square * 2 - 1,
      left: ht.mid - ht.square,
      top: ht.mid - ht.square
    });
	
    // Set up drawing context.
    ht.cnvMask = jQuery('.hueTouch-mask', container);
    ht.ctxMask = ht.cnvMask[0].getContext('2d');
    ht.cnvOverlay = jQuery('.hueTouch-overlay', container);
    ht.ctxOverlay = ht.cnvOverlay[0].getContext('2d');
    ht.ctxMask.translate(ht.mid, ht.mid+options.toolbars);
    ht.ctxOverlay.translate(ht.mid, ht.mid+options.toolbars);
    
	ht.switchONOFF = 0;

	ht.switchsize = options.toolbars*0.35;
	
	ht.switch1X = -ht.mid/1.5;
	ht.switch1Y = -ht.mid-(options.toolbars/2.0)-1;
	ht.switch1ONOFF = 1;
	
	ht.switch2X = 0;
	ht.switch2Y = -ht.mid-(options.toolbars/2.0)-1;
	ht.switch2ONOFF = 0;

	ht.switch3X = ht.mid/1.5;
	ht.switch3Y = -ht.mid-(options.toolbars/2.0)-1;
	ht.switch3ONOFF = 0;

	ht.switch4X = ht.mid/1.5;
	ht.switch4Y = ht.mid+(options.toolbars/2.0)+1;
	ht.switch4ONOFF = 0;

	ht.switch5X = -ht.mid/1.5;
	ht.switch5Y = ht.mid+(options.toolbars/2.0)+1;
	ht.switch5ONOFF = 0;
	
	ht.eventMode = -1;
	
    // Draw widget base layers.
    ht.drawCircle();
  }

  /**
   * Draw the color wheel.
   */
  ht.drawCircle = function () {

    // Draw a hue circle with a bunch of gradient-stroked beziers.
    // Have to use beziers, as gradient-stroked arcs don't work.
    var n = 32,
        r = ht.radius,
        w = options.wheelWidth,
        nudge = 8 / r / n * Math.PI, // Fudge factor for seams.
        m = ht.ctxMask,
        angle1 = 0, color1, d1;
		
	m.clearRect(-ht.mid,-ht.mid-options.toolbars,ht.mid*3,ht.mid*2+2*options.toolbars);
    m.save();
    m.lineWidth = w / r;
    m.scale(r, r);
	
	//if(ht.switch1ONOFF == 1)
	//{
		// Each segment goes from angle1 to angle2.
		for (var i = 0; i <= n; ++i) 
		{
		  var d2 = i / n;
		  var angle2 = d2 * Math.PI * 2;
		  
		  // Endpoints
		  x1 = Math.sin(angle1), y1 = -Math.cos(angle1);
		  x2 = Math.sin(angle2), y2 = -Math.cos(angle2);
		  
		  // Midpoint chosen so that the endpoints are tangent to the circle.
		  am = (angle1 + angle2) / 2;
		  tan = 1 / Math.cos((angle2 - angle1) / 2);
		  xm = Math.sin(am) * tan, ym = -Math.cos(am) * tan;
		  
		  // New color
		  if(ht.switch1ONOFF == 1)
			color2 = ht.pack(ht.HSLToRGB([d2, 1, 0.5]));
		  else if(ht.switch2ONOFF == 1)
			color2 = ht.pack(ht.HSLToRGB([ht.hsl[0], d2, 1.0-d2/2.0]));			
		  else if(ht.switch3ONOFF == 1)
			color2 = ht.pack(ht.HSLToRGB([ht.hsl[0], 0.0, d2]));			
			
		  if (i > 0) 
		  {
			  // Create gradient fill between the endpoints.
			  var grad = m.createLinearGradient(x1, y1, x2, y2);
			  grad.addColorStop(0, color1);
			  grad.addColorStop(1, color2);
			  m.strokeStyle = grad;
			  // Draw quadratic curve segment.
			  m.beginPath();
			  m.moveTo(x1, y1);
			  m.quadraticCurveTo(xm, ym, x2, y2);
			  m.stroke();
		  }
		  // Prevent seams where curves join.
		  angle1 = angle2 - nudge; color1 = color2; d1 = d2;
		}

	//}
	
    m.restore();	
  };
  
 ht.drawCircle2 = function (x, y, mode) {

	// Draw a hue circle with a bunch of gradient-stroked beziers.
    // Have to use beziers, as gradient-stroked arcs don't work.
    var n = 8,
        r = ht.switchsize*1.0,
        w = options.toolbars/10,
        nudge = 1 / r / n * Math.PI, // Fudge factor for seams.
        m = ht.ctxMask,
        angle1 = 0, color1, d1;
		
	//m.clearRect(-ht.mid,-ht.mid-options.toolbars,ht.mid*3,ht.mid*2+2*options.toolbars);
    m.save();
    m.lineWidth = w / r;
	m.translate(x, y);
    m.scale(r, r);
	// Each segment goes from angle1 to angle2.
	for (var i = 0; i <= n; ++i) 
	{
	  var d2 = i / n;
	  var angle2 = d2 * Math.PI * 2;
	  
	  // Endpoints
	  x1 = Math.sin(angle1), y1 = - Math.cos(angle1);
	  x2 = Math.sin(angle2), y2 = - Math.cos(angle2);
	  
	  // Midpoint chosen so that the endpoints are tangent to the circle.
	  am = (angle1 + angle2) / 2;
	  tan = 1 / Math.cos((angle2 - angle1) / 2);
	  xm = Math.sin(am) * tan, ym = -Math.cos(am) * tan;
	  
	  // New color
	  if(mode == 1)
		color2 = ht.pack(ht.HSLToRGB([d2, 1, 0.5]));
	  else if(mode == 2)
		color2 = ht.pack(ht.HSLToRGB([ht.hsl[0], d2, 1.0-d2/2.0]));			
	  else if(mode == 3)
		color2 = ht.pack(ht.HSLToRGB([ht.hsl[0], 0.0, d2]));			
		
	  if (i > 0) 
	  {
		  // Create gradient fill between the endpoints.
		  var grad = m.createLinearGradient(x1, y1, x2, y2);
		  grad.addColorStop(0, color1);
		  grad.addColorStop(1, color2);
		  m.strokeStyle = grad;
		  // Draw quadratic curve segment.
		  m.beginPath();
		  m.moveTo(x1, y1);
		  m.quadraticCurveTo(xm, ym, x2, y2);
		  m.stroke();
	  }
	  // Prevent seams where curves join.
	  angle1 = angle2 - nudge; color1 = color2; d1 = d2;
	}
	
    m.restore();	
  };
  
  /**
   * Draw the center switch.
   */
  ht.drawSwitches = function () {
  
    //ht.ctxOverlay.clearRect(-ht.mid/2, -ht.mid/2, options.width/2, options.width/2);
	lw = Math.ceil(ht.markerSize / 10);

	//Global to all swithces
	ht.ctxOverlay.lineWidth = lw;
	//ht.ctxOverlay.strokeStyle = '#000';
	ht.ctxOverlay.fillStyle = '#eee';		
	ht.ctxOverlay.shadowColor = '#999';

	//Center TOGGLE SWITCH
	//==================
	if(ht.switchONOFF == 1)
	{
		ht.ctxOverlay.shadowBlur = 10;
		ht.ctxOverlay.shadowOffsetX = 5;
		ht.ctxOverlay.shadowOffsetY = 5;
	}
	else
	{
		ht.ctxOverlay.shadowBlur = 20;
		ht.ctxOverlay.shadowOffsetX = 10;
		ht.ctxOverlay.shadowOffsetY = 10;
	}
	ht.ctxOverlay.beginPath();
	ht.ctxOverlay.arc(0,0, ht.radius-options.wheelWidth, 0, Math.PI*2, true);
	ht.ctxOverlay.fill();
	//ht.ctxOverlay.stroke();	
	ht.ctxOverlay.closePath();
	
	/*ht.ctxOverlay.fillStyle = '#eee';
	ht.ctxOverlay.font = "bold 100px FontAwesome";
	var texwidth = ht.ctxOverlay.measureText(String.fromCharCode(parseInt("f011 ", 16))).width;
	console.log("texwidth " + texwidth);
	var texheight = ht.ctxOverlay.measureText("w").width;
	ht.ctxOverlay.fillText(String.fromCharCode(parseInt("f011", 16)), 0-texwidth/2, -1+texheight/2);
	ht.ctxOverlay.fillStyle = '#eee';*/

	//TOP BAR SWITCHES
	//==================
	
	//SWITCH 1
	if( ht.switch1ONOFF == 1 )
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 1;
		ht.ctxOverlay.shadowOffsetY = 1;
	}
	else
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 3;
		ht.ctxOverlay.shadowOffsetY = 3;
	}
	ht.ctxOverlay.beginPath();
	ht.ctxOverlay.arc(ht.switch1X, ht.switch1Y, ht.switchsize, 0, Math.PI*2, true);
	//ht.ctxOverlay.stroke();	
	ht.ctxOverlay.fill();
	ht.ctxOverlay.closePath();
	ht.drawCircle2(ht.switch1X, ht.switch1Y, 1);

	//SWITCH 2		
	if( ht.switch2ONOFF == 1 )
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 1;
		ht.ctxOverlay.shadowOffsetY = 1;
	}
	else
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 3;
		ht.ctxOverlay.shadowOffsetY = 3;
	}	
	ht.ctxOverlay.beginPath();
	ht.ctxOverlay.arc(ht.switch2X, ht.switch2Y, ht.switchsize, 0, Math.PI*2, true);
	//ht.ctxOverlay.stroke();	
	ht.ctxOverlay.fill();
	ht.ctxOverlay.closePath();
	ht.drawCircle2(ht.switch2X, ht.switch2Y, 2);

	//SWITCH 3		
	if( ht.switch3ONOFF == 1 )
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 1;
		ht.ctxOverlay.shadowOffsetY = 1;
	}
	else
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 3;
		ht.ctxOverlay.shadowOffsetY = 3;
	}	
	ht.ctxOverlay.beginPath();
	ht.ctxOverlay.arc(ht.switch3X, ht.switch3Y, ht.switchsize, 0, Math.PI*2, true);
	//ht.ctxOverlay.stroke();	
	ht.ctxOverlay.fill();
	ht.ctxOverlay.closePath();
	ht.drawCircle2(ht.switch3X, ht.switch3Y, 3);

	//SWITCH 4		
	if( ht.switch4ONOFF == 1 )
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 1;
		ht.ctxOverlay.shadowOffsetY = 1;
	}
	else
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 3;
		ht.ctxOverlay.shadowOffsetY = 3;
	}	
	ht.ctxOverlay.beginPath();
	ht.ctxOverlay.arc(ht.switch4X, ht.switch4Y, ht.switchsize, 0, Math.PI*2, true);
	//ht.ctxOverlay.stroke();	
	ht.ctxOverlay.fill();
	ht.ctxOverlay.closePath();
	ht.ctxOverlay.beginPath();
	ht.ctxOverlay.moveTo(ht.switch4X-ht.switchsize/3, ht.switch4Y-ht.switchsize/2);
	ht.ctxOverlay.lineTo(ht.switch4X-ht.switchsize/3, ht.switch4Y+ht.switchsize/2);
	ht.ctxOverlay.stroke();	
	ht.ctxOverlay.beginPath();
	ht.ctxOverlay.moveTo(ht.switch4X+ht.switchsize/3, ht.switch4Y-ht.switchsize/2);
	ht.ctxOverlay.lineTo(ht.switch4X+ht.switchsize/3, ht.switch4Y+ht.switchsize/2);
	ht.ctxOverlay.stroke();		
	
	//SWITCH 5		
	if( ht.switch5ONOFF == 1 )
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 1;
		ht.ctxOverlay.shadowOffsetY = 1;
	}
	else
	{
		ht.ctxOverlay.shadowBlur = 5;
		ht.ctxOverlay.shadowOffsetX = 3;
		ht.ctxOverlay.shadowOffsetY = 3;
	}	
	ht.ctxOverlay.beginPath();
	ht.ctxOverlay.arc(ht.switch5X, ht.switch5Y, ht.switchsize, 0, Math.PI*2, true);
	//ht.ctxOverlay.stroke();	
	ht.ctxOverlay.fill();
	ht.ctxOverlay.closePath();
	ht.ctxOverlay.beginPath();
	ht.ctxOverlay.moveTo(ht.switch5X, ht.switch5Y-ht.switchsize/2);
	ht.ctxOverlay.lineTo(ht.switch5X, ht.switch5Y+ht.switchsize/2);
	ht.ctxOverlay.stroke();	
}
  /**
   * Draw the selection marker.
   */
  ht.drawMarker = function () {
    // Determine marker dimensions
	var myang = 0;
	if( ht.switch1ONOFF == 1 )
		myang = ht.hsl[0];
	if( ht.switch2ONOFF == 1 )
		myang = ht.hsl[1];
	if( ht.switch3ONOFF == 1 )
		myang = ht.hsl[2];
	
    var sz = options.width, lw = Math.ceil(ht.markerSize / 4), r = ht.markerSize - lw + 1;
    var angle = myang * 6.28,
        x1 =  Math.sin(angle) * ht.radius,
        y1 = -Math.cos(angle) * ht.radius,
        x2 = 2 * ht.square * (.5 - ht.hsl[1]),
        y2 = 2 * ht.square * (.5 - ht.hsl[2]),
        c1 = ht.invert ? '#fff' : '#000',
        c2 = ht.invert ? '#000' : '#fff';
    var circles = [
      { x: x1, y: y1, r: r,             c: '#000', lw: lw + 1 },
      { x: x1, y: y1, r: ht.markerSize, c: '#fff', lw: lw }
    ];

    // Update the overlay canvas.
    ht.ctxOverlay.clearRect(-ht.mid, -ht.mid, sz, sz);
	ht.ctxOverlay.clearRect(-ht.mid,-ht.mid-options.toolbars,ht.mid*3,ht.mid*2+2*options.toolbars);
    //ht.ctxOverlay.clearRect(-ht.mid, -ht.mid, sz, sz);

    for (i in circles) 
	{
      var c = circles[i];
      ht.ctxOverlay.beginPath();
      ht.ctxOverlay.lineWidth = c.lw;
      ht.ctxOverlay.strokeStyle = c.c;
		if( ht.switch1ONOFF == 1 )
			ht.ctxOverlay.fillStyle = ht.pack(ht.HSLToRGB([ht.hsl[0], 1, 0.5]));		
		if( ht.switch2ONOFF == 1 )
			ht.ctxOverlay.fillStyle = ht.pack(ht.HSLToRGB([ht.hsl[0], ht.hsl[1], 1.0-ht.hsl[1]/2.0]));		
		if( ht.switch3ONOFF == 1 )
			ht.ctxOverlay.fillStyle = ht.pack(ht.HSLToRGB([ht.hsl[0], 0.0, ht.hsl[2]]));		
   	  ht.ctxOverlay.shadowColor = '#999';
	  ht.ctxOverlay.shadowBlur = 5;
	  ht.ctxOverlay.shadowOffsetX = 1;
      ht.ctxOverlay.shadowOffsetY = 1;
      ht.ctxOverlay.arc(c.x, c.y, c.r, 0, Math.PI * 2, true);
      ht.ctxOverlay.stroke();
	  ht.ctxOverlay.fill();
	  ht.ctxOverlay.closePath();
    }
  }

  /**
   * Update the markers and styles
   */
  ht.updateDisplay = function () {
    // Determine whether labels/markers should invert.
    ht.invert = (ht.rgb[0] * 0.3 + ht.rgb[1] * .59 + ht.rgb[2] * .11) <= 0.6;

    // Update the solid background fill.
    //ht.solidFill.css('backgroundColor', ht.pack(ht.HSLToRGB([ht.hsl[0], 1, 0.5])));

	//ht.drawCircle();
	
    // Draw markers
    ht.drawMarker();
    
	//Draw center toggle switch
	ht.drawSwitches();

    // Linked elements or callback
    if (typeof ht.callback == 'object') {
      // Set background/foreground color
      jQuery(ht.callback).css({
        //backgroundColor: ht.color,
        color: ht.invert ? '#fff' : '#000'
      });

      // Change linked value
      jQuery(ht.callback).each(function() {
        if ((typeof this.value == 'string') && this.value != ht.color) {
          this.value = ht.color;
        }
      });
    }
    else if (typeof ht.callback == 'function') {
      ht.callback.call(fb, ht.color);
    }
  }
  
  /**
   * Helper for returning coordinates relative to the center.
   */
  ht.widgetCoords = function (event) {
    return {
      x: event.pageX - ht.offset.left - ht.mid ,    
      y: event.pageY - ht.offset.top - (ht.mid + options.toolbars)
    };    
  }

  /**
   * Mousedown handler
   */
  ht.mousedown = function (event) {
    // Capture mouse
    if (!jQuery._hueTouch.dragging) {
      jQuery(document).bind('mousemove', ht.mousemove);
	  jQuery(document).bind('mouseup', ht.mouseup);
      jQuery._hueTouch.dragging = true;
    }

    // Update the stored offset for the widget.
    ht.offset = jQuery(container).offset();

    // Check which area is being dragged
    var pos = ht.widgetCoords(event);
	
	// defaults
    ht.circleDrag = false;
	ht.eventMode = NO_EVENT;

	//are we inside the circle slider?
	if(Math.max(Math.abs(pos.x), Math.abs(pos.y)) > (ht.square + 2) && Math.abs(pos.y) < ht.mid)
	{
		console.log("Slider Mode");
		// Process slider events
		ht.eventMode = SLIDER_EVENT;
		ht.circleDrag = true;
	}
	else
	{
		//inside our centre switch
		if(Math.max(Math.abs(pos.x), Math.abs(pos.y)) < (ht.square + 2))
		{
			console.log("ON/OFF Mode");
			ht.eventMode = BUTTON_EVENT;
			ht.switchONOFF = !ht.switchONOFF;
			ht.updateDisplay();
		}
		
		//inside out top toolbar switches		
		if(pos.x > ht.switch1X-ht.switchsize && pos.x < ht.switch1X+ht.switchsize && 
		   pos.y > ht.switch1Y-ht.switchsize && pos.y < ht.switch1Y+ht.switchsize ) 
		{
			console.log("Hue Mode");
			ht.eventMode = BUTTON_EVENT;
			ht.switch1ONOFF = 1;
			ht.switch2ONOFF = 0;
			ht.switch3ONOFF = 0;
			ht.drawCircle();
			ht.updateDisplay();
		}
		if(pos.x > ht.switch2X-ht.switchsize && pos.x < ht.switch2X+ht.switchsize && 
		   pos.y > ht.switch2Y-ht.switchsize && pos.y < ht.switch2Y+ht.switchsize ) 
		{
			console.log("Saturation Mode");
			ht.eventMode = BUTTON_EVENT;
			ht.switch1ONOFF = 0;
			ht.switch2ONOFF = 1;
			ht.switch3ONOFF = 0;
			ht.drawCircle();
			ht.updateDisplay();
		}
		if(pos.x > ht.switch3X-ht.switchsize && pos.x < ht.switch3X+ht.switchsize && 
		   pos.y > ht.switch3Y-ht.switchsize && pos.y < ht.switch3Y+ht.switchsize ) 
		{
			console.log("Brightness Mode");
			ht.eventMode = BUTTON_EVENT;
			ht.switch1ONOFF = 0;
			ht.switch2ONOFF = 0;
			ht.switch3ONOFF = 1;
			ht.drawCircle();
			ht.updateDisplay();
		}
		if(pos.x > ht.switch4X-ht.switchsize && pos.x < ht.switch4X+ht.switchsize && 
		   pos.y > ht.switch4Y-ht.switchsize && pos.y < ht.switch4Y+ht.switchsize ) 
		{
			timer = setTimeout( ht.saveScene, 2000 );
			ht.eventMode = BUTTON_EVENT;
			ht.switch4ONOFF = 1;
			ht.drawCircle();
			ht.updateDisplay();
		}
		if(pos.x > ht.switch5X-ht.switchsize && pos.x < ht.switch5X+ht.switchsize && 
		   pos.y > ht.switch5Y-ht.switchsize && pos.y < ht.switch5Y+ht.switchsize ) 
		{
			timer = setTimeout( ht.saveScene, 2000 );
			ht.eventMode = BUTTON_EVENT;
			ht.switch5ONOFF = 1;
			ht.drawCircle();
			ht.updateDisplay();
		}		
	}
	
	ht.mousemove(event);	
    return false;
  }
	
  /**
   * Mouseup handler
   */
  ht.mouseup = function () {
    // Uncapture mouse
    jQuery(document).unbind('mousemove', ht.mousemove);
    jQuery(document).unbind('mouseup', ht.mouseup);
    jQuery._hueTouch.dragging = false;
   
	if(ht.switch4ONOFF == 1)
	{
		console.log("Scene1");
		clearTimeout( timer );
		ht.switch4ONOFF = 0;
		ht.updateDisplay();
  		jQuery( "#colPicker" ).trigger("scene1");
	}
	if(ht.switch5ONOFF == 1)
	{
		jQuery( "#colPicker" ).trigger("scene2");

		console.log("Scene2");
		clearTimeout( timer );
		ht.switch5ONOFF = 0;
		ht.updateDisplay();
	}
  }
  
  /**
   * Mousemove handler
   */
  ht.mousemove = function (event) {
    // Get coordinates relative to color picker center
    var pos = ht.widgetCoords(event);

    // Set new HSL parameters
    if (ht.circleDrag) 
	{
		if(ht.switch1ONOFF == 1)
		{
		  var hue = Math.atan2(pos.x, -pos.y) / 6.28;
		  ht.setHSL([(hue + 1) % 1, ht.hsl[1], ht.hsl[2]]);
		}
		else if(ht.switch2ONOFF == 1)
		{
		  var sat = Math.atan2(pos.x, -pos.y) / 6.28;
		  ht.setHSL([ht.hsl[0], (sat + 1) % 1, ht.hsl[2]]);
		}
		else if(ht.switch3ONOFF == 1)
		{
		  var lum = Math.atan2(pos.x, -pos.y) / 6.28;
		  ht.setHSL([ht.hsl[0], ht.hsl[1], (lum + 1) % 1]);
		}			
    }
    else 
	{
      /*var sat = Math.max(0, Math.min(1, -(pos.x / ht.square / 2) + .5));
      var lum = Math.max(0, Math.min(1, -(pos.y / ht.square / 2) + .5));
      ht.setHSL([ht.hsl[0], sat, lum]);*/
    }
    return false;
  }
ht.saveScene = function () {

	if(ht.switch4ONOFF == 1)
	{
		console.log("Save Scene1");
		jQuery( "#colPicker" ).trigger('saveScene1');
		ht.switch4ONOFF = 0;
		ht.updateDisplay();
	}
	if(ht.switch5ONOFF == 1)
	{
		console.log("Save Scene2");
		jQuery( "#colPicker" ).trigger('saveScene2');
		ht.switch5ONOFF = 0;
		ht.updateDisplay();
	}	
}



  /* Various color utility functions */
  ht.dec2hex = function (x) {
    return (x < 16 ? '0' : '') + x.toString(16);
  }

  ht.packDX = function (c, a) {
    return '#' + ht.dec2hex(a) + ht.dec2hex(c) + ht.dec2hex(c) + ht.dec2hex(c);
  };
  
  ht.pack = function (rgb) {
    var r = Math.round(rgb[0] * 255);
    var g = Math.round(rgb[1] * 255);
    var b = Math.round(rgb[2] * 255);
    return '#' + ht.dec2hex(r) + ht.dec2hex(g) + ht.dec2hex(b);
  };

  ht.unpack = function (color) {
    if (color.length == 7) {
      function x(i) {
        return parseInt(color.substring(i, i + 2), 16) / 255;
      }
      return [ x(1), x(3), x(5) ];
    }
    else if (color.length == 4) {
      function x(i) {
        return parseInt(color.substring(i, i + 1), 16) / 15;
      }
      return [ x(1), x(2), x(3) ];
    }
  };

  ht.HSLToRGB = function (hsl) {
    var m1, m2, r, g, b;
    var h = hsl[0], s = hsl[1], l = hsl[2];
    m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
    m1 = l * 2 - m2;
    return [
      this.hueToRGB(m1, m2, h + 0.33333),
      this.hueToRGB(m1, m2, h),
      this.hueToRGB(m1, m2, h - 0.33333)
    ];
  };

  ht.hueToRGB = function (m1, m2, h) {
    h = (h + 1) % 1;
    if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
    if (h * 2 < 1) return m2;
    if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
    return m1;
  };

  ht.RGBToHSL = function (rgb) {
    var r = rgb[0], g = rgb[1], b = rgb[2],
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        delta = max - min,
        h = 0,
        s = 0,
        l = (min + max) / 2;
    if (l > 0 && l < 1) {
      s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
    }
    if (delta > 0) {
      if (max == r && max != g) h += (g - b) / delta;
      if (max == g && max != b) h += (2 + (b - r) / delta);
      if (max == b && max != r) h += (4 + (r - g) / delta);
      h /= 6;
    }
    return [h, s, l];
  };
  
  // Touch support
  jQuery.extend(jQuery.support, {
    touch: typeof Touch == "object"
  });
  
  /**
   * Simulate mouse events for touch devices
   */
  ht.touchHandle = function (event) {
    var touches = event.originalEvent.changedTouches,
        firstTouch = touches[0],
        type = "";
        
    switch(event.type) {
        case 'touchstart': type = 'mousedown'; break;
        case 'touchmove':  type='mousemove'; break;        
        case 'touchend':   type='mouseup'; break;
        default: return;
    }

    //initMouseEvent(type, canBubble, cancelable, view, clickCount, 
    //           screenX, screenY, clientX, clientY, ctrlKey, 
    //           altKey, shiftKey, metaKey, button, relatedTarget);

    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
                              firstTouch.screenX, firstTouch.screenY, 
                              firstTouch.clientX, firstTouch.clientY, false, 
                              false, false, false, 0/*left*/, null);

    firstTouch.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
  }

  // Parse options.
  if (!options.callback) {
    options = { callback: options };
  }
  if (!options.scene1CallBack) {
    options = { scene1CallBack: options };
  } 
  options = jQuery.extend({
    width: 200,
    wheelWidth: (options.width || 300) / 8,
	toolbars: 50,
    callback: null
  }, options);

  // Initialize.
  ht.initWidget();

  // Install mousedown handler (the others are set on the document on-demand)
  jQuery('canvas.hueTouch-overlay', container).mousedown(ht.mousedown);
  
  // Install touch handlers to simulate appropriate mouse events
  if (jQuery.support.touch) jQuery('canvas.hueTouch-overlay', container).bind('touchstart touchmove touchend touchcancel', ht.touchHandle);
  
  // Set linked elements/callback
  if (options.callback) {
    ht.linkTo(options.callback);
  }
  // Set to white.
  ht.setColor('#FFFFFF');
}

})(jQuery);
