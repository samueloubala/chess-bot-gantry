/****
Controls piece picker
"A" = Actuator
"M" = Magnet
****/

void setup() {
  pinMode (2, OUTPUT);
  pinMode (3, OUTPUT);
  pinMode (4, OUTPUT);
  digitalWrite(2, HIGH); //Defaults Relay 1 to OFF
  digitalWrite(3, HIGH); //Defaults Relay 2 to OFF
  digitalWrite(4, HIGH); //Defaults Relay 4 to OFF
  Serial.begin(115200);
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\r\n');
    executeCommand(command);
  }
  delay(10);
}

void executeCommand(String command) {
  command.trim(); // Remove leading and trailing whitespace
  if (command == "A_UP") {
    digitalWrite(2, HIGH);
    digitalWrite(3, LOW);
    delay(1660);
    digitalWrite(2, HIGH);
    digitalWrite(3, HIGH);
  } 
  
  else if (command == "A_DOWN") {
    digitalWrite(2, LOW);
    digitalWrite(3, HIGH);
    delay(1650);
    digitalWrite(2, HIGH);
    digitalWrite(3, HIGH);
  } 
  
  else if (command == "M_ON") {
    digitalWrite(4, LOW);
  }
  
  else if (command == "M_OFF") {
    digitalWrite(4, HIGH);
  }
 
  else {
    Serial.println("UNKNOWN COMMAND RECEIVED:");
    Serial.println(command);
    Serial.println("--");
  }
}
