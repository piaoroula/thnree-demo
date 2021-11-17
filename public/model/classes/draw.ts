import BaseClass from './baseClass';
import {
  PolylineVolumeOptions,
  PolylineOptions,
  PolygonOptions,
  PointOptions,
  EllipsoidOptions,
  CylinderOptions,
} from '../interfaces';
import * as THREE from 'three/build/three.module.js';
import PointMaterial from '../custom/materials/PointMaterial';
import FlowingMaterial from '../custom/materials/FlowingMaterial';
import { checkArray, parseColor } from '../base';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import Scene from './scene';

export default class Draw extends BaseClass {
  private materials = {};

  constructor(scene: Scene) {
    super(scene);
    const update = () => {
      Object.values(this.materials).forEach(material => {
        // @ts-ignore
        material.resolution.set(window.innerWidth, window.innerHeight);
      });
      requestAnimationFrame(update);
    };

    update();
  }

  /**
   * 绘制点
   * @param options
   */
  renderPoint(options: PointOptions) {
    options = this.checkOptions(options);
    let { id, position, color = '#fff', size = 5 } = options;
    if (!checkArray(position, 2, 'number')) {
      console.error('invalid position');
      return;
    }
    if (typeof size !== 'number') {
      console.warn('invalid size');
      size = 5;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([position[0], position[2] || 0, position[1]], 3)
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(parseColor(color), 4));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute([size], 1));
    const material = new PointMaterial();
    const mesh = new THREE.Points(geometry, material);
    mesh.renderOrder = -1;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    this.addObj2Scene(mesh, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 绘制线
   * @param options
   */
  renderPolyline(options: PolylineOptions) {
    options = this.checkOptions(options);
    let { id, positions, color = '#fff', lineWidth = 1, dashSize, gapSize } = options;
    const points = [];
    if (Array.isArray(positions) && positions.length >= 2) {
      positions.forEach(p => {
        if (checkArray(p, 2, 'number')) {
          points.push(new THREE.Vector3(p[0], p[2] || 0, p[1]));
        } else {
          console.error('invalid positions');
          return;
        }
      });
    } else {
      console.error('invalid positions');
      return;
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material =
      dashSize === undefined && gapSize === undefined
        ? new THREE.LineBasicMaterial({ color: new THREE.Color(color), linewidth: lineWidth })
        : new THREE.LineDashedMaterial({
            color: new THREE.Color(color),
            linewidth: lineWidth,
            scale: 1,
            dashSize: dashSize || 3,
            gapSize: gapSize || 1,
          });
    const mesh = new THREE.Line(geometry, material);
    mesh.computeLineDistances();
    this.addObj2Scene(mesh, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 绘制虚线
   * @param options
   */
  renderFatPolyline(options: PolylineOptions) {
    options = this.checkOptions(options);
    let { id, positions, color = '#fff', lineWidth = 5, dashSize, gapSize } = options;
    const points = [];
    const nc = parseColor(color);
    const colors = [];
    if (Array.isArray(positions) && positions.length >= 2) {
      positions.forEach(p => {
        if (checkArray(p, 2, 'number')) {
          points.push(p[0], p[2] || 0, p[1]);
          colors.push(nc[0] / 255, nc[1] / 255, nc[2] / 255);
        } else {
          console.error('invalid positions');
          return;
        }
      });
    } else {
      console.error('invalid positions');
      return;
    }
    const geometry = new LineGeometry();
    geometry.setPositions(points);
    geometry.setColors(colors);
    const material = new LineMaterial({
      linewidth: lineWidth,
      vertexColors: true,
    });
    if (!(dashSize === undefined && gapSize === undefined)) {
      material.defines.USE_DASH = '';
      material.dashSize = dashSize || 3;
      material.gapSize = gapSize || 1;
      material.needsUpdate = true;
    } else {
      delete material.defines.USE_DASH;
    }
    this.materials[id] = material;
    const mesh = new Line2(geometry, material);
    mesh.computeLineDistances();
    mesh.scale.set(1, 1, 1);
    this.addObj2Scene(mesh, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 绘制管道
   * @param options
   */
  renderPolylineVolume(options: PolylineVolumeOptions) {
    options = this.checkOptions(options);
    let { id, positions, color = '#fff', radius = 1, segments = 25, flowingImage, speedX = 1, speedY = 0 } = options;
    const points = [];
    if (Array.isArray(positions) && positions.length >= 2) {
      positions.forEach(p => {
        if (checkArray(p, 2, 'number')) {
          points.push(new THREE.Vector3(p[0], p[2] || 0, p[1]));
        } else {
          console.error('invalid positions');
          return;
        }
      });
    } else {
      console.error('invalid positions');
      return;
    }
    const geometry = new THREE.TubeBufferGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 24, false);
    let material;
    if (flowingImage) {
      material = new FlowingMaterial({ speedX, speedY });
      material.lights = true;
      material.map = new THREE.TextureLoader().load(flowingImage);
      material.uniforms.map.value = material.map;
      material.map.wrapS = THREE.RepeatWrapping;
      material.map.wrapT = THREE.RepeatWrapping;
      material.map.repeat.x = 15;
      material.map.repeat.y = 4;
    } else {
      material = new THREE.MeshLambertMaterial({ color: new THREE.Color(color), side: THREE.DoubleSide });
    }
    const mesh = new THREE.Mesh(geometry, material);
    this.addObj2Scene(mesh, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 绘制多边形
   * @param options
   */
  renderPolygon(options: PolygonOptions) {
    options = this.checkOptions(options);
    let { id, positions, fillColor = '#fff' } = options;
    const points = [];
    if (Array.isArray(positions) && positions.length >= 3) {
      for (let i = 1; i < positions.length - 1; i++) {
        if (checkArray(positions[0], 2, 'number')) {
          points.push(positions[0][0], positions[0][2] || 0, positions[0][1]);
        } else {
          console.error('invalid positions');
          return;
        }
        if (checkArray(positions[i], 2, 'number')) {
          points.push(positions[i][0], positions[i][2] || 0, positions[i][1]);
        } else {
          console.error('invalid positions');
          return;
        }
        if (checkArray(positions[i + 1], 2, 'number')) {
          points.push(positions[i + 1][0], positions[i + 1][2] || 0, positions[i + 1][1]);
        } else {
          console.error('invalid positions');
          return;
        }
      }
    } else {
      console.error('invalid positions');
      return;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(fillColor), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    this.addObj2Scene(mesh, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 绘制球体
   * @param options
   */
  renderEllipsoid(options: EllipsoidOptions) {
    options = this.checkOptions(options);
    let { id, radius = 1, position, rotation = [0, 0, 0], color = '#fff' } = options;
    if (!checkArray(position, 2, 'number')) {
      console.error('invalid position');
      return;
    }
    if (!checkArray(rotation, 2, 'number')) {
      console.warn('invalid rotation');
      rotation = [0, 0, 0];
    }
    const geometry = new THREE.SphereBufferGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[2] || 0, position[1]);
    mesh.rotation.set(rotation[0], rotation[2] || 0, rotation[1]);
    this.addObj2Scene(mesh, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 绘制椎体
   * @param options
   */
  renderCylinder(options: CylinderOptions) {
    options = this.checkOptions(options);
    let { id, height = 1, topRadius = 1, bottomRadius = 0, position, rotation = [0, 0, 0], color = '#fff' } = options;
    if (!checkArray(position, 2, 'number')) {
      console.error('invalid position');
      return;
    }
    if (!checkArray(rotation, 2, 'number')) {
      console.warn('invalid rotation');
      rotation = [0, 0, 0];
    }
    const geometry = new THREE.CylinderBufferGeometry(topRadius, bottomRadius, height, 32);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[2] || 0, position[1]);
    mesh.rotation.set(rotation[0], rotation[2] || 0, rotation[1]);
    this.addObj2Scene(mesh, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 根据id清除元素
   * @param id 元素id
   */
  clear(id: string) {
    super.clear(id);
    delete this.materials[id];
  }
}
