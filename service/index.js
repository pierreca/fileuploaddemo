"use strict";

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var storage = require('azure-storage');
var iothub = require('azure-iothub');
var fs = require('fs');

var iothubConnStr = process.env.IOTHUB_CONNECTION_STRING;
var storageConnStr = process.env.STORAGE_CONNECTION_STRING;

var iothubClient = iothub.Client.fromConnectionString(iothubConnStr);

iothubClient.open(function() {
  iothubClient.getFileNotificationReceiver(function(err, receiver) {
    if(err) {
      console.error('Could not connect to iothub file upload notifications endpoint: ' + err.constructor.name + ': ' + err.message);
      process.exit(1);
    } else {
      receiver.on('message', function(msg) {
        var notif = JSON.parse(msg.getData().toString());
        var blobService = storage.createBlobService(storageConnStr);

        var startDate = new Date();
        var expiryDate = new Date(startDate);
        expiryDate.setMinutes(startDate.getMinutes() + 100);
        startDate.setMinutes(startDate.getMinutes() - 100);

        var sharedAccessPolicy = {
          AccessPolicy: {
            Permissions: storage.BlobUtilities.SharedAccessPermissions.READ,
            Start: startDate,
            Expiry: expiryDate
          },
        };

        var token = blobService.generateSharedAccessSignature('sdkteamcontainer', notif.blobName, sharedAccessPolicy);
        var sasUrl = notif.blobUri + '?' + token;
        
        io.emit('fileNotification', sasUrl);
      });
    }
  })
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('connection');
  socket.on('takePicture', function(deviceId){
    console.log('Take a picture with device: ' + deviceId);
    iothubClient.send(deviceId, 'takePicture', function(err, result) {
      if (err) {
        console.error('could not send message');
      } else {
        console.log(result.constructor.name);
      }
    });
  });
}); 

http.listen(3000, function(){
  console.log('listening on *:3000');
});