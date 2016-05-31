# fileuploaddemo
Demo of the file upload feature of Azure IoT Hub

In the `device` folder, a simplistic node application that runs on a Raspberry PI with a camera module.
When the device receives a message (any message, content doesn't matter), it takes a picture and uploads it.

In the `service` folder, a simple website that uses the Node Service SDK to listen for file notifications, and serves them to a webpage.
