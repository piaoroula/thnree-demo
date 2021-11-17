import BaseClass from './baseClass';
import * as THREE from 'three/build/three.module.js';
import { checkArray } from '../base';
import { LightOptions } from '../interfaces';

export default class Light extends BaseClass {
  /**
   * 添加光源
   * @param options
   */
  addLight(options: LightOptions) {
    options = this.checkOptions(options);
    let light;
    let {
      type,
      id,
      color = '#fff',
      intensity = 1,
      position,
      distance = 1000,
      angle = 60,
      target = [0, 0, 0],
    } = options;
    switch (type) {
      case 'AmbientLight':
        light = new THREE.AmbientLight(new THREE.Color(color), intensity);
        break;
      case 'DirectionalLight':
        light = new THREE.DirectionalLight(new THREE.Color(color), intensity);
        break;
      case 'PointLight':
        if (!checkArray(position, 2, 'number')) {
          console.error('invalid position');
          return;
        }
        light = new THREE.PointLight(new THREE.Color(color), intensity, distance);
        light.position.set(position[0], position[2] || 0, position[1]);
        break;
      case 'SpotLight':
        if (!checkArray(position, 2, 'number')) {
          console.error('invalid position');
          return;
        }
        if (!checkArray(target, 2, 'number')) {
          console.warn('invalid target');
          target = [0, 0, 0];
        }
        light = new THREE.SpotLight(new THREE.Color(color), intensity, distance, (angle / 180) * Math.PI);
        light.position.set(position[0], position[2] || 0, position[1]);
        light.target.position.set(target[0], target[2] || 0, target[1]);
        this.getScene().add(light.target);
        break;
      default:
        console.error('invalid type');
        return;
    }
    light.name = id;
    light.hopeData = options;
    if (type !== 'AmbientLight') {
      light.castShadow = true;
      if (light.shadow) {
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.far = 2048;
      }
    }
    this.addObj2Scene(light, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 根据id设置光照强度
   * @param id 光源id
   * @param intensity 光照强度
   */
  setIntensity(id: string, intensity: number) {
    if (typeof intensity === 'number' && this.objects.hasOwnProperty(id)) {
      const obj = this.getCache3Object(id);
      if (obj) {
        obj.intensity = intensity;
      }
    }
  }

  /**
   * 根据id设置光照颜色
   * @param id 光源id
   * @param color 光的颜色
   */
  setColor(id: string, color: string) {
    if (typeof color === 'string' && this.objects.hasOwnProperty(id)) {
      const obj = this.getCache3Object(id);
      if (obj) {
        obj.color = new THREE.Color(color);
      }
    }
  }

  /**
   * 根据id移除光源
   * @param id 光源id
   */
  clear(id: string) {
    if (this.objects.hasOwnProperty(id)) {
      const obj = this.getCache3Object(id);
      if (obj) {
        if (obj.target) {
          this.getScene().remove(obj.target);
        }
        this.getScene().remove(obj);
        delete this.objects[id];
      }
    }
  }
}
