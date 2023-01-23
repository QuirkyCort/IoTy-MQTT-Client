# IoTy-MQTT-Client
MQTT Client for the IoTy project

Try it here: https://quirkycort.github.io/IoTy-MQTT-Client/public

Notes:
* If using the mqtt.a9i.sg MQTT broker, topics must start with the username. ie. If your username is "foo", your topics can be "foo/bar", "foo/test", "foo/button", but not "button".
* The project is automatically saved to the MQTT broker as a retained message.
* Only one project is supported for each MQTT login account. If you want a second project, create another account.
* Your username and password is saved in your browser.
