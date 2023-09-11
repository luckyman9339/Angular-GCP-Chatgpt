import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

const uiModules = [
  MatButtonModule,
  MatIconModule,
  MatSidenavModule
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, uiModules
  ], 
  exports: [
    uiModules
  ]
})
export class AppUiModule { }
