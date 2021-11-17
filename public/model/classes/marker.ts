import BaseClass from './baseClass';
import * as THREE from 'three/build/three.module.js';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { checkArray, getScale } from '../base';
import Scene from './scene';
import { SpriteMarkerOption, CSS2DMarkerOption, EffectScatterOption } from '../interfaces';
// import '../styles/marker.global.css';

export default class Marker extends BaseClass {
  private readonly textureLoader = new THREE.TextureLoader();

  private readonly maps = {};

  constructor(scene: Scene) {
    super(scene);

    const update = () => {
      const camera = this.getCamera();
      const container = this.getContainer();
      Object.keys(this.objects).forEach(key => {
        const obj = this.get3Object(key);
        const $div = document.getElementById(key);
        if (obj && $div) {
          const sp = JSON.parse(
            `[${$div.parentElement.parentElement.style.transform
              .split('translate')[2]
              .replace(/px/g, '')
              .replace('(', '')
              .replace(')', '')}]`
          );
          if (sp[0] >= 0 && sp[0] <= container.clientWidth && sp[1] >= 0 && sp[1] <= container.clientHeight) {
            const dis = Math.sqrt(
              Math.pow(camera.position.x - obj.position.x, 2) +
                Math.pow(camera.position.y - obj.position.y, 2) +
                Math.pow(camera.position.z - obj.position.z, 2)
            );
            // @ts-ignore
            const viewDistance = JSON.parse(`[${$div.attributes.viewdistance.nodeValue}]`);
            if (dis >= viewDistance[0] && dis <= viewDistance[1]) {
              $div.style.zIndex = `${Math.floor(99999999 - dis)}`;
              $div.style.display = '';
            } else {
              $div.style.display = 'none';
            }
          } else {
            $div.style.display = 'none';
          }
        }
      });
      requestAnimationFrame(update);
    };

    update();
  }

  private getMap(image: string) {
    if (!this.maps.hasOwnProperty(image)) {
      this.maps[image] = this.textureLoader.load(image);
    }
    return this.maps[image];
  }

  private getString({
    id,
    className = '',
    classOut = '',
    cssText = '',
    innerHTML = '',
    leftOffset = 0,
    bottomOffset = 0,
    viewDistance = [0, 200],
  }: any) {
    const str = `<div style="position: absolute;width: 0;height: 0;left: ${leftOffset}px;bottom: ${bottomOffset}px;"><div id="${id}" classout="${classOut}" viewdistance="${viewDistance}" class="${className}">${innerHTML.replace(
      /[\r\n]/g,
      ''
    )}</div></div>`;
    return str;
  }

  private createCSS2DObject(id, innerHTML, className, viewDistance) {
    const $div = document.createElement('div');
    $div.style.display = 'none';
    $div.style.marginTop = '0';
    $div.innerHTML = this.getString({ id, innerHTML, className, viewDistance });
    $div.onclick = () => {
      const options = this.getCacheObject(id);
      if (options && typeof options.onclick === 'function') {
        options.onclick(options);
      }
    };
    return new CSS2DObject($div);
  }

  /**
   * 渲染精灵标注
   * @param options
   */
  renderMarker(options: SpriteMarkerOption) {
    options = this.checkOptions(options);
    let { id, image, scale, position } = options;
    if (!checkArray(position, 2, 'number')) {
      console.error('invalid position');
      return;
    }
    if (typeof image !== 'string') {
      console.error('invalid image');
      return;
    }
    scale = getScale(scale);
    const material = new THREE.SpriteMaterial({ map: this.getMap(image), fog: true });
    const obj = new THREE.Sprite(material);
    obj.position.set(position[0], position[2] || 0, position[1]);
    obj.center.set(0.5, 0);
    obj.scale.set(scale, scale, 1);
    this.addObj2Scene(obj, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 渲染叠加层标注
   * @param options
   */
  renderOverlayMarker(options: CSS2DMarkerOption) {
    options = this.checkOptions(options);
    let {
      id,
      image,
      scale,
      color = '#0ff',
      withoutLine = true,
      fromLine = 0,
      lineLength = 100,
      position,
      flashing = false,
      title = '',
      flexible = false,
      viewDistance,
    } = options;
    if (!checkArray(position, 2, 'number')) {
      console.error('invalid position');
      return;
    }
    const innerHTML = `<div class="${flashing ? 'outer-circle' : ''}" style="color: ${color};"><div class="${
      flexible ? 'marker-animation-line' : ''
    }" style="margin-bottom: ${fromLine}px;display: flex;flex-direction: column;align-items: center;justify-content: flex-end;"><div style="white-space: nowrap;white-space: nowrap;font-size: 14px;color: white;border-radius: 2px;background: rgba(0,0,0,0.6);padding: 0 5px;">${title}</div><img src="${image}" style="zoom: ${getScale(
      scale
    )};cursor: pointer;" /></div><div style="display: ${withoutLine ? 'none' : 'block'};min-height: ${
      typeof lineLength === 'number' && lineLength > 0 ? lineLength : 100
    }px"></div>`;
    const obj = this.createCSS2DObject(id, innerHTML, 'marker-overlay', viewDistance);
    obj.position.set(position[0], position[2] || 0, position[1]);
    this.addObj2Scene(obj, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 添加自定义样式标注
   * @param options
   */
  renderEffectScatter(options: EffectScatterOption) {
    options = this.checkOptions(options);
    let { id, color = '', position } = options;
    if (!checkArray(position, 2, 'number')) {
      console.error('invalid position');
      return;
    }
    const innerHTML = `<div id="${id}"><div class="marker-animation-point" style="color: ${color ||
      '#0cffff'}"><p></p></div></div>`;
    const obj = this.createCSS2DObject(id, innerHTML, 'marker-ap', [0, 99999999999999]);
    obj.position.set(position[0], position[2] || 0, position[1]);
    this.addObj2Scene(obj, options);
    this.cacheObject(id, options);
    return id;
  }
}
