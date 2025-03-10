import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpisanieComponent } from './opisanie.component';
import { OpisanieService } from './opisanie.service';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [OpisanieComponent],
    imports: [CommonModule, RouterModule],
    providers: [OpisanieService],
    exports: [OpisanieComponent]
})
export class OpisanieModule {}