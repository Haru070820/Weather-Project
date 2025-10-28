const apiKey = '51938763c5aed9930a565f6a25cc861b';

const searchForm = document.querySelector('.search');
const searchInput = document.querySelector('.search input[type="search"]')

const currentTemp = document.querySelector('.current-temp');
const currenticon = document.querySelector('.current-icon');
const currentLocation = document.querySelector('.current-location');

const todayInfoGrid = document.querySelector('.today-info-grid');

// Search form

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = searchInput.value.trim();
    if (!city) return;

    try {
        // 날씨 받아오기
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`);
        if (!geoRes.ok) throw new Error('지역을 찾을 수 없습니다.');
        const geoData = await geoRes.json();

        if (!geoData.length) throw new Error('해당 지역을 찾을 수 없습니다.');

        const { lat, lon, name, country } = geoData[0];

        // 추가 데이터 받아오기
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        if (!weatherRes.ok) throw new Error('현재 날씨 정보를 불러올 수 없습니다.');
        const weatherData = await weatherRes.json();
        
        const oneCallRes = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${apiKey}`);
        if (!oneCallRes.ok) throw new Error('날씨 정보를 불러올 수 없습니다.');
        const oneCallData = await oneCallRes.json();

        // UI 업데이트

        // 현재 날씨
        currentTemp.textContent = `${Math.round(weatherData.main.temp)}℃`;
        currentLocation.textContent = `${weatherData.name}`;

        const iconCode = weatherData.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        document.getElementById('weather-icon').src = iconUrl;

        // 기상 정보
        const uvi = oneCallData.current.uvi;
        const visibility = oneCallData.current.visibility / 1000;
        const humidity = weatherData.main.humidity;

        todayInfoGrid.innerHTML = `
        <div class="feel-temp">
            <h3>체감 온도</h3>
            <span>${Math.round(oneCallData.current.feels_like)}℃</span>
        </div>

        <div class="air-quality">
            <h3>대기질</h3>
            <span>0</span>
            <p>-</p>
        </div>

        <div class="ultraviolet">
            <h3>자외선 지수</h3>
            <span>${uvi}</span>
            <p>${uvi < 3 ? '낮음' : uvi < 6 ? '보통' : '높음'}</p>
        </div>

        <div class="visibility">
            <h3>가시거리</h3>
            <span>${visibility.toFixed(1)}km</span>
            <p>-</p>
        </div>

        <div class="humidity">
            <h3>습도</h3>
            <span>${humidity}%</span>
            <p>-</p>
        </div>
        `
    }
    catch (error) {
        console.error(error);
        alert(error.message);
    }
});

