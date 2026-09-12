window.APPID = '3873b26d17f39c1354ef38dccd6e7ac4'
window.APIURL = 'https://api.openweathermap.org/data/2.5'
window.ICONURL = 'https://openweathermap.org/payload/api/media/file'

function setEl(selector, value, prop = 'textContent') {
    const el = document.querySelector(selector)
    if (el) el[prop] = value
}

window.onload = () => {
    updateHourLabels()

    navigator.geolocation.getCurrentPosition((position) => {
        let lat = position.coords.latitude
        let lon = position.coords.longitude
        let url = `${APIURL}/weather?lat=${lat}&lon=${lon}&appid=${APPID}&units=metric`
        loadApiData(url, lat, lon)
    })

    let searchButton = document.querySelector('#searchButton')
    searchButton.addEventListener('click', () => {
        let searchBox = document.querySelector('#searchBox')
        let url = `${APIURL}/weather?q=${searchBox.value}&appid=${APPID}&units=metric`
        loadApiData(url, null, null)
    })
}

function updateHourLabels() {
    const hour = new Date().getHours()

    function formatHour(h) {
        const wrapped = (h + 24) % 24
        const period = wrapped >= 12 ? 'PM' : 'AM'
        const display = wrapped % 12 || 12
        return `${display}${period}`
    }

    setEl('#now', formatHour(hour))
    setEl('#minus1', formatHour(hour - 1))
    setEl('#minus2', formatHour(hour - 2))
    setEl('#minus3', formatHour(hour - 3))
    setEl('#minus4', formatHour(hour - 4))
    setEl('#minus5', formatHour(hour - 5))
}

function loadHourlyHistory(lat, lon) {
    const url = `${APIURL}/forecast?lat=${lat}&lon=${lon}&appid=${APPID}&units=metric`

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data.list) return

            const ids = ['now', 'minus1', 'minus2', 'minus3', 'minus4', 'minus5']

            ids.forEach((id, offset) => {
                const entry = data.list[offset] ?? data.list[0]

                setEl(`#icon-${id}`, `${ICONURL}/${entry.weather[0].icon}.png`, 'src')
                setEl(`#forecast-${id}`, entry.weather[0].main)
                setEl(`#temp-${id}`, `${Math.round(entry.main.temp)}° / ${Math.round(entry.main.feels_like)}°`)
                setEl(`#wind-${id}`, `${Math.round(entry.wind.speed * 3.6)} km/h`)
            })
        })
        .catch(err => console.log('Forecast fetch error:', err))
}

function loadNearbyPlaces(lat, lon) {
    const url = `${APIURL}/find?lat=${lat}&lon=${lon}&cnt=4&appid=${APPID}&units=metric`

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data.list) return

            const container = document.querySelector('#nearbyPlaces')
            if (!container) return

            container.innerHTML = ''

            for (let i = 0; i < data.list.length; i += 2) {
                const pair = data.list.slice(i, i + 2)
                const row = document.createElement('div')
                row.className = 'row gap-2 mb-2'

                pair.forEach(place => {
                    const iconUrl = `${ICONURL}/${place.weather[0].icon}.png`
                    row.innerHTML += `
                        <div class="col sanc-bg d-flex justify-content-between align-items-center px-3 py-2">
                            <p class="mb-0">${place.name}</p>
                            <img src="${iconUrl}" style="width:32px; height:32px">
                            <p class="mb-0 fw-bold">${Math.round(place.main.temp)}°C</p>
                        </div>
                    `
                })

                container.appendChild(row)
            }
        })
        .catch(err => console.log('Nearby fetch error:', err))
}

function loadDailyForecast(lat, lon) {
    const url = `${APIURL}/forecast?lat=${lat}&lon=${lon}&appid=${APPID}&units=metric`

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data.list) return

            const days = {}
            data.list.forEach(entry => {
                const date = new Date(entry.dt * 1000)
                const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
                if (!days[key]) days[key] = []
                days[key].push(entry)
            })

            const dayKeys = Object.keys(days).slice(0, 5)
            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

            const container = document.querySelector('#dailyForecast')
            if (!container) return
            container.innerHTML = ''

            dayKeys.forEach((key, i) => {
                const entries = days[key]
                const entry = entries.find(e => new Date(e.dt * 1000).getHours() === 12) ?? entries[0]
                const date = new Date(entry.dt * 1000)

                const label = i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
                const dateStr = `${monthNames[date.getMonth()]} ${date.getDate()}`

                const card = document.createElement('div')
                card.className = `col px-4 p-3 sanc-primary ${i < 4 ? 'me-2' : ''}`
                card.innerHTML = `
                    <h3 class="text-muted fs-5">${label}</h3>
                    <p>${dateStr}</p>
                    <img src="${ICONURL}/${entry.weather[0].icon}.png">
                    <h1>${Math.round(entry.main.temp)}°C</h1>
                    <p>${entry.weather[0].description}</p>
                `
                container.appendChild(card)
            })
        })
        .catch(err => console.log('Daily forecast error:', err))
}

function loadApiData(url, lat, lon) {
    fetch(url)
        .catch(error => {
            console.log(error)
            setEl('.error', String(error), 'innerHTML')
        })
        .then(res => res.json())
        .then(data => {
            if (!data.weather) {
                const inputData = document.querySelector("#searchBox").value;
                location.replace(`error.html?location=${encodeURIComponent(inputData)}`);
                return;
            }

            setEl('.error', '', 'innerHTML');

            let date = new Date(data.dt * 1000)
            setEl('#today', `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`, 'innerHTML')

            setEl('#weatherIcon', `${ICONURL}/${data.weather[0].icon}.png`, 'src')
            setEl('#mainWeather', data.weather[0].main, 'innerHTML')
            setEl('#temperature', `${data.main.temp} ℃`, 'innerHTML')
            setEl('#feelsLike', `Real Feel ${data.main.feels_like} ℃`, 'innerHTML')

            let sunrise = new Date(data.sys.sunrise * 1000)
            setEl('#sunRise', `${sunrise.getHours()}:${sunrise.getMinutes()} AM`)
            let sunset = new Date(data.sys.sunset * 1000)
            setEl('#sunSet', `${sunset.getHours()}:${sunset.getMinutes()} PM`)
            let duration = new Date(data.dt * 1000)
            setEl('#duration', `${duration.getHours()}`)

            const resolvedLat = lat ?? data.coord.lat
            const resolvedLon = lon ?? data.coord.lon

            loadHourlyHistory(resolvedLat, resolvedLon)
            loadNearbyPlaces(resolvedLat, resolvedLon)
            loadDailyForecast(resolvedLat, resolvedLon)
        })
}