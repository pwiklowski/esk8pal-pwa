import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

export enum DeviceState {
  STATE_PARKED,
  STATE_RIDING,
  STATE_CHARGING,
}

export interface CurrentState {
  current?: number;
  voltage?: number;
  used_energy?: number;
  total_energy?: number;

  speed?: number;
  latitude?: number;
  longitude?: number;

  trip_distance?: number;

  altitude?: number;

  riding_time?: number;

  gps_fix_status?: number;
  gps_satelites_count?: number;

  riding_state?: DeviceState;

  free_storage?: number;
  total_storage?: number;
}

@Injectable({
  providedIn: 'root',
})
export class BleService {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  services: Array<BluetoothRemoteGATTService>;

  state: CurrentState;
  state$ = new Subject<CurrentState>();
  connected$ = new BehaviorSubject<boolean>(false);
  isDiscoverable$ = new BehaviorSubject<boolean>(false);
  abortController = new AbortController();

  DEVICE_LOSS_TIMEOUT = 5000;
  deviceLossTimout;

  interval;

  CHAR_VOLTAGE = '0000ff01-0000-1000-8000-00805f9b34fb';
  CHAR_CURRENT = '0000ff02-0000-1000-8000-00805f9b34fb';
  CHAR_USED_ENERGY = '0000ff03-0000-1000-8000-00805f9b34fb';
  CHAR_TOTAL_ENERGY = '0000ff04-0000-1000-8000-00805f9b34fb';

  CHAR_APP_STATE = '0000ff01-0000-1000-8000-00805f9b34fb';

  CHAR_LATITUDE = '0000fe01-0000-1000-8000-00805f9b34fb';
  CHAR_LONGITUDE = '0000fe02-0000-1000-8000-00805f9b34fb';
  CHAR_SPEED = '0000fe03-0000-1000-8000-00805f9b34fb';
  CHAR_TRIP_DISTANCE = '0000fe04-0000-1000-8000-00805f9b34fb';

  CHAR_GPS_FIX = '0000fe05-0000-1000-8000-00805f9b34fb';
  CHAR_GPS_SATELLITE_COUNT = '0000fe06-0000-1000-8000-00805f9b34fb';

  CHAR_RIDE_STATE = '0000fd01-0000-1000-8000-00805f9b34fb';
  CHAR_MANUAL_RIDE_START = '0000fd02-0000-1000-8000-00805f9b34fb';
  CHAR_WIFI_SSID = '0000fd03-0000-1000-8000-00805f9b34fb';
  CHAR_WIFI_PASS = '0000fd04-0000-1000-8000-00805f9b34fb';
  CHAR_WIFI_ENABLED = '0000fd05-0000-1000-8000-00805f9b34fb';

  CHAR_FREE_STORAGE = '0000fd06-0000-1000-8000-00805f9b34fb';
  CHAR_TOTAL_STORAGE = '0000fd07-0000-1000-8000-00805f9b34fb';

  CHAR_TIME = '0000fd08-0000-1000-8000-00805f9b34fb';

  SERVICE_BATTERY = '000000ff-0000-1000-8000-00805f9b34fb';
  SERVICE_LOCATION = '000000fe-0000-1000-8000-00805f9b34fb';
  SERVICE_SETTINGS = '000000fd-0000-1000-8000-00805f9b34fb';
  SERVICE_STATE = '000000fc-0000-1000-8000-00805f9b34fb';

  async init() {
    let devices = await navigator.bluetooth.getDevices();
    console.log('init', devices);
    if (devices.length > 0) {
      const device = devices[0];
      await this.watchForAdvertisments(device);
    }
  }

  async watchForAdvertisments(device) {
    this.abortController = new AbortController();
    device.addEventListener('advertisementreceived', this.advertismentReceived.bind(this));
    await device.watchAdvertisements({ signal: this.abortController.signal });
  }
  async unwatchForAdvertisments() {
    this.device.removeEventListener('advertisementreceived', this.advertismentReceived.bind(this));
    this.abortController.abort();
  }

  async advertismentReceived(event: any) {
    console.log('Device Name: ' + event.device.name);
    this.isDiscoverable$.next(true);

    clearInterval(this.deviceLossTimout);
    this.deviceLossTimout = setTimeout(() => {
      this.isDiscoverable$.next(false);
    }, this.DEVICE_LOSS_TIMEOUT);
  }

  async isPaired() {
    let devices = await navigator.bluetooth.getDevices();
    return devices.length > 0;
  }

  async scanAndConnect() {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'esk8-logger' }],
      optionalServices: [this.SERVICE_BATTERY, this.SERVICE_LOCATION, this.SERVICE_SETTINGS, this.SERVICE_STATE],
    });

    this.connect(device);
  }

  async connectToDevice() {
    let devices = await navigator.bluetooth.getDevices();
    console.log('init', devices);
    if (devices.length > 0) {
      this.connect(devices[0]);
    }
  }

  async connect(device) {
    this.device = device;

    this.unwatchForAdvertisments();

    console.log('Connecting to GATT Server...', this.device);
    this.server = await this.device.gatt.connect();
    this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
    this.refreshState();
    this.connected$.next(true);

    await this.getServices();
  }

  refreshState() {
    this.readState();
    clearTimeout(this.interval);
    if (this.server.connected) {
      this.interval = setTimeout(() => {
        this.refreshState();
      }, this.getReadInterval());
    }
  }

  getReadInterval() {
    if (this.state?.riding_state == DeviceState.STATE_RIDING) {
      return 1000;
    } else {
      return 3000;
    }
  }

  onDisconnected() {
    console.log('on disconnected');
    this.connected$.next(false);
    this.init();
  }

  async observerState() {
    const service = await this.server.getPrimaryService(this.SERVICE_STATE);
    const char = await service.getCharacteristic(this.CHAR_APP_STATE);
    const sub = await char.startNotifications();

    sub.addEventListener('characteristicvaluechanged', this.stateUpdateHandler.bind(this));
  }

  async stateUpdateHandler({ target }) {
    console.log(target.uuid, target.service.uuid, target.value.byteLength);
    const value: DataView = target.value;
    this.handleStateData(value);
  }

  handleStateData(value) {
    let state: CurrentState = {};
    let offset = 0;
    try {
      state.current = value.getFloat64(offset, true);
      offset += 8;

      state.voltage = value.getFloat64(offset, true);
      offset += 8;
      state.used_energy = value.getFloat64(offset, true);
      offset += 8;
      state.total_energy = value.getFloat64(offset, true);
      offset += 8;

      state.speed = value.getFloat64(offset, true);
      offset += 8;
      (state.latitude = value.getFloat64(offset)), true;
      offset += 8;
      (state.longitude = value.getFloat64(offset)), true;
      offset += 8;
      state.trip_distance = value.getFloat64(offset, true);
      offset += 8;
      state.altitude = value.getFloat64(offset, true);
      offset += 8;

      state.riding_time = value.getUint32(offset, true);
      offset += 4;

      state.gps_fix_status = value.getUint8(offset);
      offset += 1;
      state.gps_satelites_count = value.getUint8(offset);
      offset += 1;

      state.riding_state = value.getUint8(offset);
      offset += 1;

      state.free_storage = value.getUint32(offset, true);
      offset += 4;
      state.total_storage = value.getUint32(offset, true);
      offset += 4;
    } catch (e) {
      console.error(e);
    }
    this.state = state;
    this.state$.next(state);
  }

  async disconnect() {
    this.server.disconnect();
  }

  async startRide() {
    const data = Uint8Array.of(1);

    await (
      await (await this.server.getPrimaryService(this.SERVICE_SETTINGS)).getCharacteristic(this.CHAR_RIDE_STATE)
    ).writeValue(data);
  }

  async stopRide() {
    const data = Uint8Array.of(0);

    await (
      await (await this.server.getPrimaryService(this.SERVICE_SETTINGS)).getCharacteristic(this.CHAR_RIDE_STATE)
    ).writeValue(data);

    this.refreshState();
  }

  async getServices() {
    this.services = await this.server.getPrimaryServices();
    this.services.forEach(async (service) => {
      console.log('> Service: ' + service.uuid);
    });
  }

  async getCharacteristics() {
    this.services.forEach(async (service) => {
      const characteristics = await service.getCharacteristics();

      console.log('> Service: ' + service.uuid);

      characteristics.forEach(async (characteristic) => {
        //const value = await characteristic.readValue();
        console.log('>> Characteristic: ' + characteristic.uuid + ' ' + this.getSupportedProperties(characteristic));
      });
    });
  }

  async readValue(serviceUuid: string, characteristicUuid: string) {
    //TODO optimize it by storing characterisic references
    const service = await this.server.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    const value = await characteristic.readValue();
    return value;
  }

  getSupportedProperties(characteristic) {
    let supportedProperties = [];
    for (const p in characteristic.properties) {
      if (characteristic.properties[p] === true) {
        supportedProperties.push(p.toUpperCase());
      }
    }
    return '[' + supportedProperties.join(', ') + ']';
  }

  async readState() {
    const state = await this.readValue(this.SERVICE_STATE, this.CHAR_APP_STATE);
    this.handleStateData(state);
  }
}
