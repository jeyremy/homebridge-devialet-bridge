var request = require('request');
var parseString = require('xml2js').parseString;

var Service, Characteristic;
actualDevice = [];
var ssdp = require('node-ssdp').Client, client = new ssdp();
http = require('http'), url = require('url'), request = require('request');
var discoverInterval = 10000; //milliseconds
var confHost = "127.0.0.1";
var logBridge ;
module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-devialet-bridge", "devialet-bridge", ReceiverVolume);
}

function ReceiverVolume(log, config) {
    this.log = log;
    logBridge = this.log;
    this.name = config['name'] || "Devialet Bridge";
    this.maxVolume = config['maxVolume'] || 70;
    this.host = confHost  = config['host'];
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
          
          //  console.log("Found something at "+rinfo.address+"===?"+confHost);
          
          if(rinfo.address == confHost)
          {
              actualDevice["host"] = parseUri(headers.LOCATION).host;
              actualDevice["port"] = parseUri(headers.LOCATION).port;
              logBridge.info("Devialet Bridge found at "+actualDevice["host"]+":"+actualDevice["port"]);
          }
 })

function searchSpeaker()
{
    logBridge.info("Seraching for Devialet bridge");
    client.search('urn:schemas-upnp-org:service:RenderingControl:2');
    
    setTimeout(function() {
               if(!actualDevice["host"]) searchSpeaker();
               }, discoverInterval);
    
    if(actualDevice["host"])
    {
        logBridge.info("Devialet bridge found at: "+actualDevice["host"]+":"+actualDevice["port"]);
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
                if ( res.statusCode == 200) {
                   this.lastVolume = val;
                   callback(null);
               } else {
                   callback(res.statusCode);
               }
           });
        req.on('error', (e) => {
                this.log.warn(`problem with request: ${e.message}`);
               callback(e);
         });

        req.write(xml);
        req.end();
        this.log.info(status);
    }
    this.log.info(status);
    
    
    
}

ReceiverVolume.prototype.setBrightness = function(newLevel, callback) {
    if(newLevel>this.maxVolume)newLevel = this.maxVolume;
    this.setControl('Volume', newLevel, callback);
}

ReceiverVolume.prototype.getBrightness = function(callback) {

     var status ='';

    if(!actualDevice["host"])
    {
          status =  "Sorry: Speakers not found yet. Try later..";
    }
    else
    {
          status = "Get Volume.";

        var xml = '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">'+
            '<s:Body>'+
            '<u:GetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">'+
            '<InstanceID>0</InstanceID>'+
            '<Channel>Master</Channel>'+
            '</u:GetVolume>'+
            '</s:Body>'+
            '</s:Envelope>';

        var http_options = {
            hostname: actualDevice["host"],
            port: actualDevice["port"], //a vérifier car pas sur.
            path: '/Control/LibRygelRenderer/RygelRenderingControl',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'soapaction': 'urn:schemas-upnp-org:service:RenderingControl:1#GetVolume',
                'Content-Length': xml.length
            }
        }

        var req = http.request(http_options,  function(res) {
            var data = ""
            res.setEncoding('utf8');
            res.on('data', function (chunk) { data += chunk });
            res.on('end', function() {
                 this.log.debug("finished request", "data length:", data.length);

                //console.log(data);
                if(data.indexOf("<CurrentVolume>") > -1 && data.indexOf("</CurrentVolume>")) {
                    var from = data.indexOf("<CurrentVolume>") +15;
                    var to = data.indexOf("</CurrentVolume>") ;
                    var currentVolume  =  data.substr(from,to-from);
                    this.log.info(currentVolume);
                    callback(null,currentVolume);
                }
            });
            res.on('error', (e) => {
                this.log.warn(`problem with response: ${e.message}`);
                callback(e, this.lastVolume);
            });
        });
       req.on('error', (e) => {
            this.log.warn(`problem with request: ${e.message}`);
           callback(e, this.lastVolume);
          //  callback(e);
        });
        req.write(xml);
        req.end();
        this.log.info(status);
    }
    this.log.info(status);
}

ReceiverVolume.prototype.getServices = function() {
    var lightbulbService = new Service.Lightbulb(this.name);
    
    lightbulbService
    .addCharacteristic(new Characteristic.Brightness())
    .on('set', this.setBrightness.bind(this))
    .on('get', this.getBrightness.bind(this));
    
    return [lightbulbService];
}


function parseUri (str) {
    var    o   = parseUri.options,
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


