# Homebridge-Devialet-Bridge

homebridge-plugin for Devialet Phantom with Dialog. 
 `` Inspire from the initial homebridge-marantz-volume homebridge plugin ( https://github.com/stfnhmplr/homebridge-marantz-volume ) and phantom-bridge ( https://github.com/da2001/phantom-bridge ): Thanks to them, we'll have just a few work to do in order to manage Phantom devialet Volume via Dialog. `` 
 
# Prerequisite 
1) install HomeBridge :  `` sudo npm install -g homebridge `` 
2) In order to the Plugin to work, please enable in the Spark application UPNP on your Dialog. please follow this link : 
https://help.devialet.com/hc/en-us/articles/115004436969-How-Can-I-Use-UPNP-with-my-Phantom-

( It should also work with a Solo Phantom Setup with Upnp enabled, no tries have been made yet. Any Feedback will be updated to ths setup ).
 

# Installation

Follow the instruction in NPM for the homebridge server installation. The plugin is published through NPM and should be installed "globally" by typing:
 
 `` sudo npm install -g homebridge-devialet-bridge `` 
 

# Configuration

Add as an accessory by editing the homebridge config.json file.
config.json

Example:

  ```
  "description": "This is an example configuration file for homebridge Devialet Phantom Dialog plugin, 
  host is meant to specify the Ip adress of your dialog",
  "hint": "Always paste into jsonlint.com validation page before starting your homebridge, saves a lot of frustration",
  "accessories": [
       {
         "accessory":      "devialet-bridge",
         "name":           "Phantom Living Room",
         "host":           "192.168.1.15",
         "maxVolume":      50,
         "defaultVolume": 35
       }
    ]
```


# Notes

  - Accessory : must always be devialet-bridge
  - Name :  any name you want to
  - host : must be the ip adress of your Phantom Bridge (static ip, or force by router)
  - maxVolume : number between 1 to 100 but please keep in mind that 100 is realy loud an siri can misunderstand something 
  - defaultVolume : the volume you wnat when turn on the devialet ; number between 1 to 100 but please keep in mind that 100 is realy loud.

 ` If you are interested in setting the volume of your Phantom(s) with Siri, Only remember to not tell Siri "Set the light in the Living room to 100 %" ;)

 `` We also suggest, in homekit, to put your Devialet Light switch in a different Room in order to not have bad surprise setting something like "Turn on all light in the Living Room" :)

# Credits

 `` homebridge-devialet-bridge was written by GeekBrothers (Jeyremy and the contribution of Steven)``

 `` homebridge-marantz-volume was written by Robert Vorthman (thanks!) phantom-bridge was written by DA2001 ( thanks ! )``
 
 
 ## Donation
If this project help you, you can give us a cup of coffee :) 

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.me/jeyremy)

 
