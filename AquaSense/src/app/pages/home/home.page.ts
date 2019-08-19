import { BLE } from '@ionic-native/ble/ngx';
import { Component, NgZone } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { DataService } from '../../data-service.service';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(public navCtrl: NavController,
              private toastCtrl: ToastController,
              private ble: BLE,
              private ngZone: NgZone,
              private dataService: DataService) {
  }
  devices: any[] = [];
  statusMessage: string;
  peripheral: any = {};
  gettingDevices: boolean;
  connection: any;

  person = {
    firstname: 'Tom',
    lastname: 'Hanks'
  };

  variable = 'moose';

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
  this.dataService.myParam = {data: device};
  this.navCtrl.navigateRoot('/graph');
}

 /* this.ble.connect(device.id).subscribe(
    peripheral => this.onConnected(peripheral),
    peripheral => this.onDeviceDisconnected(peripheral)
  );
}

onConnected(peripheral) {
  this.ngZone.run(() => {
    this.setStatus('');
    this.peripheral = peripheral;
    this.navCtrl.navigateRoot('/graph');
  });
}
*/

async onDeviceDisconnected(peripheral) {
  const toast = await this.toastCtrl.create({
    message: 'The peripheral unexpectedly disconnected',
    duration: 3000,
    position: 'middle'
  });
  await toast.present();
}

/*
  disconnect(device) {
        this.ble.disconnect(device.id).
  }
*/

}
