import { BleService, CurrentState } from './ble.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'esk8pal';
  state: string;
  connected: boolean;

  constructor(public bleService: BleService, private router: Router) {
    this.bleService.connected$.subscribe(
      (connected: boolean) => {
        if (connected) {
          this.router.navigate(['/state']);
        } else {
          this.router.navigate(['/']);
        }
      },
      () => {}
    );
    ``;
  }

  async ngOnInit() {
    await this.bleService.init();
  }
}
