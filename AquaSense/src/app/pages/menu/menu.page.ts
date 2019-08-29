import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Plugins, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
import { NavController, ToastController } from '@ionic/angular';
import { DataService } from '../../data-service.service';
import { Events } from '@ionic/angular';

const { Filesystem } = Plugins;
const logsPath = 'AquaSense/Logs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
})
export class MenuPage implements OnInit {

  logs: string[];

  constructor(private router: Router,
              private toastCtrl: ToastController,
              private dataService: DataService,
              public navCtrl: NavController,
              public events: Events) {
    this.update();
    events.subscribe('logs', () => {  // subscribe to new logs being generated from the graph module
      this.update();
    });
  }

  ngOnInit() {
  }

  update() {
    this.readdir(logsPath).then(log => {
      this.logs = log.files;
    });
  }

  async showAlert(notification) {
    const toast = await this.toastCtrl.create({
      message: notification,
      duration: 3000,
      position: 'middle'
    });
    await toast.present();
  }

  // load the selected log
  load(log: string) {
    this.fileRead(logsPath + '/' + log).then(contents => {
      this.loadGraph(contents.data, log);
      // this.showAlert('Unable to read file');
    });
  }

  // pass the data contained in the file to the graph page
  loadGraph(contents: string, time: string) {
    this.dataService.myParam = {
      data: contents,
      type: false,
      stamp: time
    };
    this.events.publish('newLogs', 'data');
    this.router.navigate(['/menu/graph']);
  }

  // read from the log file
  async fileRead(filePath: string) {
    const contents = await Filesystem.readFile({
      path: filePath,
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8
    });
    return contents;
  }

  // read the contents of logs directory
  async readdir(logPath: string) {
    try {
      const ret = await Filesystem.readdir({
        path: logPath,
        directory: FilesystemDirectory.Documents
      });
      return ret;
    } catch (e) {
    }
  }

  delete(log: string) {
    console.log("here");
    console.log(logsPath + '/' + log);
    this.fileDelete(logsPath + '/' + log).then(contents => {
      this.events.publish('logs', 'data');
    });
  }

  async fileDelete(filePath: string) {
    await Filesystem.deleteFile({
      path: filePath,
      directory: FilesystemDirectory.Documents
    });
  }
}
