#include <Arduino.h>
#include <SPI.h>
#include "Adafruit_BLE.h"
#include "Adafruit_BluefruitLE_SPI.h"
#include "Adafruit_BluefruitLE_UART.h"
#include <math.h>
#include <CRC.h> // MODEBUS 16-bit checksum

#include "BluefruitConfig.h"

#if SOFTWARE_SERIAL_AVAILABLE
#include <SoftwareSerial.h>
#endif

#define FACTORYRESET_ENABLE 1
#define MINIMUM_FIRMWARE_VERSION "0.6.6"
#define MODE_LED_BEHAVIOUR "MODE"

Adafruit_BluefruitLE_SPI ble(BLUEFRUIT_SPI_CS, BLUEFRUIT_SPI_IRQ, BLUEFRUIT_SPI_RST);

// A small helper
void error(const __FlashStringHelper *err)
{
  Serial.println(err);
  while (1)
    ;
}

unsigned long EC_timer = millis();
uint16_t EC_timeout = 200;
unsigned long temp_timer = millis();

bool logData;
double x = 0;
int count = 0;
double test = 0;

/**************************************************************************/
/*!
    @brief  Sets up the HW an the BLE module (this function is called
            automatically on startup)
*/
/**************************************************************************/
void setup(void)
{
  while (!Serial)
    ; // required for Flora & Micro
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

  Serial.println("Requesting Bluefruit info:");
  ble.info();
  ble.verbose(false); // debug info is a little annoying after this point!
  while (!ble.isConnected())
  {
    delay(500);
  }

  Serial.println(F("******************************"));

  // LED Activity command is only supported from 0.6.6
  if (ble.isVersionAtLeast(MINIMUM_FIRMWARE_VERSION))
  {
    // Change Mode LED Activity
    Serial.println(F("Change LED activity to " MODE_LED_BEHAVIOUR));
    ble.sendCommandCheckOK("AT+HWModeLED=" MODE_LED_BEHAVIOUR);
  }

  // Set module to DATA mode
  Serial.println(F("Switching to DATA mode!"));
  ble.setMode(BLUEFRUIT_MODE_DATA);

  Serial.println(F("******************************"));

  logData = true;
}

void loop(void)
{
  char n, dataOut[BUFSIZE + 1], dataIn[1028];
  clearMemory(dataOut);
  clearMemory(dataIn);

  if (millis() - EC_timer >= EC_timeout && logData)
  {
    clearMemory(dataOut);
    dtostrf(getSinc(x), 6, 6, dataOut);
    addChksum(dataOut);
    printData(count, dataOut);
    count++;
    x += .2;
    ble.println(dataOut);
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
    case 'T': // Temperature update rate
      break;
    }
  }
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
