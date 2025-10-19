export type TWeatherInfo = {
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

export type TCombined = {
  currentProcessed: TWeatherInfo;
  forecastProcessed: TWeatherInfo[];
};

export const idToImage: Record<number, string> = {
  2: 'thunders.svg',
  3: 'rain.svg',
  5: 'strong_rain.svg',
  6: 'snow.svg',
  7: 'thunders.svg',
  8: 'clouds.svg',
  9: 'sun.svg',
};
