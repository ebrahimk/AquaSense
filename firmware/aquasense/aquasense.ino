/*
 * AquaSense
 * University of Zurich and  Oregon State University OPEnS Lab
 * Summer 2k19
 * Authors: Jose Manuel Lopez Alcala & Kamron Ebrahimi
 * 
 */

#include <Arduino.h>
#include <SPI.h>
#include "Adafruit_BLE.h"
#include "Adafruit_BluefruitLE_SPI.h"
#include "Adafruit_BluefruitLE_UART.h"
#include <math.h>
#include <CRC.h>        // MODEBUS 16-bit checksum
#include "DFRobot_EC.h"
#include <m0EEPROM.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "BluefruitConfig.h"

#if SOFTWARE_SERIAL_AVAILABLE
#include <SoftwareSerial.h>
#endif

#define FACTORYRESET_ENABLE 1
#define MINIMUM_FIRMWARE_VERSION "0.6.6"
#define MODE_LED_BEHAVIOUR "MODE"
#define VBATPIN A7
#define ONE_WIRE_BUS 11 
#define EC_PIN A0


Adafruit_BluefruitLE_SPI ble(BLUEFRUIT_SPI_CS, BLUEFRUIT_SPI_IRQ, BLUEFRUIT_SPI_RST);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
DeviceAddress insideThermometer;

unsigned long EC_timer = millis();
uint16_t EC_timeout = 200;
bool logData;
float voltage,ecValue,temperature = 25;
DFRobot_EC ec;
int count = 0;

void setup(void)
{
  Serial.begin(115200);
  if (!ble.begin(VERBOSE_MODE))
  {
    error(F("Couldn't find Bluefruit, make sure it's in CoMmanD mode & check wiring?"));
  }

  if (FACTORYRESET_ENABLE)
  {
    /* Perform a factory reset to make sure everything is in a known state */
    Serial.println(F("Performing a factory reset: "));
    if (!ble.factoryReset())
    {
      error(F("Couldn't factory reset"));
    }
  }
  

  /* Disable command echo from Bluefruit */
  ble.echo(false);
  ble.sendCommandCheckOK("AT+GAPDEVNAME=AquaSense");
  Serial.println("Requesting Bluefruit info:");
  ble.info();
  ble.verbose(false); 

  Serial.println(F("******************************"));

  // LED Activity command is only supported from 0.6.6
  if (ble.isVersionAtLeast(MINIMUM_FIRMWARE_VERSION))
  {
    // Change Mode LED Activity
    ble.sendCommandCheckOK("AT+HWModeLED=" MODE_LED_BEHAVIOUR);
  }

  // Set module to DATA mode
  ble.setMode(BLUEFRUIT_MODE_DATA);

  // Set data logging to false
  logData = false;

  //Start  the Electrical Conductivity sensor
  ec.begin();

  //Start up the Temeperature sensor
  sensors.begin();
  sensors.getAddress(insideThermometer,0);

  // set the resolution to 12 bit (Each Dallas/Maxim device is capable of several different resolutions)
  sensors.setResolution(insideThermometer, 12);
}

void loop(void)
{
  char n, dataOut[BUFSIZE + 1], dataIn[1028];
  clearMemory(dataOut);
  clearMemory(dataIn);
  
  // Check to send EC data
  if (millis() - EC_timer >= EC_timeout && logData)
  {
    dtostrf(readEC(), 4, 4, dataOut);
    append(dataOut, '#');
    dtostrf(readTemperature(), 3, 3, dataOut + strlen(dataOut));
    addChksum(dataOut);
    printData(count, dataOut);
    ble.println(dataOut);
    count++;
    EC_timer = millis();
  }

  // Echo received data
  if (ble.available())
  {
    while (ble.available())
    {
      char c = ble.read();
      append(dataIn, c);
    }
    switch (dataIn[0])
    {
    case '!': // restart
      logData = true;
      break;
    case '#': // stop
      logData = false;
      break;
    case 'E': // Electrical conductivity update rate
      sscanf(dataIn + 1, "%d", &EC_timeout);
      Serial.print("NEW TIMEOUT EC: ");
      Serial.println(EC_timeout);
      break;
    }
  }
  ec.calibration(voltage,temperature);  // calibration process by Serail CMD
}

void error(const __FlashStringHelper *err)
{
  Serial.println(err);
  while (1)
    ;
}

double getSinc(double x)
{
  return ((sin(x) * 3.14) / (3.14 * x));
}

void append(char s[], char c)
{
  int len = strlen(s);
  s[len] = c;
  s[len + 1] = '\0';
}

char *dtostrf(double val, signed char width, unsigned char prec, char *sout)
{
  char fmt[20];
  sprintf(fmt, "%%%d.%df", width, prec);
  sprintf(sout, fmt, val);
  return sout;
}

void addChksum(char *data)
{
  uint16_t chksum = CRC::crc16((uint8_t *)data, strlen(data));
  Serial.print("Checksum: ");
  Serial.println(chksum, HEX);
  strcat(data, "*");
  sprintf(data + strlen(data), "%x", chksum);
}

byte stringChecksum(char *s)
{
  byte c = 0;
  while (*s != '\0')
    c ^= *s++;
  return c;
}

float readEC()
{
  voltage = analogRead(EC_PIN)/1024.0*3300;  // read the voltage
  temperature = readTemperature();  // read your temperature sensor to execute temperature compensation
  ecValue =  ec.readEC(voltage,temperature);  // convert voltage to EC with temperature compensation
  return ecValue;
}

float readTemperature()
{
  sensors.requestTemperatures(); 
  float tempC = sensors.getTempCByIndex(0);
  return tempC;
}


void clearMemory(char *str)
{
  memset(str, '\0', sizeof(char) * strlen(str));
}

void printData(int count, char *data)
{
  Serial.print(count);
  Serial.print(": ");
  Serial.println(data);
}