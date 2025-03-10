import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoprosComponent } from './vopros.component';
import { VoprosService } from './vopros.service';

@NgModule({
    declarations: [VoprosComponent],
    imports: [CommonModule],
    providers: [VoprosService],
    exports: [VoprosComponent]
})
export class VoprosModule {}