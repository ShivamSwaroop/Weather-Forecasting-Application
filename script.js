
// generate your API key form this website - https://home.openweathermap.org/api_keys

const apiKey = 'Your API key'; // You can replace it with your OpenWeatherMap API Key

//DOM elements refrence
const weatherCard = document.getElementById('weatherCard');
const forecastSection =  document.getElementById('forecastSection');
const forecastContainer = document.getElementById('forecastContainer');
const searchBtn = document.getElementById('searchButton');
const currentLocationBtn =document.getElementById('currentLocationButton');
const cityInput = document.getElementById('cityInput');
const errorMsg = document.getElementById('errorMsg');
const recentCities = document.getElementById('recentCities');
const toggleUnit = document.getElementById('toggleUnit');

let currentUnit = 'metric'; // Celsius by default

//Display an error message
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
  setTimeout(() => errorMsg.classList.add('hidden'), 4000);
}

//Dispaly recently searched cities in dropdown
function updateRecentCities(city) {
  let cities = JSON.parse(localStorage.getItem('recentCities')) || [];
  if (!cities.includes(city)) {
    cities.unshift(city);
    if (cities.length > 5) cities.pop();
    localStorage.setItem('recentCities', JSON.stringify(cities));
  }
  renderRecentCities();
}

function renderRecentCities() {
  let cities = JSON.parse(localStorage.getItem('recentCities')) || [];
  recentCities.innerHTML = '';
  if (cities.length === 0) {
    recentCities.classList.add('hidden');
    return;}
  recentCities.classList.remove('hidden');
  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    recentCities.appendChild(option);
  });
}
recentCities.addEventListener('change', () => {
  fetchWeather(recentCities.value);
});

//Change temperature from celcius to fahrenheit
toggleUnit.addEventListener('click', () => {
  currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
  toggleUnit.textContent = `Switch to °${currentUnit === 'metric' ? 'F' : 'C'}`;
  if (cityInput.value) fetchWeather(cityInput.value);
});

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) return showError('Please enter a city name.');
  fetchWeather(city);
});

currentLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) return showError('Geolocation not supported.');
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    fetchWeatherByCoords(latitude, longitude);
  }, () => {
    showError('Failed to get location.');
  });
});

//Current weather by city
function fetchWeather(city) {
  
  if (!city) return showError('Please enter a valid city name.');
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${currentUnit}&appid=${apiKey}`)
    .then(res => {
      if (!res.ok) throw new Error('City not found');
      return res.json();
    }).then(data => {
      updateRecentCities(city);
      renderWeather(data);
      fetchForecast(data.coord.lat, data.coord.lon);
    })
    .catch(err => showError(err.message));
}

//Current weather by coordinates
function fetchWeatherByCoords(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      cityInput.value = data.name;
      updateRecentCities(data.name);
      renderWeather(data);
      fetchForecast(lat, lon);
    })
    .catch(() => showError('Failed to fetch weather.'));

}

//fetch for 5-day forecast
function fetchForecast(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      forecastSection.classList.remove('hidden');
      forecastSection.classList.add('show');
      renderForecast(data);
    })
    .catch(()=> showError('failed to fetch forecast.'));
}
//Render current weather data
function renderWeather(data) {
  weatherCard.classList.remove('hidden');
  document.getElementById('locationName').textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
  document.getElementById('condition').textContent = data.weather[0].description;
  document.getElementById('humidity').textContent = `${data.main.humidity}%`;
  document.getElementById('wind').textContent = `${data.wind.speed} ${currentUnit === 'metric' ? 'm/s' : 'mph'}`;
  document.getElementById('date').textContent = new Date().toLocaleDateString();
  const iconCode = data.weather[0].icon;

  document.getElementById('weatherIcon').innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="weather icon">`;

  // Trigger warning if too hot
  if (currentUnit === 'metric' && data.main.temp > 40) {
    showError('Heat Alert: Temperature exceeds 40°C!');
  }

  // Dynamic background
  document.body.classList.replace = data.weather[0].main.toLowerCase().includes('rain')
    ? 'bg-gradient-to-br from-blue-900 to-gray-700'
    : 'bg-gradient-to-br from-blue-200 to-blue-50';
}

function renderForecast(data) {
  forecastContainer.innerHTML = '';
  const forecastByDay = {};

  data.list.forEach(entry => {
    const date = new Date(entry.dt * 1000).toLocaleDateString();
    if (!forecastByDay[date]) forecastByDay[date] = entry;
  });

  //Display only the first 5 days forecast
  Object.values(forecastByDay).slice(0, 5).forEach(entry => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow p-4 flex flex-col items-center text-center';
    card.innerHTML = `
      <div class="text-blue-700 font-bold">${new Date(entry.dt * 1000).toLocaleDateString()}</div>
      <img src="https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png" alt="icon">
      <div><i class="fas fa-thermometer-half"></i> ${Math.round(entry.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}</div>
      <div><i class="fas fa-wind"></i> ${entry.wind.speed} ${currentUnit === 'metric' ? 'm/s' : 'mph'}</div>
      <div><i class="fas fa-tint"></i> ${entry.main.humidity}%</div>
    `;
    forecastContainer.appendChild(card);
  });
}

renderRecentCities();
