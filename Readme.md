# Homebridge-Devialet-Bridge

homebridge-plugin for Devialet Phantom with Dialog. Inspire from the initial homebridge-marantz-volume homebridge plugin ( https://github.com/stfnhmplr/homebridge-marantz-volume ) and phantom-bridge ( https://github.com/da2001/phantom-bridge ): Thanks to them, we'll have just a few work to do in order to manage Phantom devialet Volume via Dialog.


Installation

Follow the instruction in NPM for the homebridge server installation. The plugin is published through NPM and should be installed "globally" by typing:

sudo npm install -g homebridge-devialet-bridge


Configuration

config.json

Example:

{
  "bridge": {
      "name": "Homebridge",
      "username": "CC:22:3D:E3:CE:51",
      "port": 51826,
      "pin": "031-45-154"
  },
  "description": "This is an example configuration file for homebridge Devialet Phantom Dialog plugin, host is meant to specify the Ip adress of your dialog",
  "hint": "Always paste into jsonlint.com validation page before starting your homebridge, saves a lot of frustration",
  
  "accessories": [
      {
          "accessory": "devialet-bridge",
          "name": "Phantom",
          "host": "192.168.1.99",
          "maxVolume": 50
        
      }
  ]
}

notes

# You have to specify the Ip adress of your Dialog ( "Host" ).
# In order to the Plugin to work, please enable in the Spark application UPNP on your Dialog.

If you are interested in setting the volume of your Phantom(s) with Siri, Only remember to not tell Siri "Set the light in the Living room to 100 %" ;)
We also suggest, in homekit, to put your Devialet Light switch in a different Room in order to not have bad surprise setting something like "Turn on all light in the Living Room" :)

homebridge-devialet-bridge was written by Jeremy and the contribution of Steven 
homebridge-marantz-volume was written by Robert Vorthman (thanks!) phantom-bridge was written by DA2001 ( thanks ! )
