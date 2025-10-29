const apiKey = "6790afe350eaee9990e38e6780b93f20";

const searchForm = document.querySelector('.search');
const searchInput = document.querySelector('.search input[type="search"]')
const currentTemp = document.querySelector('.current-temp');
const currenticon = document.querySelector('.current-icon');
const currentLocation = document.querySelector('.current-location');
const todayInfoGrid = document.querySelector('.today-info-grid');

const hourlyList = document.querySelector('.hourly-list');
const weeklyForecast = document.querySelector('.weekly-forecast ul');

// Search form
async function loadWeather(lat, lon, name = "현재 위치") {
    try {
        // 날씨 받아오기
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=kr&appid=${apiKey}`);
        if (!forecastRes.ok) throw new Error('날씨 정보를 불러올 수 없습니다.');
        const forecastData = await forecastRes.json();

        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=kr&appid=${apiKey}`);
        if (!weatherRes.ok) throw new Error('날씨 정보를 불러올 수 없습니다.');
        const weatherData = await weatherRes.json();

        const airRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        const airData = await airRes.json();

        const oneCallRes = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${apiKey}`);
        const oneCallData = await oneCallRes.json();

        // 현재 날씨
        const iconCode = weatherData.weather[0].icon;
        currentTemp.textContent = `${Math.round(weatherData.main.temp)}℃`;
        currenticon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        currentLocation.textContent = name;

        const feels = Math.round(weatherData.main.feels_like);
        const humidity = weatherData.main.humidity;
        const visibility = weatherData.visibility / 1000;
        const rain = forecastData.list[0].rain?.["3h"] ?? 0;
        const uvi = oneCallData.current?.uvi ?? "-";
        const aqi = airData.list[0]?.main.aqi ?? 0;
        const aqiText = ["좋음", "보통", "약간 나쁨", "나쁨", "매우 나쁨"][aqi - 1] || "-";


        // 오늘 기상 정보
        todayInfoGrid.innerHTML = `
        <div class="feel-temp">
            <h3>체감 온도</h3>
            <span>${feels}℃</span>
        </div>

        <div class="humidity">
            <h3>습도</h3>
            <span>${humidity}%</span>
            <p>-</p>
        </div>

        <div class="visibility">
            <h3>가시거리</h3>
            <span>${visibility.toFixed(1)}km</span>
        </div>

        <div class="rain">
            <h3>강수량</h3>
            <span>${rain}mm</span>
            <p>-</p>
        </div>
        
        <div class="uv">
            <h3>자외선 지수</h3>
            <span>${uvi}</span>
            <p>${uvi === "-" ? "-" : uvi < 3 ? "낮음" : uvi < 6 ? "보통" : "높음"}</p>
        </div>

        <div class="air">
            <h3>대기질</h3>
            <span>${aqi}</span>
            <p>${aqiText}</p>
        </div>
        `;

        //  시간별 예보
        hourlyList.innerHTML = "";
        forecastData.list.slice(0, 8).forEach((item) => {
            const time = new Date(item.dt * 1000).getHours();
            const hour = time === 0 ? "자정" : `${time}시`;
            const icon = item.weather[0].icon;
            const temp = Math.round(item.main.temp);

            const li = document.createElement("li");
            li.className = "hourly-item";
            li.innerHTML = `
                <span class="hour">${hour}</span>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
                <span class="temp">${temp}℃</span>
            `;
            hourlyList.appendChild(li);
        });

        //  주간 예보
        weeklyForecast.innerHTML = "";
        const dailyMap = {};
        forecastData.list.forEach((item) => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString("ko-KR", { weekday: "short" });
            const dayKey = date.toISOString().split("T")[0];
            if (!dailyMap[dayKey]) {
                dailyMap[dayKey] = { day, temps: [], icons: [] };
            }
            dailyMap[dayKey].temps.push(item.main.temp);
            dailyMap[dayKey].icons.push(item.weather[0].icon);
        });

        Object.values(dailyMap)
            .slice(0, 5)
            .forEach((dayData) => {
                const min = Math.round(Math.min(...dayData.temps));
                const max = Math.round(Math.max(...dayData.temps));
                const icon = dayData.icons[Math.floor(dayData.icons.length / 2)];
                const li = document.createSelector("li");
                li.innerHTML = `
                <span class="icon"><img src="https://openweathermap.org/img/wn/${icon}.png" alt=""></span>
                <span class="temp">${min}℃ / ${max}℃</span>
                <span class="day">${dayData.day}</span>
            `;
                weeklyForecast.appendChild(li);
            });
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}


// 검색창
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = searchInput.value.trim();
    if (!city) return;

    try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`);
        if (!geoRes.ok) throw new Error("지역을 찾을 수 없습니다.");
        const geoData = await geoRes.json();
        if (!geoData.length) throw new Error("해당 지역을 찾을 수 없습니다.");

        const { lat, lon, name } = geoData[0];
        loadWeather(lat, lon, name);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});

// 현재 위치
window.addEventListener("load", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                loadWeather(lat, lon, "현재 위치");
            },
            (error) => {
                console.warn("위치 접근 거부됨:", error);
                // 기본값
                loadWeather(37.5665, 126.9780, "서울");
            }
        );
    } else {
        loadWeather(37.5665, 126.9780, "서울");
    }
});