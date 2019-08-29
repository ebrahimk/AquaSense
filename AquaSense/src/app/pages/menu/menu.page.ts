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
    events.subscribe('logs', () => {
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
    // this.loadGraph('1:34:32.255,0.0334,1.93\n1:34:32.293,0.0293,2.588\n1:34:32.323,0.024,3.142\n1:34:32.335,0.0176,3.571', log);
    this.fileRead(logsPath + '/' + log).then(contents => {
      this.loadGraph(contents.data, log),
       this.showAlert('Unable to read file');
    });
  }
  // I  think this may be bubbling down

  // pass the data contained in the file to the graph page
  loadGraph(contents: string, time: string) {
    this.dataService.myParam = {
      data: contents,
      type: false,
      stamp: time     // pass the file names
    };     // indicating that this is a loaded screen
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
}


/*
  Add delete functionality from the menu
  Make the logging button change colors when clicked
*/
