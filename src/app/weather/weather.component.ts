import { Component, OnInit } from '@angular/core';
import { WeatherService } from './weather.service';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit {
  weatherData: any = {}; // Инициализация как пустой объект
  city: string = '';

  cities: string[] = [
    'Москва', 
    'Санкт-Петербург', 
    'Екатеринбург', 
    'Казань', 
    'Новосибирск',
    'Нижний Новгород',
    'Челябинск',
    'Самара',
    'Омск',
    'Ростов-на-Дону',
    'Ангарск',
    'Иркутск',
    'Владивосток',
    'Хабаровск',
    'Красноярск'
  ];

  constructor(private weatherService: WeatherService) {}

  ngOnInit() {
    this.city = this.cities[0];
    this.getWeather(this.city);
  }

  onCityChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.city = selectElement.value;
    this.getWeather(this.city);
  }

  getWeather(city: string) {
    if (!city) {
      console.error('Город не указан');
      return;
    }

    this.weatherService.getWeather(city).subscribe(data => {
      this.weatherData = data;
    }, error => {
      console.error('Ошибка:', error);
      this.weatherData = {}; // Устанавливаем в пустой объект, если произошла ошибка
    });
  }
}