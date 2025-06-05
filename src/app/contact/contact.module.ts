import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactComponent } from './contact.component';
import { ContactService } from './contact.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
    declarations: [ContactComponent],
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    providers: [ContactService, AuthService],
    exports: [ContactComponent]
})
export class ContactModule {}