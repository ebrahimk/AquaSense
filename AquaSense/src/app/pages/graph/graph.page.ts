import { Component, ViewChild, ElementRef, NgZone, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { Chart } from 'chart.js';
import { BLE } from '@ionic-native/ble/ngx';
import { DataService } from '../../data-service.service';

const UART_SERVICE = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const RX_CHARACTERISTIC = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const TX_CHARACTERISTIC = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';

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
    this.device = this.dataService.myParam.data;
    console.log('attempting to connect');
    this.ble.connect(this.device.id).subscribe(
      peripheral => this.onConnected(peripheral),
      peripheral => this.showAlert('Disconnected', 'Unable to Connect')     // navigate back to the home page
    );
  }
  @ViewChild('lineEC', { static: false }) lineCanvasEC: ElementRef;
  @ViewChild('lineTemp', { static: false }) lineCanvasTemp: ElementRef;

  device: any;
  ecChart: Chart;
  tempChart: Chart;
  peripheral: any = {};
  count = 0;
  temperature: number;
  conductivity: number;
  statusMessage: string;
  dataOut: string;
  dataIn: number;
  dataRaw: string;
  validData: boolean;

  // timerIdec = setInterval(() => this.addData(this.ecChart, this.count, this.generateSinc(this.count)), 1);
  // timerIdtemp = setInterval(() => this.addData(this.tempChart, this.count, this.generateSinc(this.count)), 1);
  /* IDEAS:
    - Increase update rate with slider
    - Increase/decrease resolution
    - Battery life indicator
  */

  onConnected(peripheral) {
    // Subscribe to the observable for notifications
    this.peripheral = peripheral;
    this.ble.startNotification(this.peripheral.id, UART_SERVICE, RX_CHARACTERISTIC).subscribe(
      data => this.onTemperatureChange(data),
      () => this.showAlert('Unexpected Error', 'Failed to subscribe for temperature changes')
    );
  }


  onTemperatureChange(buffer: ArrayBuffer) {
    this.dataRaw = this.bytesToString(buffer);
    this.verifyChksum(this.dataRaw);
    if (this.validData) {
      const chksum = this.dataRaw.split('*');
      this.dataIn = parseFloat(chksum[0]);
      this.addData(this.ecChart, this.count, this.dataIn);
      this.addData(this.tempChart, this.count, this.dataIn);
      this.count = this.count + 1;
    }
    /*
        this.ngZone.run(() => {
          this.temperature = data[0];
        });
    */
  }

  verifyChksum(buffer: string) {
    const chksum = buffer.split('*');
    let cs = 0;
    for (const char of chksum[0]) {
      // tslint:disable-next-line: no-bitwise
      cs ^= char.charCodeAt(0);
    }
    if (cs === parseInt(chksum[1], 16)) {
      this.validData = true;
      return;
    }
    this.validData = false;
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
            // label: 'Electrical Conductivity',
            fill: true,
            lineTension: 0.1,
            backgroundColor: 'rgba(75,192,192,.1)',
            borderColor: 'rgba(75,192,192,1)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'round',
            pointBorderColor: 'rgba(75,192,192,1)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(75,192,192,1)',
            pointHoverBorderColor: 'rgba(75,192,192,1))',
            pointHoverBorderWidth: 2,
            pointRadius: 2,
            pointHitRadius: 10,
            data: [],
            spanGaps: false
          }
        ]
      },
      options: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Electrical Conductivity'
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
            },
            scaleLabel: {
              display: true,
              labelString: 'Electrical Conductivity (1/Ω)'
            }
          }],
          xAxes: [{
            ticks: {
              beginAtZero: true,
              callback(tick) { return tick.toFixed(2); }
            },
            scaleLabel: {
              display: true,
              labelString: 'Time (s)'
            }
          }]
        }
      }
    });

    this.tempChart = new Chart(this.lineCanvasTemp.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            fill: true,
            lineTension: 0.1,
            backgroundColor: 'rgba(255,46,46,0.1)',
            borderColor: 'rgba(255,46,46,0.4)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'round',
            pointBorderColor: 'rgba(255,46,46,0.4)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(255,46,46,0.4)',
            pointHoverBorderColor: 'rgba(255,46,46,0.4)',
            pointHoverBorderWidth: 2,
            pointRadius: 2,
            pointHitRadius: 10,
            data: [],
            spanGaps: false
          }
        ]
      },
      options: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Temperature'
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            },
            scaleLabel: {
              display: true,
              labelString: 'Temperature (˚C)'
            }
          }],
          xAxes: [{
            ticks: {
              beginAtZero: true,
              callback(tick) { return tick.toFixed(2); }
            },
            scaleLabel: {
              display: true,
              labelString: 'Time (s)'
            }
          }]
        }
      }
    });
  }

  stop() {
    // clearInterval(this.timerIdec);
    // clearInterval(this.timerIdtemp);
  }

  start() {
    this.tempChart.destroy();
    this.ecChart.destroy();
    this.count = 0; // replace with bluetooth data pipeline
    this.createGraph();
  }

  addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data);
    chart.update();
  }
  getRandomArbitrary(min, max) {
    return (Math.random() * (12 - 11) + 11).toFixed(4);
  }

  generateSinc(x) {
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


  sendData() {
    // console.log(this.dataOut);
    const buffer = this.str2ab(this.dataOut);
    this.ble.write(this.peripheral.id, UART_SERVICE, TX_CHARACTERISTIC, buffer).then(
      () => this.showAlert('Success', 'Data sent'),
      e => this.showAlert('Unexpected Error', 'Error sending data')
    );
  }

}




/*
ngOnInit(): void {
  this.device = this.dataService.myParam.data;
  console.log('ttempting to connect');
  this.ble.connect(this.device.id).subscribe(
    peripheral => this.onConnected(peripheral),
    peripheral => this.showAlert('Disconnected', 'Unable to Connect')     // navigate back to the home page
  );
}
*/
