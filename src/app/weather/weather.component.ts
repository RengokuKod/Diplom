// weather.component.ts
import { Component, OnInit } from '@angular/core';
import { WeatherService } from './weather.service';

interface ForecastDay {
  date: string;
  temp_min: number;
  temp_max: number;
  weather: any;
  hours: Array<{
    time: string;
    temp: number;
    icon: string;
    description: string;
  }>;
}

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit {
  weatherData: any = {};
  forecastData: ForecastDay[] = [];
  city: string = '';
  selectedDay: ForecastDay | null = null;
  isLoading = false;
  errorMessage = '';

  cities: string[] = [
    'Москва', 'Санкт-Петербург', 'Екатеринбург', 'Казань', 'Новосибирск',
    'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
    'Ангарск', 'Иркутск', 'Владивосток', 'Хабаровск', 'Красноярск'
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
    this.isLoading = true;
    this.errorMessage = '';
    
    this.weatherService.getWeather(city).subscribe({
      next: (data) => {
        this.weatherData = data;
        this.getForecast(city);
      },
      error: (err) => {
        console.error('Ошибка:', err);
        this.errorMessage = 'Не удалось загрузить данные о погоде';
        this.isLoading = false;
      }
    });
  }

  getForecast(city: string) {
    this.weatherService.getForecast(city).subscribe({
      next: (data) => {
        this.forecastData = this.processForecastData(data);
        this.selectedDay = this.forecastData[0];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Ошибка прогноза:', err);
        this.isLoading = false;
      }
    });
  }

  processForecastData(data: any): ForecastDay[] {
    const dailyData: ForecastDay[] = [];
    const daysMap = new Map<string, ForecastDay>();
    
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toLocaleDateString('ru-RU');
      
      if (!daysMap.has(dateStr)) {
        daysMap.set(dateStr, {
          date: dateStr,
          temp_min: item.main.temp_min,
          temp_max: item.main.temp_max,
          weather: item.weather[0],
          hours: []
        });
      }
      
      const day = daysMap.get(dateStr);
      if (day) {
        day.hours.push({
          time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          temp: item.main.temp,
          icon: item.weather[0].icon,
          description: item.weather[0].description
        });
        
        if (item.main.temp_min < day.temp_min) {
          day.temp_min = item.main.temp_min;
        }
        if (item.main.temp_max > day.temp_max) {
          day.temp_max = item.main.temp_max;
        }
      }
    });
    
    return Array.from(daysMap.values()).slice(0, 5);
  }

  selectDay(day: ForecastDay) {
    this.selectedDay = day;
  }

  getWeatherIcon(iconCode: string): string {
    return `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  getWindDirection(degrees: number): string {
    const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    const index = Math.round((degrees % 360) / 45);
    return directions[index % 8];
  }
}