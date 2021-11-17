import Scene from './scene';
import { checkArray, generateUUID, getDefaultOptions } from '../base';

/**
 * 基类
 */
class BaseClass {
  protected scene = null;

  protected objects = {};

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * 获取three对象场景
   */
  protected getScene() {
    return this.scene.getScene();
  }

  /**
   * 获取相机对象
   */
  protected getCamera() {
    return this.scene.getCamera();
  }

  /**
   * 获取容器对象
   */
  protected getContainer() {
    return this.scene.getContainer();
  }

  /**
   * 向场景中添加元素
   * @param obj 需要被添加的元素
   * @param options 元素的相关属性
   */
  protected addObj2Scene(obj, options) {
    const { id } = options;
    obj.name = id;
    obj.hopeData = options;
    this.scene.getGroup().add(obj);
    this.scene.setId(id);
    this.objects[id] = options;
  }

  /**
   * 检查参数
   * @param options
   */
  protected checkOptions(options: any) {
    options = getDefaultOptions(options);
    options.id = this.scene.getId(options.id);
    return options;
  }

  /**
   * 隐藏元素
   * @param id 元素id
   * @param props 元素的属性值
   */
  protected cacheObject(id: string, props = {}) {
    this.objects[id] = props;
  }

  /**
   * 获取隐藏元素
   * @param id 元素id
   */
  protected getCacheObject(id) {
    if (this.objects.hasOwnProperty(id)) {
      return this.objects[id];
    }
  }

  /**
   * 通过id获取某元素
   * @param id 元素id
   */
  protected get3Object(id) {
    return this.scene.getScene().getObjectByName(id);
  }

  /**
   * 通过id获取隐藏元素
   * @param id 元素id
   */
  protected getCache3Object(id) {
    if (this.objects.hasOwnProperty(id)) {
      return this.get3Object(id);
    }
  }

  private disposeMesh(obj) {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (obj.material.map) {
        obj.material.map.dispose();
      }
      obj.material.dispose();
    }
    // this.getScene().remove(obj);
    this.scene.getGroup().remove(obj);
  }

  /**
   * 通过id设置元素位置
   * @param id 元素id
   * @param position 位置参数 [positionX, positionY, positionZ]
   */
  setPosition(id: string, position: number[]) {
    if (this.objects.hasOwnProperty(id)) {
      const obj = this.getCache3Object(id);
      if (obj) {
        if (checkArray(position, 2, 'number')) {
          obj.position.set(position[0], position[2] || 0, position[1]);
        } else {
          console.error('invalid position');
        }
      }
    }
  }

  /**
   * 通过id设置元素旋转角度
   * @param id 元素id
   * @param rotation 旋转参数[rotationX, rotationY, rotationZ] 角度
   */
  setRotation(id: string, rotation: number[]) {
    if (this.objects.hasOwnProperty(id)) {
      const obj = this.getCache3Object(id);
      if (obj) {
        if (checkArray(rotation, 2, 'number')) {
          obj.rotation.set(
            (rotation[0] / 180) * Math.PI,
            ((rotation[2] || 0) / 180) * Math.PI,
            (rotation[1] / 180) * Math.PI
          );
        } else {
          console.error('invalid rotation');
        }
      }
    }
  }

  /**
   * 通过id移除元素
   * @param id 元素id
   */
  clear(id: string) {
    if (this.objects.hasOwnProperty(id)) {
      const obj = this.getCache3Object(id);
      if (obj) {
        if (obj.isMesh) {
          this.disposeMesh(obj);
          delete this.objects[id];
        } else {
          obj.traverse(child => {
            if (child.isMesh) {
              this.disposeMesh(child);
            }
          });
          this.scene.getGroup().remove(obj);
          delete this.objects[id];
        }
        this.scene.removeId(id);
      }
    }
  }

  /**
   * 移除所有元素
   */
  clearAll() {
    Object.keys(this.objects).forEach(key => {
      this.clear(key);
    });
  }

  /**
   * 通过id设置元素可见性
   * @param id 元素id
   * @param visible 是否可见
   */
  setVisible(id: any, visible: boolean) {}

  /**
   * 摧毁场景
   */
  destroy() {
    this.clearAll();
    this.scene = null;
  }
}

export default BaseClass;
