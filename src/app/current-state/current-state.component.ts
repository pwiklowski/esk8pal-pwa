import { Component, OnInit } from '@angular/core';
import { BleService, CurrentState } from '../ble.service';

@Component({
  selector: 'app-current-state',
  templateUrl: './current-state.component.html',
  styleUrls: ['./current-state.component.scss'],
})
export class CurrentStateComponent implements OnInit {
  state;

  constructor(public bleService: BleService) {
    this.bleService.state$.subscribe(
      (state: CurrentState) => {
        this.state = JSON.stringify(state, null, 2);
      },
      () => {}
    );
  }

  ngOnInit(): void {}

  async readState() {
    await this.bleService.readState();
  }
}
