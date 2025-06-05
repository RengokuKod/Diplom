import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CorzinaComponent } from './corzina.component';
import { CorzinaService } from './corzina.service';
import { PostavshikService } from '../postavshik/postavshik.service';

@NgModule({
    declarations: [CorzinaComponent],
    imports: [CommonModule, FormsModule],
    providers: [CorzinaService, PostavshikService],
    exports: [CorzinaComponent]
})
export class CorzinaModule {}