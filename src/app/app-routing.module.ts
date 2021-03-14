import { SettingsComponent } from './settings/settings.component';
import { CurrentStateComponent } from './current-state/current-state.component';
import { OnBoardingComponent } from './on-boarding/on-boarding.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: 'state', component: CurrentStateComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', component: OnBoardingComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
