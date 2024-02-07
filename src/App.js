import React from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "⛅"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫️"],
    [[51, 56, 61, 66, 80], "🌦️"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧️"],
    [[71, 73, 75, 77, 85, 86], "🌨️"],
    [[95], "🌩️"],
    [[96, 99], "⛈️"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      city: "",
      isLoading: false,
      weather: {},
      daily: {},
    };
    this.fetchWeather = this.fetchWeather.bind(this);
  }

  componentDidMount() {
    this.setState({ search: localStorage.getItem("search") || "" });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.search && this.state.search !== prevState.search) {
      this.fetchWeather(this.state.search);

      localStorage.setItem("search", this.state.search);
    }
  }

  async fetchWeather(search) {
    try {
      if (this.state.search.length < 2) return;
      this.setState({ isLoading: true });
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${search}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name } = geoData.results.at(0);
      this.setState({ city: name });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&current=temperature_2m,weathercode,snowfall,rain,relative_humidity_2m,apparent_temperature,is_day,precipitation,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,rain,wind_speed_10m`
      );

      const weatherData = await weatherRes.json();
      console.log(weatherData.current);
      this.setState({ weather: weatherData.current });

      const dailyRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=temperature_2m_max,temperature_2m_min,weathercode`
      );
      const dailyData = await dailyRes.json();
      console.log(dailyData.daily);
      this.setState({ daily: dailyData.daily });
    } catch (err) {
      console.log(err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    return (
      <div className="app">
        <div className="input">
          <input
            type="text"
            placeholder={"Your city"}
            value={this.state.search}
            onChange={(e) => this.setState({ search: e.target.value })}
          />
          {/* <button onClick={() => this.fetchWeather(this.state.search)}>
            Choose
          </button> */}
        </div>

        {this.state.isLoading && <p>...Loading</p>}
        {this.state.weather.time && (
          <MainWeather city={this.state.city} weather={this.state.weather} />
        )}
        {this.state.daily.weathercode && (
          <DailyWeather daily={this.state.daily} />
        )}
      </div>
    );
  }
}

class MainWeather extends React.Component {
  render() {
    const {
      apparent_temperature,
      interval,
      is_day,
      precipitation,
      rain,
      relative_humidity_2m,
      temperature_2m,
      time,
      weathercode,
      wind_speed_10m,
      snowfall,
    } = this.props.weather;

    const { city } = this.props;

    return (
      <>
        <header className="header">
          <h1 className="header_heading">{city}</h1>
          <span className="header_date">{formatDay(time)}</span>
        </header>

        <main className="main">
          <div className="main_weather">
            <div className="main_weather_box">
              <div className="main_weather_icon">
                {getWeatherIcon(weathercode)}
              </div>
              <div>
                <span className="main_weather_temp">{temperature_2m}°C</span>
              </div>
            </div>
            <div className="main_weather_more">
              <div className="main_weather_detail">
                <span className="main_weather_temp_value">
                  {apparent_temperature}°C
                </span>
                <span className="main_weather_temp_unit">
                  Apparent Temperature
                </span>
              </div>
              <div className="main_weather_detail">
                <span className="main_weather_temp_value">
                  {wind_speed_10m} km/h
                </span>
                <span className="main_weather_temp_unit">Wind Speed</span>
              </div>
              <div className="main_weather_detail">
                <span className="main_weather_temp_value">
                  {relative_humidity_2m}%
                </span>
                <span className="main_weather_temp_unit">Humidity</span>
              </div>
              <div className="main_weather_detail">
                <span className="main_weather_temp_value">
                  {precipitation} mm
                </span>
                <span className="main_weather_temp_unit">Precipitation</span>
              </div>
              <div className="main_weather_detail">
                <span className="main_weather_temp_value">{rain} mm</span>
                <span className="main_weather_temp_unit">Rain</span>
              </div>
              <div className="main_weather_detail">
                <span className="main_weather_temp_value">{snowfall} cm</span>
                <span className="main_weather_temp_unit">Snowfall</span>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }
}

class DailyWeather extends React.Component {
  render() {
    const { temperature_2m_max, temperature_2m_min, time, weathercode } =
      this.props.daily;

    return (
      <>
        <ul className="daily">
          {time.map((day, index) => {
            if (index === 0) {
              return null;
            }
            return (
              <div className="daily_weather" key={index}>
                <div className="daily_weather_box">
                  <div className="daily_weather_icon">
                    {getWeatherIcon(weathercode.at(index))}
                  </div>
                  <p>{formatDay(time.at(index))}</p>
                  <div>
                    <p className="daily_weather_temp">
                      {temperature_2m_min.at(index)}°C -
                      {temperature_2m_max.at(index)}°C
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </ul>
      </>
    );
  }
}

export default App;
