
// ! -------- Create Settings --------
var stopSearching = false;
var connectTimer;
var connectIP;
var connectCount = 0;
var timeout = 10;
var lights;

function hueFindRange(ip, continueAfter, percent, nointerval){
	// Connect
	nointerval = nointerval;
	var obj = new Object();
	obj.username 	= username;
	obj.devicetype 	= "Hue Connect API Client";	
	console.log('hueFindRange :: '+ip);
	
	if(!stopSearching){
		/*
		jQuery.mobile.loading( 'show', {
			text: percent+'%',
			textVisible: true,
			theme: 'a',
			html: '<p>Searching...</p><div class="percent-bar"><div class="percent" style="width: '+percent+'%;">'+percent+'%</div></div>'
		});*/
		jQuery('.percent-bar').html('<div class="percent" style="width: '+percent+'%;">'+percent+'%</div>');

	}
	jQuery('#ip-lookup').html(ip);	
	
	
	jQuery.ajax('http://'+ip+'/api/'+username, {
	    type : 'GET',
	     timeout:500,
		success: function(data){   

			stopSearching = true;	           
			
			console.log('Connect :: Check Hub : Username: '+username);
			console.log(data);
			//console.log('Error in data: '+(data[0].hasOwnProperty("error")));
			if(data[0] != undefined){
				if(data[0].hasOwnProperty("error")){
					console.log('ERROR from Hub :: HUE Found, press connect : '+ip);						
					console.log(data.error);
					connectHubPress(ip, continueAfter, percent, nointerval)
					//connectHubPress(ip, continueAfter, percent, nointerval)
												
				}
			}
			if("lights" in data == true){
				stopSearching = true;
				console.log('SUCCESS Key exists :: data.lights: '+username);
				hueDevices(ip, obj.username);
			}
		},  
		error: function(data){  
			//console.log('Not found: '+ip);
			if(stopSearching == false){
				hueFindNext();
			}
			//console.log(data);		 
		},
		statusCode: {
		    404: function() {
		     // console.log("Not found: "+ip);
		    }
		  } 	    
    });	

}

function connectHubPress(ip, continueAfter, percent, nointerval){
	
	var obj = new Object();
	obj.username 	= username;
	obj.devicetype 	= "Hue Connect API Client";		
	jQuery.ajax('http://'+ip+'/api/', {
	    data : JSON.stringify(obj),
	    contentType : 'application/json',
	    type : 'POST',
	     timeout:500,
		success: function(data){   
			stopSearching = true;	           
			console.log('Connect :: Loaded : Username: ');
			console.log(data);
			if(typeof data.error != undefined){
	        	stopSearching = true;
				console.log('Connect :: HUE Found, press connect : '+ip);						
				jQuery("#ip-address").attr('placeholder', ip);
				//console.log('Connect :: Error');
				jQuery.mobile.changePage( jQuery("#connect-hub"), "slide", true, true);
				
				connectIP = ip;
				
				if(!nointerval){
					jQuery('#timer-wrap').html('<div id="timer-wrap"><ul><li><div id="timer-display"><div id="countdown">'+(timeout+1)+'</div></div></li><li><a href="#hub-not-found" id="cancel-connct-hub" class="btn-mode grey" data-rel="_back">Cancel</a></li></ul>');
					connectTimer = window.setInterval(connectHueNewIp, 1000);
				}
				
				console.log(data[0].error);
											
			}else{
				hueDevices(ip, obj.username); // Check to see if key 
			}
		},  
		error: function(data){  
			//console.log('Not found: '+ip);
			if(stopSearching == false){
			hueFindNext();
			}
			//console.log(data);		 
		},
		statusCode: {
		    404: function() {
		     // console.log("Not found: "+ip);
		    }
		  } 	    
    });	
}

var currentIPRange = 1;
var stopSearching = false;
function hueFindNext()
{
	if(currentIPRange < 254 && settings == undefined && stopSearching == false)
	{
		currentIPRange++;
		hueFindRange('10.0.1.'+currentIPRange, stopSearching);			
		hueFindRange('10.0.0.'+currentIPRange, stopSearching);	
		hueFindRange('192.168.1.'+currentIPRange, stopSearching);			
		hueFindRange('192.168.1.'+currentIPRange, stopSearching,Math.floor((currentIPRange/254)*100));			
	}else if(settings != undefined)
	{
		console.log('Hue found: '+settings.ip);	
	}else
	{
		console.log('Hue not found...');
		//$.mobile.loading('hide');
		currentIPRange = 1;
		stopSearching = true;	
	}
}

function hueFindComplete(){
	console.log("done");
}
// ! -------- Settings --------

var settings;
var username = 'HueConnect';

function getSettings(){
	/*
	var ip 				= '10.0.0.12';
	var username 		= 'HueConnect';
	*/
	// Retrieve the object from storage
	var retrievedObject = localStorage.getItem('settings');
	console.log('Settings: ', JSON.parse(retrievedObject));
	console.log('getSettings ::'+ (retrievedObject != null));
	if(retrievedObject != null){
		settings = JSON.parse(retrievedObject);
		jQuery('#ip-address-display').html(settings.ip);
		return true;
	}else{
		return false;		
	}
}

function saveSettings(ip, username){

	var settings = { 'ip': ip, 'username': username};
	localStorage.setItem('settings', JSON.stringify(settings));	
	console.log('Save Settings :: ');
	console.log(settings);
	getSettings();
}

// ! -------- Hue Methods --------

function hueSwitchLight(ip, username, light_id, on_off){	
	    var putdata = new Object(); // {"bri": 254, "on": true} 
		putdata.on = on_off;
		//putdata.transitiontime = 0;

		jQuery.ajax({
	    url: 'http://'+ip+'/api/'+username+'/lights/'+light_id+'/state',
	    data : JSON.stringify(putdata),
	    type: 'PUT',
	    success: function(result) {
	        // Do something with the result
	        //console.log(result);
	    }
	    });
}

function hueBrightness(ip, username, light_id, brightness){	

	    var putdata = new Object(); // {"bri": 254, "on": true} 
		putdata.bri = brightness;
		putdata.on = true;		
		//putdata.transitiontime = 0;		

		jQuery.ajax({
	    url: 'http://'+ip+'/api/'+username+'/lights/'+light_id+'/state',
	    data : JSON.stringify(putdata),
	    type: 'PUT',
	    success: function(result) {
	        // Do something with the result
	        //console.log(result);
	    }
	    });
}


function hueColor(ip, username, light_id, brightness, hue, saturation){	

	    var putdata = new Object(); // {"bri": 254, "on": true} 
		putdata.bri = brightness;
		putdata.hue = hue;
		putdata.sat = saturation;				
		putdata.on = true;		
		//putdata.transitiontime = 0;		

		jQuery.ajax({
	    url: 'http://'+ip+'/api/'+username+'/lights/'+light_id+'/state',
	    data : JSON.stringify(putdata),
	    type: 'PUT',
	    success: function(result) {
	        // Do something with the result
	        //console.log(result);
	    }
	    });
}



function hueDevices(ip,username){	

	jQuery.ajax({
	    url: 'http://'+ip+'/api/'+username,
	    type: 'GET',
	    success: function(result) {
	        // Do something with the result
	        //console.log(result);
	        
	        // Check if object exists
	        if(typeof(result[0]) != null && !result.lights){

			}else{
				saveSettings(ip, username);	
				console.log('Connect :: HUE Found & connected: '+ip);						
				console.log(result);			
				hueFindComplete();
				window.clearInterval(connectTimer);				
				
			lights = result.lights;	
			}	        	
	    }
    });

	
}

function hueConnect(ip){
	// Connect
	var obj = new Object();
	obj.username 	= username;
	obj.devicetype 	= "Hue Connect API Client";	

	jQuery.ajax('http://'+ip+'/api', {
	    data : JSON.stringify(obj),
	    contentType : 'application/json',
	    type : 'POST',
		success: function(data){              
			console.log('Connect :: Loaded');

			if(data[0].error){
				console.log('Connect :: Error');
				console.log(data[0].error);	
			}else{
				console.log(data);				
			}
		},  
		error: function(data){  
			console.log('Error');
			console.log(data);		 
		}  	    
    });	
}
 