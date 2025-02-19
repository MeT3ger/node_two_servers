// подключение к серверу
telnet localhost 8080 (или 8089)

// в каком виде отправлять запрос
{"type":"set", "key":"some_key_in_storage", "value":"some_value"}
{"type":"get", "key":"some_key_in_storage"}