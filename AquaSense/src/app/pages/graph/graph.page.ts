import { Component, ViewChild, ElementRef, NgZone, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { Chart } from 'chart.js';
import { BLE } from '@ionic-native/ble/ngx';
import { DataService } from '../../data-service.service';
import * as moment from 'moment';
import { crc16modbus } from 'crc';
import { Plugins, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
import { Events } from '@ionic/angular';

const { Filesystem } = Plugins;

const UART_SERVICE = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const RX_CHARACTERISTIC = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const TX_CHARACTERISTIC = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
const logsPath = 'AquaSense/Logs/';
// tslint:disable-next-line: max-line-length

@Component({
  selector: 'app-graph',
  templateUrl: './graph.page.html',
  styleUrls: ['./graph.page.scss'],
})
export class GraphPage /*implements OnInit*/ {

  constructor(public navCtrl: NavController,
              private ble: BLE,
              private toastCtrl: ToastController,
              private ngZone: NgZone,
              private dataService: DataService,
              public events: Events
  ) {
    // edit this line to check if it is logged data or not
    this.param.isLive = this.dataService.myParam.type;    // determines if the data on the graph was loaded or not
    this.init();
  }

  @ViewChild('lineEC', { static: false }) lineCanvasEC: ElementRef;

  device: any;
  param: any = {};  // parameters passed to the module, device should be nested under this as well
  loadContents: any = {};

  ecChart: Chart;
  peripheral: any = {};
  dataOut: string;
  dataIn: any = {};
  validData: boolean;
  timeStamp: any;
  dataRaw: string;
  date: any;
  updateFreqEC: number;
  timer: any = {};
  timerId: any;
  dataPt: any = {};
  logger: any = {};
  count = -50;

  // tslint:disable-next-line: max-line-length
  // timerIdec = setInterval(() => this.addData2(this.ecChart, this.ecChart.data.datasets, this.generateSinc(this.count)), 100);
  // tslint:disable-next-line: max-line-length
  // timerIdec2 = setInterval(() => this.addData(this.ecChart, this.ecChart.data.datasets[1], this.generateSinc(this.count)), 100);

  init() {
    if (this.param.isLive) {
      this.device = this.dataService.myParam.data;
      this.date = moment(new Date()).format('DD/MM/YYYY');
      this.ble.connect(this.device.id).subscribe(
        peripheral => this.onConnected(peripheral),
        peripheral => this.showAlert('Unable to Connect')      // navigate back to the home page
      );
      this.updateFreqEC = 200;
      this.timer.ms = 0;
      this.timer.sec = 0;
      this.timer.min = 0;
      this.timerId = setInterval(() => this.stopwatch(), 10);
      this.logger.isLogging = false;
      this.logger.curFile = '';
      this.logger.color = 'secondary';
    } else {  // the graph page will load logged data file
      this.param.stamp = this.dataService.myParam.stamp;
      this.param.data = this.dataService.myParam.data;
      console.log('here');
    }
  }

  parseLog() {
    const temp = this.param.data.split('\n');
    temp.forEach(element => {
      const data = element.split(',');
      this.ecChart.data.labels.push(data[0]);
      this.ecChart.data.datasets[0].data.push(parseFloat(data[1]));
      this.ecChart.data.datasets[1].data.push(parseFloat(data[2]));
    });
    this.ecChart.update();
  }

  addData2(chart, datasets: any, data) {
    this.timeStamp = new Date();
    chart.data.labels.push(moment(this.timeStamp).format('h:mm:ss.SSS'));
    datasets[0].data.push(data);
    datasets[1].data.push(data * 4);
    this.count += .2;
    chart.update();
  }


  stopwatch() {
    this.timer.ms++;
    this.timer.ms %= 100;
    if (this.timer.ms === 0) {
      this.timer.sec++;
      this.timer.sec %= 60;
      if (this.timer.sec === 0) {
        this.timer.min++;
      }
    }
  }

  onConnected(peripheral) {
    // Subscribe to the observable for notifications
    this.peripheral = peripheral;
    this.ble.startNotification(this.peripheral.id, UART_SERVICE, RX_CHARACTERISTIC).subscribe(
      data => this.onDataChage(data),
      () => this.showAlert('Failed to subscribe for temperature changes')
    );
  }

  onDataChage(buffer: ArrayBuffer) {
    this.dataRaw = this.bytesToString(buffer);
    const chksum = this.verifyChksum(this.dataRaw);
    if (this.validData) {           // check for data type
      this.parsePacket(chksum);
    }
  }

  verifyChksum(buffer: string) {
    const chksum = buffer.split('*');
    if (crc16modbus(chksum[0]) === parseInt(chksum[1], 16)) {
      this.validData = true;
      return chksum[0];
    }
    this.validData = false;
    return '';
  }

  parsePacket(buffer: string) {
    const temp = buffer.split('#');
    this.dataIn.ec = parseFloat(temp[0]);
    this.dataIn.temp = parseFloat(temp[1]);
    this.addData(this.ecChart, this.ecChart.data.datasets, this.dataIn);
  }

  // pass a variable lenth of CSV values, each value in the array gets pushed  ot the corresponding graph
  addData(chart, datasets: any, data) {
    this.timeStamp = new Date();
    const stamp = moment(this.timeStamp).format('h:mm:ss.SSS');
    chart.data.labels.push(stamp);
    datasets[0].data.push(data.ec);
    datasets[1].data.push(data.temp);
    if (this.logger.isLogging) {
      this.fileAppend(logsPath + this.logger.curFile, stamp + ',' + data.ec + ',' + data.temp + '\n');
    }
    chart.update();
  }

  bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  // tslint:disable-next-line: use-lifecycle-interface
  ngAfterViewInit() {
    this.createGraph();
    if (!this.param.isLive) {
      this.parseLog();
    }
  }

  createGraph() {
    this.ecChart = new Chart(this.lineCanvasEC.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Electrical Conductivity',
            yAxisID: 'A',
            fill: true,
            lineTension: 0.1,
            backgroundColor: 'rgba(75,192,192,.1)',
            borderColor: '#7fcdff',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'round',
            pointBorderColor: '#7fcdff',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: 'rgba(216,240,255,.4)',
            pointHoverBorderColor: '#7fcdff',
            pointHoverBorderWidth: 2,
            pointRadius: 2,
            pointHitRadius: 10,
            data: [],
            spanGaps: false
          },
          {
            label: 'Temperature',
            yAxisID: 'B',
            fill: true,
            lineTension: 0.1,
            backgroundColor: 'rgba(255,46,46,0.1)',
            borderColor: '#FF776B',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'round',
            pointBorderColor: '#FF776B',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: 'rgba(255,46,46,0.4)',
            pointHoverBorderColor: '#FF776B',
            pointHoverBorderWidth: 2,
            pointRadius: 2,
            pointHitRadius: 10,
            data: [],
            spanGaps: false
          }
        ]
      },
      options: {
        // responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: true
        },
        title: {
          display: false,
          text: 'Data'
        },
        scales: {
          yAxes: [{
            id: 'A',
            type: 'linear',
            position: 'left',
            scaleLabel: {
              display: true,
              labelString: 'Electrical Conductivity (1/Ω)'
            }
          }, {
            id: 'B',
            type: 'linear',
            position: 'right',
            scaleLabel: {
              display: true,
              labelString: 'Temperature (˚C)'
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time (hh:mm:ss.sss)'
            }
          }]
        },
        onClick: (event) => { this.clickHandler(event); }
      }
    });
  }

  // Event listener for accessing individual data points
  clickHandler(evt) {
    // @ts-ignore
    const firstPoint: MetaData = this.ecChart.getElementAtEvent(evt)[0];
    if (firstPoint) {
      this.dataPt.label = this.ecChart.data.labels[firstPoint._index];
      this.dataPt.value = this.ecChart.data.datasets[firstPoint._datasetIndex].data[firstPoint._index];
      if (firstPoint._datasetIndex === 0) {
        this.dataPt.type = 'Electrical Conductivity (1/Ω)';
      } else if (firstPoint._datasetIndex === 1) {
        this.dataPt.type = 'Temperature (˚C)';
      }
    }
  }

  stop() {
    // clearInterval(this.timerIdec);
    // clearInterval(this.timerIdec2);
    clearInterval(this.timerId);
    this.dataOut = '#';
    this.sendData();
  }

  start() {
    this.timer.ms = 0;
    this.timer.sec = 0;
    this.timer.min = 0;
    clearInterval(this.timerId);
    this.timerId = setInterval(() => this.stopwatch(), 10);
    this.dataOut = '!';
    this.sendData();
    this.ecChart.destroy();
    this.createGraph();
  }

  getRandomArbitrary(min, max) {
    return (Math.random() * (12 - 11) + 11).toFixed(4);
  }


  generateSinc(x) {
    this.count += .2;
    return ((Math.sin(x) * 3.14) / (3.14 * x));
  }

  async showAlert(notification) {
    const toast = await this.toastCtrl.create({
      message: notification,
      duration: 3000,
      position: 'middle'
    });
    await toast.present();
  }


  str2ab(str) {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  // prepend the attribute you want to change the logging updates of
  changeRateEC() {
    const temp = 1001 - this.updateFreqEC;
    console.log(temp);
    // console.log(temp);
    this.dataOut = 'E' + temp.toString();
    this.sendData();
  }

  changeRateTemp() {
    const temp = 1001 - this.updateFreqEC;
    this.dataOut = 'T' + temp.toString();
    this.sendData();
  }

  sendData() {
    const buffer = this.str2ab(this.dataOut);
    this.ble.write(this.peripheral.id, UART_SERVICE, TX_CHARACTERISTIC, buffer).then();
  }

  disconnect() {
    this.logger.isLogging = false;
    this.ble.disconnect(this.peripheral.id).then(
      () => this.navCtrl.navigateRoot(''),
      () => this.navCtrl.navigateRoot('')
    );
  }

  log() {
    this.logger.isLogging = !this.logger.isLogging;
    if (this.logger.isLogging) {      // change color of button to RED TODO
      this.logger.color = 'warning';
      const date = moment(new Date());
      this.logger.curFile = moment(date.format('DD-MM-YYYY_h:mm:ss_a') + '.txt');
      this.showAlert('Logging Data at ' + date.format('h:mm:ss_a'));
      this.fileWrite(logsPath + this.logger.curFile);
      this.events.publish('logs', 'data');
    } else {
      this.showAlert('Log Saved');
      this.logger.color = 'secondary';
    }
  }

  // ###########################################

  fileWrite(file: string) {
    try {
      Filesystem.writeFile({
        path: file,
        data: '',
        directory: FilesystemDirectory.Documents,
        encoding: FilesystemEncoding.UTF8
      });
    } catch (e) {
      console.error('Unable to write file', e);
    }
  }

  async fileRead() {
    const contents = await Filesystem.readFile({
      path: 'AquaSense/Logs',
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8
    });
    console.log(contents);
  }

  async fileAppend(file: string, reading: string) {
    await Filesystem.appendFile({
      path: file,
      data: reading,
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8
    });
  }

  async fileDelete() {
    await Filesystem.deleteFile({
      path: 'secrets/text.txt',
      directory: FilesystemDirectory.Documents
    });
  }

  async mkdir() {
    try {
      const ret = await Filesystem.mkdir({
        path: 'secrets',
        directory: FilesystemDirectory.Documents,
        createIntermediateDirectories: false // like mkdir -p
      });
    } catch (e) {
      console.error('Unable to make directory', e);
    }
  }

  async rmdir() {
    try {
      const ret = await Filesystem.rmdir({
        path: 'secrets',
        directory: FilesystemDirectory.Documents
      });
    } catch (e) {
      console.error('Unable to remove directory', e);
    }
  }

  async stat() {
    try {
      const ret = await Filesystem.stat({
        path: 'secrets/text.txt',
        directory: FilesystemDirectory.Documents
      });
    } catch (e) {
      console.error('Unable to stat file', e);
    }
  }

  async rename() {
    try {
      const ret = await Filesystem.rename({
        from: 'text.txt',
        to: 'text2.txt',
        directory: FilesystemDirectory.Documents
      });
    } catch (e) {
      console.error('Unable to rename file', e);
    }
  }
}
