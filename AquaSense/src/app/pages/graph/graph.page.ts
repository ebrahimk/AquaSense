import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.page.html',
  styleUrls: ['./graph.page.scss'],
})
export class GraphPage {
  @ViewChild('lineEC', { static: false }) lineCanvasEC: ElementRef;
  @ViewChild('lineTemp', { static: false }) lineCanvasTemp: ElementRef;
  ecChart: Chart;
  tempChart: Chart;
  count = -50; // create a setter

  constructor() {}
  timerIdec = setInterval(() => this.addData(this.ecChart, this.count, this.generateSinc(this.count)), 1);
  timerIdtemp = setInterval(() => this.addData(this.tempChart, this.count, this.generateSinc(this.count)), 1);


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
            //label: 'Electrical Conductivity',
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
            //label: 'Temperature',
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
    clearInterval(this.timerIdec);
    clearInterval(this.timerIdtemp);
  }

  start() {
    this.tempChart.destroy();
    this.ecChart.destroy();
    this.count = -50; // replace with bluetooth data pipeline
    this.createGraph();
    this.timerIdec = setInterval(() => this.addData(this.ecChart, this.count, this.generateSinc(this.count)), 1);
    this.timerIdtemp = setInterval(() => this.addData(this.tempChart, this.count, Math.sin(-this.generateSinc(this.count) * 2 )), 1);
  }

  addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data);
    chart.update();
    this.count = this.count + .2;
  }

  getRandomArbitrary(min, max) {
    return (Math.random() * (12 - 11) + 11).toFixed(4);
  }

  generateSinc(x) {
    return ((Math.sin(x) * 3.14) / (3.14 * x));
  }
}



/*
this.ble.startNotification(this.peripheral.id, THERMOMETER_SERVICE, TEMPERATURE_CHARACTERISTIC).subscribe(
      data => this.onTemperatureChange(data),
      () => this.showAlert('Unexpected Error', 'Failed to subscribe for temperature changes')
    )

    // Read the current value of the temperature characteristic
    this.ble.read(this.peripheral.id, THERMOMETER_SERVICE, TEMPERATURE_CHARACTERISTIC).then(
      data => this.onTemperatureChange(data),
      () => this.showAlert('Unexpected Error', 'Failed to get temperature')
    )
*/