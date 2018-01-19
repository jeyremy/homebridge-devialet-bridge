var request = require('request');
var parseString = require('xml2js').parseString;

var Service, Characteristic;
actualDevice = []; 
var ssdp = require('node-ssdp').Client, client = new ssdp();
http = require('http'), url = require('url'), request = require('request');
var discoverInterval = 10000; //milliseconds

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-devialet-bridge", "devialet-bridge", ReceiverVolume);
}

function ReceiverVolume(log, config) {
    this.log = log;

    this.name = config['name'] || "Receiver Volume";
    this.maxVolume = config['maxVolume'] || 70;
    this.host = config['host'];
    this.zone = (config['zone'] || 1) | 0; // default to 1, and make sure its an integer
    this.controlPower = !!config['controlPower']; // default to false, and make sure its a bool
    this.controlMute = !!config['controlMute'] && this.controlPower === false;
    this.mapMaxVolumeTo100 = !!config['mapMaxVolumeTo100'];
    this.lastVolume = 0;
    
    //cap maxVolume.  Devialet percentage maxes at 98 in receiver settings
    if(this.maxVolume > 98)
        this.maxVolume = 98;
    
    if (!this.host) {
        this.log.warn('Config is missing host/IP of receiver');
        callback(new Error('No host/IP defined.'));
        return;
    }
      searchSpeaker();

    if (!this.controlPower) {
        this.fakePowerState = 1; //default to on so that brightness will update in HomeKit apps
    }
    
}


client.on('response', function inResponse(headers, code, rinfo) {
	if(rinfo.address == this.host)
	{
		actualDevice["host"] = parseUri(headers.LOCATION).host;
		actualDevice["port"] = parseUri(headers.LOCATION).port;
	}
})

function searchSpeaker()
{
	client.search('urn:schemas-upnp-org:service:RenderingControl:2');
	setTimeout(function() {
  searchSpeaker();
	}, discoverInterval);	
	
	if(actualDevice["host"])
	{
		console.log("Devialet bridge found at: "+actualDevice["host"]+":"+actualDevice["port"]);
	}	
}

ReceiverVolume.prototype.getStatus = function(callback) {
    var statusUrl = `http://${this.host}/goform/form${this.zoneName}_${this.zoneName}XmlStatus.xml`;
    request.get(statusUrl, function (error, response, body) {
        var xml = '';
        if (!error && response.statusCode == 200) {
            parseString(xml + body, function (err, result) {
                callback(result.item);
            }.bind(this));
        }else{
            callback(null);
        }
    }.bind(this));
}

ReceiverVolume.prototype.setControl = function (control, val, callback) {
   /* var controlUrl = `http://${this.host}/goform/formiPhoneApp${control}.xml?${this.zone}+${command}`;
    request.get(controlUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null);
        } else {
            callback(error);
        }
    }.bind(this));*/

   //c'est ici qu'on envoi le volume
   if(!actualDevice["host"])
	{
		var status =  "Sorry: Speakers not found yet. Try later..";
	}
    else
    {
        var status = "Set Volume to: "+val+"%";

        var xml = '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">'+
            '<s:Body>'+
            '<u:SetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:2">'+
            '<InstanceID>0</InstanceID>'+
            '<Channel>Master</Channel>'+
            '<DesiredVolume>'+val+'</DesiredVolume>'+
            '</u:SetVolume>'+
            '</s:Body>'+
            '</s:Envelope>';

        var http_options = {
            hostname: actualDevice["host"],
            port: actualDevice["port"], //a vérifier car pas sur.
            path: '/Control/LibRygelRenderer/RygelRenderingControl',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'SOAPACTION': 'urn:schemas-upnp-org:service:RenderingControl:2#SetVolume',
                'Content-Length': xml.length
            }
        }

        var req = http.request(http_options, (res) => {
            res.setEncoding('utf8');
            console.log("statuscode  == "+res.statusCode)    ;
            if ( res.statusCode == 200) {
                this.lastVolume = val;
                callback(null);
            } else {
              callback(res.statusCode);
            }
        });
        req.on('error', (e) => {
            console.log(`problem with request: ${e.message}`);
            callback(e);
        });

      //  req.bind(this); //not sure.
        req.write(xml);
        req.end();
        console.log(status);
    }
    console.log(status);



}

ReceiverVolume.prototype.setBrightness = function(newLevel, callback) {
    this.setControl('Volume', newLevel, callback);
}

ReceiverVolume.prototype.getBrightness = function(callback) {
   /* this.getStatus(function(status) {
        
        if(status){
            var volume = parseInt(status.MasterVolume[0].value[0]) + 80;
            this.log("Get receiver volume %s ", volume);
            
            if(this.mapMaxVolumeTo100){
                volume = volume * (100/this.maxVolume);
            }
            
            
            callback(null, volume);
        }else{
            this.log("Unable to get receiver status");
            callback(null);
        }
        
    }.bind(this));*/

    callback(null, this.lastVolume); //en attendant mieux

}

ReceiverVolume.prototype.getServices = function() {
    var lightbulbService = new Service.Lightbulb(this.name);

    lightbulbService
        .addCharacteristic(new Characteristic.Brightness())
        .on('set', this.setBrightness.bind(this));

    return [lightbulbService];
}


function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};


