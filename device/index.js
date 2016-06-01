'use strict'

var fs = require('fs');

var raspicam = require('raspicam');
var Client = require('azure-iot-device').Client;
var Amqp = require('azure-iot-device-amqp').Amqp;

var connectionString = '<DEVICE CONNECTION STRING';
var client = Client.fromConnectionString(connectionString, Amqp);

client.open(function(err) {
  if(err) {
    console.error('Could not connect to Azure IoT Hub');
    process.exit(1);
  } else {
    client.on('message', function() {
      var opts = {
        mode: "photo",
        output: "%d.jpg",
        encoding: "jpg",
        quality: "90"
      };

      var camera = new raspicam(opts);

      camera.on('start', function() {
        console.log('camera started');
      });

      camera.on('stop', function() {
        console.log('camera stopped');
      });

      camera.on('read', function(err, timestamp, filename) {
        console.log('new picture: ' + timestamp + ' -> ' + filename);
        if(filename.endsWith('~')) {
          console.log('temporary picture: ignoring.');
        } else {
          camera.stop();
          sendImage(filename);
        }
      });

      camera.start();
    });

    function sendImage(filename) {
      fs.stat(filename, function (err, fileStats) {
        if(err) {
          console.error('Could not get file stats: ' + err.message);
        } else {
          var filestream = fs.createReadStream(filename);
          client.uploadToBlob('rpi_pic.jpg', filestream, fileStats.size, function (err) {
            if(err) {
            } else {
              console.log('Successfully uploaded ' + filename);
            }
          });
        }
      }); 
    }
  }
});
