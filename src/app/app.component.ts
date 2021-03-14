import { BleService, CurrentState } from './ble.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'esk8pal';
  state: string;
  connected: boolean;

  constructor(public bleService: BleService) {
    this.bleService.connectToDevice();

    this.bleService.state$.subscribe(
      (state: CurrentState) => {
        this.state = JSON.stringify(state, null, 2);
      },
      () => {}
    );

    this.bleService.connected$.subscribe(
      (connected: boolean) => {
        this.connected = connected;
      },
      () => {}
    );
  }

  async ngOnInit() {
    await this.bleService.init();
  }

  async readState() {
    await this.bleService.readState();
  }
}
