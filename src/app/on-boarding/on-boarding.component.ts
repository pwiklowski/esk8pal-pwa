import { Component, OnInit } from '@angular/core';
import { BleService } from '../ble.service';

@Component({
  selector: 'app-on-boarding',
  templateUrl: './on-boarding.component.html',
  styleUrls: ['./on-boarding.component.scss'],
})
export class OnBoardingComponent {
  state: string;
  connected: boolean;
  isDiscoverable: boolean;

  constructor(public bleService: BleService) {
    this.bleService.connected$.subscribe(
      (connected: boolean) => {
        this.connected = connected;
      },
      () => {}
    );

    this.bleService.isDiscoverable$.subscribe(
      (isDiscoverable: boolean) => {
        this.isDiscoverable = isDiscoverable;
      },
      () => {}
    );
  }
  }
}
