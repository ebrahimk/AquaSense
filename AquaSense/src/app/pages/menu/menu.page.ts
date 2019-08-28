import { Component, OnInit } from '@angular/core';
import { Router, RouterEvent } from '@angular/router';
import { Capacitor, Plugins, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
import { NavController, ToastController } from '@ionic/angular';

const { Filesystem } = Plugins;
const logsPath = 'AquaSense/Logs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
})
export class MenuPage implements OnInit {

  logs: string [];

  constructor(private router: Router,
              private toastCtrl: ToastController) {
    this.readdir(logsPath).then(log => {
        this.logs = log.files,
        console.log('failed');
    });
  }

  ngOnInit() {
  }

  async showAlert(notification) {
    const toast = await this.toastCtrl.create({
      message: notification,
      duration: 3000,
      position: 'middle'
    });
    await toast.present();
  }

  async readdir(logPath: string) {
    try {
      const ret = await Filesystem.readdir({
        path: logPath,
        directory: FilesystemDirectory.Documents
      });
      return ret;
    } catch (e) {
      this.showAlert('Failed to open file ');
    }
  }
}
