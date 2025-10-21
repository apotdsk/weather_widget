import type { TWeatherInfo } from './types';
import countries from 'i18n-iso-countries';

export function getCh(temp: number | undefined): string | undefined {
  if (temp) {
    if (temp < 0) {
      return '-';
    } else if (temp > 0) {
      return '+';
    } else {
      return '';
    }
  }
  return '';
}

export function currentLoad(weather: TWeatherInfo) {
  let temp;
  return `
  <div class="current-left">
    <h2 class="left-temp">${getCh(weather.temp)}${(temp = weather.temp ? Math.round(weather.temp) : weather.temp)}°C</h2>
    <p class="left-weather">${weather.weather} <br class='br-mobile'> ${getCh(weather.temp_min)}${(temp = weather.temp_min ? Math.round(weather.temp_min) : weather.temp_min)}°C</p>
  </div>
  <div class="current-middle">
    <p class="middle-weather-description">${weather.description}</p>
    <p class="middle-location">${weather.city}, ${countries.getName(weather.country, 'en')}</p>
  </div>
  <div class="img-container">
    <img
      src="${weather.icon}"
      alt="${weather.weather}"
      class="weather-logo"
    />
  </div>`;
}

export function dayLoad(weather: TWeatherInfo) {
  let temp;
  return `
  <hr class="day-divider" />
    <div class="day">
      <h3 class="day-name">${weather.date}</h3>
      <div class="day-img-container">
        <img
          src="${weather.icon}"
          alt="${weather.weather}"
          class="day-weather-logo"
        />
      </div>
      <p class="day-weather">${weather.weather}</p>
      <div class="day-temps">
        <div class="temps-wrapper">
          <small class="day-time">Day</small>
          <p class="time-temp">${getCh(weather.temp)}${(temp = weather.temp ? Math.round(weather.temp) : weather.temp)}°C</p>
          <p class="time-temp">${getCh(weather.temp_min)}${(temp = weather.temp_min ? Math.round(weather.temp_min) : weather.temp_min)}°C</p>
          <small class="day-time">Night</small>
        </div>
      </div>
    </div>`;
}

export function showToast(message: string) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.append(toast);
  loadElements(true);
  setTimeout(() => {
    toast.remove();
    // loadElements(false);
  }, 1000);
}

const loading = document.createElement('div');
const skeleton = document.querySelector<HTMLDivElement>('.skeleton');
const forecast = document.querySelector<HTMLDivElement>('.forecast-main');
const current = document.querySelector<HTMLDivElement>('.current');

export function showLoading() {
  loading.className = 'toast-loading';
  loading.textContent = 'Loading...';
  loadElements(true);
  if (current) current.appendChild(loading);
}

export function removeLoading() {
  loadElements(false);
  loading.remove();
}

function loadElements(startLoading: boolean) {
  const skeletonStyle = startLoading ? 'block' : 'none';
  const forecastStyle = startLoading ? 'none' : 'block';
  const currStyle = startLoading ? 'none' : 'flex';

  if (skeleton) skeleton.style.display = skeletonStyle;
  if (forecast) forecast.style.display = forecastStyle;
  const current: (HTMLDivElement | null)[] = [
    document.querySelector<HTMLDivElement>('.current-left'),
    document.querySelector<HTMLDivElement>('.current-middle'),
    document.querySelector<HTMLDivElement>('.img-container'),
  ];
  current.forEach((e) => {
    if (e) e.style.display = currStyle;
  });
}
