const int pinServo = 9; // Hubungkan kabel oranye servo ke Pin 9
const int pinLED = 13;   // Hubungkan LED ke Pin 13 (melalui resistor)

// Variabel untuk menyimpan durasi pulsa terakhir (mulai dari 0 derajat = 1000 us)
int pulsaSekarang = 1000; 

void setup() {
  Serial.begin(9600);
  pinMode(pinServo, OUTPUT); 
  pinMode(pinLED, OUTPUT);   
  
  digitalWrite(pinLED, LOW);
  
  // Set servo ke posisi awal (0 derajat) saat dinyalakan
  for (int i = 0; i < 25; i++) {
    digitalWrite(pinServo, HIGH);
    delayMicroseconds(pulsaSekarang);
    digitalWrite(pinServo, LOW);
    delay(20);
  }
  
  Serial.println("=== Kontrol Servo Smooth & Jangkauan Besar ===");
  Serial.println("Ketik '1' -> Servo ke 180 derajat (MAKSIMAL) + LED NYALA (Smooth)");
  Serial.println("Ketik '2' -> Servo ke 0 derajat (MINIMAL) + LED MATI (Smooth)");
  Serial.println("Ketik '3' -> LED NYALA Saja");
  Serial.println("Ketik '4' -> LED MATI Saja");
}

void loop() {
  if (Serial.available() > 0) {
    char dataInput = Serial.read();
    
    // --- INPUT 1: SERVO KE 180 DERAJAT (PULSA 2000 us) + LED NYALA ---
    if (dataInput == '1') {
      Serial.println("Mengubah posisi ke 180 derajat & LED MENYALA (Smooth)...");
      // digitalWrite(pinLED, HIGH); 
      
      int targetPulsa = 2000; // 2000 us = 180 derajat
      
      // Menaikkan pulsa secara bertahap agar gerakan halus
      while (pulsaSekarang < targetPulsa) {
        pulsaSekarang += 10; // Naikkan 10 mikrodetik setiap langkah (ubah angka ini untuk mengatur kecepatan)
        if (pulsaSekarang > targetPulsa) pulsaSekarang = targetPulsa;
        
        // Kirim sinyal ke servo
        digitalWrite(pinServo, HIGH);
        delayMicroseconds(pulsaSekarang);
        digitalWrite(pinServo, LOW);
        delay(20); // Jeda standar servo
      }
    } 
    
    // --- INPUT 2: SERVO KE 0 DERAJAT (PULSA 1000 us) + LED MATI ---
    else if (dataInput == '2') {
      Serial.println("Mengubah posisi ke 0 derajat & LED MATI (Smooth)...");
      // digitalWrite(pinLED, LOW);
      
      int targetPulsa = 1000; // 1000 us = 0 derajat
      
      // Menurunkan pulsa secara bertahap agar gerakan halus
      while (pulsaSekarang > targetPulsa) {
        pulsaSekarang -= 10; // Turunkan 10 mikrodetik setiap langkah
        if (pulsaSekarang < targetPulsa) pulsaSekarang = targetPulsa;
        
        // Kirim sinyal ke servo
        digitalWrite(pinServo, HIGH);
        delayMicroseconds(pulsaSekarang);
        digitalWrite(pinServo, LOW);
        delay(20);
      }
    }
    
    // --- INPUT 3: HANYA NYALAKAN LED ---
    else if (dataInput == '3'){
      Serial.println("Hanya Menyalakan LED...");
      digitalWrite(pinLED, HIGH);
    }
    
    // --- INPUT 4: HANYA MATIKAN LED ---
    else if (dataInput == '4'){
      Serial.println("Hanya Mematikan LED...");
      digitalWrite(pinLED, LOW);
    }
  }
}