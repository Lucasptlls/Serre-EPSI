from prometheus_client import start_http_server, Gauge
import time
import random
import board
import adafruit_dht
from gpiozero import Buzzer

# --- Métriques Prometheus ---
temperature = Gauge('esp32_temperature_celsius', 'Température de la serre')
humidity = Gauge('esp32_humidity_percent', "Humidité de l'air")
light = Gauge('esp32_light_lux', 'Luminosité ambiante')
water_level = Gauge('esp32_water_level_percent', "Niveau d'eau du réservoir")

# --- DHT22 réel sur GPIO4 ---
dht_sensor = adafruit_dht.DHT22(board.D4)

# --- Bipeur sur GPIO18 ---
buzzer = Buzzer(18)

# --- Seuils d'alerte (à ajuster selon vos plantes) ---
TTEMP_MAX = 34.0
TEMP_MIN = 10.0
WATER_MIN = 15.0
HUMIDITY_MAX = 80.0

# --- Simulation en attendant les vrais capteurs luminosité/eau ---
state = {"light": 5000.0, "water": 70.0}

def read_dht22():
    try:
        temp_c = dht_sensor.temperature
        hum = dht_sensor.humidity
        if temp_c is not None:
            temperature.set(round(temp_c, 1))
        if hum is not None:
            humidity.set(round(hum, 1))
        print(f"DHT22 -> temp={temp_c}°C  hum={hum}%")
        return temp_c, hum
    except RuntimeError as e:
        print(f"Lecture DHT22 échouée (normal, on réessaiera) : {e}")
        return None, None

def simulate_light_and_water():
    state["light"] += random.uniform(-300, 300)
    state["water"] += random.uniform(-0.5, 0.2)
    state["light"] = max(0, min(20000, state["light"]))
    state["water"] = max(0, min(100, state["water"]))
    light.set(round(state["light"], 0))
    water_level.set(round(state["water"], 1))
    return state["water"]

def check_alerts(temp_c, hum, water_pct):
    alert = False
    if temp_c is not None and (temp_c > TEMP_MAX or temp_c < TEMP_MIN):
        print(f"Alerte température : {temp_c}°C")
        alert = True
    if hum is not None and hum > HUMIDITY_MAX:
        print(f"Alerte humidité élevée : {hum}%")
        alert = True
    if water_pct is not None and water_pct < WATER_MIN:
        print(f"Alerte niveau d'eau bas : {water_pct}%")
        alert = True

    if alert:
        buzzer.on()
    else:
        buzzer.off()

if __name__ == "__main__":
    start_http_server(8000)
    print("Exporter démarré sur le port 8000 (DHT22 réel + luminosité/eau simulées + bipeur)")
    try:
        while True:
            temp_c, hum = read_dht22()
            water_pct = simulate_light_and_water()
            check_alerts(temp_c, hum, water_pct)
            time.sleep(15)
    except KeyboardInterrupt:
        buzzer.off()
        print("Arrêt propre, bipeur coupé")
EOF
