import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZakazComponent } from './zakaz.component';
import { ZakazService } from './zakaz.service';
import { AuthService } from '../auth/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
@NgModule({
  declarations: [ZakazComponent],
  imports: [CommonModule],
  providers: [AuthService, ZakazService,ReactiveFormsModule,FormsModule, NgFor],
  exports: [ZakazComponent]
})
export class ZakazModule { }