import { MapComponent } from './map/map.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { OnBoardingComponent } from './on-boarding/on-boarding.component';
import { CurrentStateComponent } from './current-state/current-state.component';
import { SettingsComponent } from './settings/settings.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [AppComponent, OnBoardingComponent, CurrentStateComponent, SettingsComponent, MapComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
    BrowserAnimationsModule,
    MatButtonModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
