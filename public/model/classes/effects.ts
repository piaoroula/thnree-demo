import BaseClass from './baseClass';
import * as THREE from 'three/build/three.module.js';
import { Water } from '../custom/water/Water2';
import { WaterShapeOptions, WaterOptions } from '../interfaces';
import { checkArray } from '../base';

export default class Effects extends BaseClass {
  /**
   * 通过多边形绘制水面
   * @param options
   */
  renderWaterByShape(options: WaterShapeOptions) {
    options = this.checkOptions(options);
    let {
      id,
      positions,
      fillColor = '#fff',
      scale = 4,
      flowX = 1,
      flowY = 1,
      height = 0,
      reflectivity = 0.02,
    } = options;
    let waterShape = null;
    if (Array.isArray(positions) && positions.length > 2) {
      let tempArray = [];
      for (let i = 0; i < positions.length; i++) {
        if (checkArray(positions[i], 2, 'number')) {
          tempArray.push(new THREE.Vector2(positions[i][1], positions[i][0]));
        }
      }
      waterShape = new THREE.ShapeBufferGeometry(new THREE.Shape(tempArray));
    } else {
      console.error('invalid positions');
      return;
    }
    let maxUV = Math.max(...waterShape.attributes.uv.array);
    for (let i = 0; i < waterShape.attributes.uv.array.length; i++) waterShape.attributes.uv.array[i] /= maxUV;
    const water = new Water(waterShape, {
      color: fillColor,
      scale: scale,
      flowDirection: new THREE.Vector2(flowX, flowY),
      textureWidth: 1024,
      textureHeight: 1024,
      reflectivity,
    });

    // @ts-ignore
    water.position.y = height;
    // @ts-ignore
    water.rotation.x = Math.PI * -0.5;
    // @ts-ignore
    water.rotation.z = (Math.PI * 3) / 2;
    this.addObj2Scene(water, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 通过位置数组绘制水面
   * @param options
   */
  renderWater(options: WaterOptions) {
    options = this.checkOptions(options);
    let { id, positionsArray, fillColor = '#fff', scale = 4, flowX = 1, flowY = 1, reflectivity = 0.02 } = options;
    let height = 0;
    let pointsArray = [];

    //判断所有面的最高点
    for (let i = 0; i < positionsArray.length; i++) {
      const positions = positionsArray[i];
      for (let j = 0; j < positions.length; j++) {
        const position = positions[j];
        if (typeof position[2] === 'number' && position[2] > height) {
          height = position[2];
        }
      }
    }

    for (let j = 0; j < positionsArray.length; j++) {
      const positions = positionsArray[j];
      let _height = 0,
        tj = true;
      //判断一个面内的最高点
      positions.forEach(t => {
        if (tj && t[2]) {
          _height = t[2];
          tj = false;
        }
        if (!tj && t[2] > _height) {
          _height = t[2];
        }
      });
      if (Array.isArray(positions) && positions.length > 2) {
        let points = [];
        for (let i = 0; i < positions.length; i++) {
          if (checkArray(positions[i], 2, 'number')) {
            points.push(positions[i][0], -positions[i][1], _height - height);
          }
        }
        pointsArray.push(points);
      } else {
        console.error('invalid positions');
        return;
      }
    }
    let waterGeometray;
    waterGeometray = new THREE.BufferGeometry();
    // @ts-ignore
    waterGeometray.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pointsArray.flat()), 3));
    let beginIndex = 0,
      index = [],
      uv = [];
    for (let i = 0; i < pointsArray.length; i++) {
      const points = pointsArray[i];
      for (let i = 0; i < points.length / 3 - 2; i++) index.push(beginIndex, beginIndex + i + 1, beginIndex + i + 2);
      beginIndex += points.length / 3;
      let max = { x: points[0], y: points[1] };
      let min = { x: points[0], y: points[1] };
      for (let i = 1; i < points.length / 3; i++) {
        if (points[i * 3] > max.x) max.x = points[i * 3];
        else if (points[i * 3] < min.x) min.x = points[i * 3];
        if (points[i * 3 + 1] > max.y) max.y = points[i * 3 + 1];
        else if (points[i * 3 + 1] < min.y) min.y = points[i * 3 + 1];
      }
      let lengthX = max.x - min.x,
        lengthY = max.y - min.y;
      for (let i = 0; i < points.length / 3; i++) {
        uv.push((points[i * 3] - min.x) / lengthX, (points[i * 3 + 1] - min.y) / lengthY);
      }
    }
    waterGeometray.setIndex(index);
    waterGeometray.computeVertexNormals();
    waterGeometray.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
    const water = new Water(waterGeometray, {
      color: fillColor,
      scale: scale,
      flowDirection: new THREE.Vector2(flowX, flowY),
      textureWidth: 1024,
      textureHeight: 1024,
      reflectivity,
    });

    // @ts-ignore
    water.rotation.x = Math.PI * -0.5;
    // @ts-ignore
    water.position.y = height;
    this.addObj2Scene(water, options);
    this.cacheObject(id, options);
    return id;
  }
}
