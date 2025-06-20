import { Component, OnInit } from '@angular/core';
import { PostavshikService } from './postavshik.service';

@Component({
  selector: 'app-postavshik',
  templateUrl: './postavshik.component.html',
  styleUrls: ['./postavshik.component.css']
})
export class PostavshikComponent implements OnInit {
  postavshiks: any[] = [];
  baseImagePath = '/images/postavshik/'; // Базовый путь к изображениям

  constructor(private postavshikService: PostavshikService) {}

  ngOnInit(): void {
    this.postavshikService.getPostavshiks().subscribe(data => {
      this.postavshiks = data.map((p, index) => ({
        ...p,
        photo: this.baseImagePath + (index + 1) + '.jpg',
        
      }));
    });
  }
}