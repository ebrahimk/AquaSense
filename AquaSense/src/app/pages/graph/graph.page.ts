/// <reference types='../../../../node_modules/@types/chart.js' />
import { Component, ViewChild, ElementRef, NgZone, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { Chart } from 'chart.js';
import { BLE } from '@ionic-native/ble/ngx';
import { DataService } from '../../data-service.service';
import * as moment from 'moment';
import { crc16modbus } from 'crc';

const UART_SERVICE = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const RX_CHARACTERISTIC = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const TX_CHARACTERISTIC = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
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
    private dataService: DataService
  ) {
    this.date = moment(new Date()).format('DD/MM/YYYY');
    this.device = this.dataService.myParam.data;
    this.ble.connect(this.device.id).subscribe(
      peripheral => this.onConnected(peripheral),
      peripheral => this.showAlert('Disconnected', 'Unable to Connect')     // navigate back to the home page
    );
    this.updateFreqEC = 200;
    this.timer.ms = 0;
    this.timer.sec = 0;
    this.timer.min = 0;
    this.timerId = setInterval(() => this.stopwatch(), 10);
  }

  @ViewChild('lineEC', { static: false }) lineCanvasEC: ElementRef;

  device: any;
  ecChart: Chart;
  peripheral: any = {};
  statusMessage: string;
  dataOut: string;
  dataIn: number;
  validData: boolean;
  timeStamp: any;
  dataRaw: string;
  date: any;
  updateFreqEC: number;
  timer: any = {};
  timerId: any;
  dataPt: any = {};
  count = -50;

  // tslint:disable-next-line: max-line-length
  // timerIdec = setInterval(() => this.addData(this.ecChart, this.ecChart.data.datasets[0], this.generateSinc(this.count)), 100);
  // tslint:disable-next-line: max-line-length
  // timerIdec2 = setInterval(() => this.addData(this.ecChart, this.ecChart.data.datasets[1], this.generateSinc(this.count)), 100);



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
      () => this.showAlert('Unexpected Error', 'Failed to subscribe for temperature changes')
    );
  }

  onDataChage(buffer: ArrayBuffer) {
    this.dataRaw = this.bytesToString(buffer);
    const chksum = this.verifyChksum(this.dataRaw);
    if (this.validData) {           // check for data type
      this.parsePacket(chksum);
    }
    /*
        this.ngZone.run(() => {
          this.temperature = data[0];
        });
    */
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
    this.dataIn = parseFloat(temp[0]);
    this.addData(this.ecChart, this.ecChart.data.datasets[0], this.dataIn);
    this.dataIn = parseFloat(temp[1]);
    this.addData(this.ecChart, this.ecChart.data.datasets[1], this.dataIn);
  }

  bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  // tslint:disable-next-line: use-lifecycle-interface
  ngAfterViewInit() {
    this.createGraph();
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
        //responsive: true,
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
    this.timerId = setInterval(() => this.stopwatch(), 10);
    this.dataOut = '!';
    this.sendData();
    this.ecChart.destroy();
    this.createGraph();
  }

  // pass a variable lenth of CSV values, each value in the array gets pushed  ot the corresponding graph
  addData(chart, dataset: any, data) {
    this.timeStamp = new Date(); // .getMilliseconds().toLocaleString()
    chart.data.labels.push(moment(this.timeStamp).format('h:mm:ss.SSS'));
    // chart.data.datasets[0].data.push(data);
    dataset.data.push(data);
    chart.update();
  }


  getRandomArbitrary(min, max) {
    return (Math.random() * (12 - 11) + 11).toFixed(4);
  }


  generateSinc(x) {
    this.count += .2;
    return ((Math.sin(x) * 3.14) / (3.14 * x));
  }


  setStatus(message) {
    console.log(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

  async showAlert(peripheral, notification) {
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
    this.ble.disconnect(this.peripheral.id).then(
      () => this.navCtrl.navigateRoot('/home'),
      () => this.navCtrl.navigateRoot('/home')
    );
  }

}
