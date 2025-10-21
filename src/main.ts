import '@/styles/main.scss';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import uk from 'i18n-iso-countries/langs/uk.json';
import {
  idToImage,
  currentLoad,
  dayLoad,
  showToast,
  normalizeInput,
  capitalize,
  showLoading,
  removeLoading,
} from '.';
import type { TWeatherInfo, TCombined } from '.';

const cancelBtn = document.querySelector<HTMLButtonElement>('.search-cancel');
const searchInput = document.querySelector<HTMLInputElement>('.search-input');
const currentField = document.querySelector<HTMLDivElement>('.current');
const forecastField = document.querySelector<HTMLDivElement>('.forecast');
const selected =
  document.querySelector<HTMLParagraphElement>('.search-selected');

countries.registerLocale(en);
countries.registerLocale(uk);

if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      clearPage();
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
    clearPage();
    return;
  }

  if (/^\d+$/.test(city)) {
    showToast('Please enter a valid city name, not only numbers.');
    clearPage();
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
      if (currentRes.status === 404) {
        showToast('City Not Found');
        clearPage();
        // showLoading();
      }
      throw new Error(`HTTP ${currentRes.status}, ${forecastRes.status}`);
    }

    showLoading();
    // setTimeout(() => {
    //   console.log('...');
    // }, 1000);

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

function renderWeather(input: [string, string?]) {
  processData(input)
    .then(({ currentProcessed, forecastProcessed }) => {
      setTimeout(() => {
        if (currentField) {
          currentField.innerHTML = currentLoad(currentProcessed);
        }

        if (forecastField) {
          forecastField.innerHTML = forecastProcessed.map(dayLoad).join('');
        }

        removeLoading();
      }, 1000);

      // console.log(currentProcessed);
      // console.log(forecastProcessed);
    })
    .catch((err) => {
      console.error('Error: ', err);
    });
}

function handleInput(input: string) {
  const inputSelect = input.split(/,\s/).map((e) => ' ' + capitalize(e));
  if (selected) selected.innerText = 'Selected: ' + inputSelect;
  const normalizedInput = normalizeInput(input);
  renderWeather(normalizedInput);
}

function debounce(fn: (...args: any[]) => void, delay = 500) {
  let timeout: number;
  // removeLoading();
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), delay);
  };
}

const debounceWeather = debounce(handleInput);

// final function to get the input it, normalize it, render
// searchInput?.addEventListener('keydown', (event) => {
//   // console.log('curr val:', (event.target as HTMLInputElement).value);
//   if (event.key === 'Enter') {
//     event.preventDefault();
//     handleInput((event.target as HTMLInputElement).value);
//   }
// });
// test

searchInput?.addEventListener('input', (event) => {
  debounceWeather((event.target as HTMLInputElement).value);
});

//at the start of the program skeleton is not shown

//to the showLoading add the skeleton

//set timeout to test on line 180;
