import { BLE } from '@ionic-native/ble/ngx';
import { Component, NgZone } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { DataService } from '../../data-service.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {

  constructor(private toastCtrl: ToastController,
              private ble: BLE,
              private ngZone: NgZone,
              private dataService: DataService,
              private router: Router) {
  }
  devices: any[] = [];
  statusMessage: string;
  peripheral: any = {};
  gettingDevices: boolean;
  connection: any;


  testObj = {
    name: 'Battery Demo',
    id: '20:FF:D0:FF:D1:C0',
    advertising: [2, 1, 6, 3, 3, 15, 24, 8, 9, 66, 97, 116, 116, 101, 114, 121],
    rssi: -55,
    services: [
      '1800',
      '1801',
      '180f'
    ],
    characteristics: [
      {
        service: '1800',
        characteristic: '2a00',
        properties: [
          'Read'
        ]
      },
      {
        service: '1800',
        characteristic: '2a01',
        properties: [
          'Read'
        ]
      },
      {
        service: '1801',
        characteristic: '2a05',
        properties: [
          'Read'
        ]
      },
      {
        service: '180f',
        characteristic: '2a19',
        properties: [
          'Read'
        ],
        descriptors: [
          {
            uuid: '2901'
          },
          {
            uuid: '2904'
          }
        ]
      }
    ]
  };

  ionViewDidEnter() {
    console.log('ionViewDidEnter');
    this.scan();
  }

  scan() {
    this.setStatus('Scanning for Bluetooth LE Devices');
    this.devices = [];  // clear list
    this.gettingDevices = true;
    this.ble.scan([], 5).subscribe(
      device => this.onDeviceDiscovered(device),
      error => this.scanError(error)
    );

    setTimeout(this.setStatus.bind(this), 5000, 'Scan complete');
  }

  onDeviceDiscovered(device) {
    this.ngZone.run(() => {
      this.devices.push(device);
    });
  }

  // If location permission is denied, you'll end up here
  async scanError(error) {
    this.setStatus('Error ' + error);
    const toast = await this.toastCtrl.create({
      message: 'Error scanning for Bluetooth low energy devices',
      position: 'middle',
      duration: 5000
    });
    await toast.present();
  }

  setStatus(message) {
    console.log(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
      this.gettingDevices = false;
    });
  }

  deviceSelected(device) {
    this.dataService.myParam = {
      data: device,
      type: true
    };
    // this.dataService.myParam = {data: this.testObj};
    this.router.navigate(['/menu/graph']);
  }

  deviceSelectedTest() {
    this.dataService.myParam = {
      data: this.testObj,
      type: true
    };
    this.router.navigate(['/menu/graph']);
  }


  async onDeviceDisconnected(peripheral) {
    const toast = await this.toastCtrl.create({
      message: 'The peripheral unexpectedly disconnected',
      duration: 3000,
      position: 'middle'
    });
    await toast.present();
  }


}
