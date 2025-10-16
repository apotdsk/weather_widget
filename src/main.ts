import '@/styles/main.scss';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import uk from 'i18n-iso-countries/langs/uk.json';
// import { error } from 'console';

const cancelBtn = document.querySelector<HTMLButtonElement>('.search-cancel');
const searchInput = document.querySelector<HTMLInputElement>('.search-input');
const currentField = document.querySelector<HTMLDivElement>('.weather-today');
const forecastField = document.querySelector<HTMLDivElement>('.week-forecast');
const selected =
  document.querySelector<HTMLParagraphElement>('.search-selected');

countries.registerLocale(en);
countries.registerLocale(uk);

type TWeatherInfo = {
  city?: string;
  temp?: number;
  temp_min?: number;
  weather: string;
  description?: string;
  weather_code: number;
  date?: string;
  icon: string;
  country: string;
};

type TCombined = {
  currentProcessed: TWeatherInfo;
  forecastProcessed: TWeatherInfo[];
};

const idToImage: Record<number, string> = {
  2: 'thunders.svg',
  3: 'rain.svg',
  5: 'strong_rain.svg',
  6: 'snow.svg',
  7: 'thunders.svg',
  8: 'clouds.svg',
  9: 'sun.svg',
};

if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      clearPage();
      // console.log('123');
    }
  });
}

function clearPage() {
  if (currentField) currentField.innerHTML = '';
  if (forecastField) forecastField.innerHTML = '';
  if (selected) selected.innerHTML = '';
}

async function getWeather(input: [string, string?]) {
  const apiKey = import.meta.env['VITE_OPENWEATHER_KEY'];

  let city: string;
  let country: string | undefined;
  if (input.length === 2) {
    city = input[0];
    country = input[1];
  } else {
    city = input[0];
    country = undefined;
  }
  if (!city) {
    showToast('Please Enter the City');
    return;
  }

  if (/^\d+$/.test(city)) {
    showToast('Please enter a valid city name, not only numbers.');
    return;
  }

  const q = country ? `${city},${country}` : city;
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&units=metric&appid=${apiKey}`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      clearPage();
      if (currentRes.status === 404) showToast('City Not Found');
      throw new Error(`HTTP ${currentRes.status}, ${forecastRes.status}`);
    }

    const [currentData, forecastData] = await Promise.all([
      currentRes.json(),
      forecastRes.json(),
    ]);

    // console.log(currentData);
    return { current: currentData, forecast: forecastData };
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

function matchIcon(id: number): string {
  return idToImage[id === 800 ? 9 : Math.floor(id / 100)] ?? '';
}

function showToast(message: string) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 3000);
}

function processData(input: [string, string?]): Promise<TCombined> {
  return getWeather(input).then((data) => {
    if (!data) throw new Error('no data');
    // console.log(data.current);
    // console.log(data.forecast);
    const currentProcessed: TWeatherInfo = {
      city: data.current.name,
      temp: data.current.main.temp,
      temp_min: data.current.main.feels_like,
      weather: data.current.weather[0].main,
      description: data.current.weather[0].description,
      weather_code: data.current.weather[0].id,
      icon: matchIcon(data.current.weather[0].id),
      country: data.current.sys.country,
    };
    // console.log(currentProcessed);

    const forecastList = data.forecast.list;
    const dayList: Record<string, any>[] = [];
    // console.log(forecastList);
    forecastList.forEach((obj: Record<string, any>) => {
      const date = obj['dt_txt'].split(' ')[0];
      const time = obj['dt_txt'].split(' ')[1];
      const now = new Date();
      const last = new Date(now);
      last.setDate(now.getDate() + 5);
      const nowStr = now.toISOString().split('T')[0];
      const lastStr = last.toISOString().split('T')[0];

      if (date !== nowStr && date !== lastStr) {
        if (time === '12:00:00' || time === '00:00:00') {
          dayList.push(obj);
          // console.log(obj);
        }
      }
    });
    // console.log(dayList);
    const forecastProcessed: TWeatherInfo[] = [];
    let counter = 0;
    let dayProcessed: TWeatherInfo;
    dayList.forEach((el) => {
      // console.log(el['weather']['0'].main);
      if (counter % 2 === 0) {
        const currDate = new Date(el['dt_txt'].replace(' ', 'T'));
        dayProcessed = {
          temp_min: el['main'].temp,
          weather: el['weather']['0'].main,
          weather_code: el['weather']['0'].id,
          icon: matchIcon(el['weather']['0'].id),
          date: currDate
            .toLocaleDateString('en-US', { weekday: 'short' })
            .toUpperCase(),
          country: data.current.sys.country,
        };
        counter++;
      } else {
        dayProcessed.temp = el['main'].temp;
        dayProcessed.weather = el['weather']['0'].main;
        dayProcessed.weather_code = el['weather']['0'].id;
        dayProcessed.icon = matchIcon(el['weather']['0'].id);
        // console.log(dayProcessed.temp_min);
        // console.log(el['main'].temp);
        // console.log(dayProcessed);
        counter++;
        // console.log(dayProcessed);
        forecastProcessed.push(dayProcessed);
      }
    });
    // console.log(forecastProcessed);
    return { currentProcessed, forecastProcessed };
  });
}

function getCh(temp: number | undefined): string | undefined {
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

function currentLoad(weather: TWeatherInfo) {
  let temp;
  return `
  <div class="today-main">
    <h2 class="today-current">${getCh(weather.temp)}${(temp = weather.temp ? Math.round(weather.temp) : weather.temp)}°C</h2>
    <p class="today-description">${weather.weather} ${getCh(weather.temp_min)}${(temp = weather.temp_min ? Math.round(weather.temp_min) : weather.temp_min)}°C</p>
  </div>
  <div class="today-middle">
    <p class="current-description">${weather.description}</p>
    <p class="location">${weather.city}, ${countries.getName(weather.country, 'en')}</p>
  </div>
  <div class="img-container">
    <img
      src="${weather.icon}"
      alt="${weather.weather}"
      class="weather-logo"
    />
  </div>`;
}

function dayLoad(weather: TWeatherInfo) {
  let temp;
  return `
  <hr class="day-divider" />
    <div class="week-day">
      <h3 class="day-name">${weather.date}</h3>
      <div class="reg-img-container">
        <img
          src="${weather.icon}"
          alt="${weather.weather}"
          class="week-weather-logo"
        />
      </div>
      <p class="day-description">${weather.weather}</p>
      <div class="day-temps">
        <div class="day-wrapper">
          <small class="day-time">Day</small>
          <p class="temp-number">${getCh(weather.temp)}${(temp = weather.temp ? Math.round(weather.temp) : weather.temp)}°C</p>
          <p class="temp-number">${getCh(weather.temp_min)}${(temp = weather.temp_min ? Math.round(weather.temp_min) : weather.temp_min)}°C</p>
          <small class="day-time">Night</small>
        </div>
      </div>
    </div>`;
}

// normalize the Input
function normalizeInput(input: string): [string, string?] {
  const parts = input.split(/[,;]+/);
  const city = capitalize(parts[0]!);
  let countryCode: string | undefined;
  for (const part of parts.slice(1)) {
    countryCode =
      countries.getAlpha2Code(part, 'en') ||
      countries.getAlpha2Code(part, 'uk') ||
      (/^[A-Z]{2}$/i.test(part) ? part.toUpperCase() : undefined);
    if (countryCode) break;
  }
  return countryCode ? [city, countryCode] : [city];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// render the web

function renderWeather(input: [string, string?]) {
  processData(input)
    .then(({ currentProcessed, forecastProcessed }) => {
      if (currentField) {
        currentField.innerHTML = currentLoad(currentProcessed);
      }

      if (forecastField) {
        forecastField.innerHTML = forecastProcessed.map(dayLoad).join('');
      }

      // console.log(currentProcessed);
      // console.log(forecastProcessed);
    })
    .catch((err) => {
      console.error('Error: ', err);
    });
}

// final function to get the input it, normalize it, render
searchInput?.addEventListener('keydown', (event) => {
  // console.log('curr val:', (event.target as HTMLInputElement).value);
  if (event.key === 'Enter') {
    const input = (event.target as HTMLInputElement).value;
    const inputSelect = input.split(/,\s/).map((e) => ' ' + capitalize(e));
    if (selected) selected.innerText = 'Selected: ' + inputSelect;
    const normalizedInput = normalizeInput(input);
    renderWeather(normalizedInput);
  }
});
// test
