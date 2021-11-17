import BaseClass from './baseClass';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { checkArray } from '../base';
import Scene from './scene';
import { PopupOption } from '../interfaces';
// import '../styles/popup.global.css';

export default class Popup extends BaseClass {
  constructor(scene: Scene) {
    super(scene);

    const update = () => {
      const camera = this.getCamera();
      Object.keys(this.objects).forEach(key => {
        const obj = this.get3Object(key);
        const $div = document.getElementById(key);
        if (obj && $div) {
          const dis = Math.sqrt(
            Math.pow(camera.position.x - obj.position.x, 2) +
              Math.pow(camera.position.y - obj.position.y, 2) +
              Math.pow(camera.position.z - obj.position.z, 2)
          );
          // @ts-ignore
          const classOut = $div.attributes.classout.nodeValue;
          // @ts-ignore
          const viewDistance = JSON.parse(`[${$div.attributes.viewdistance.nodeValue}]`);
          if (dis >= viewDistance[0] && dis <= viewDistance[1]) {
            $div.style.zIndex = `${Math.floor(99999999 + viewDistance[1] - dis)}`;
            $div.className = $div.className.replace(' ' + classOut, '');
          } else {
            if (classOut !== '' && $div.className.indexOf(' ' + classOut) < 0) {
              $div.className += ' ' + classOut;
            }
          }
        }
      });
      requestAnimationFrame(update);
    };

    update();
  }

  /**
   * 渲染弹出框
   * @param options 
   */
  renderPopup(options: PopupOption) {
    options = this.checkOptions(options);
    let {
      id,
      title,
      content = '',
      height,
      width,
      style,
      viewDistance = [0, 200],
      color,
      withoutLine,
      offset = [0, 0],
      position,
    } = options;
    if (!checkArray(position, 2, 'number')) {
      console.error('invalid position');
      return;
    }
    if (!checkArray(offset, 2, 'number')) {
      console.error('invalid offset');
      offset = [0, 0];
      options.offset = offset;
    }
    if (!checkArray(viewDistance, 2, 'number')) {
      console.error('invalid viewDistance');
      viewDistance = [0, 200];
      options.viewDistance = viewDistance;
    }
    const $div = document.createElement('div');
    $div.style.display = 'none';
    $div.style.marginTop = '0';
    $div.innerHTML = this.getInnerHTML({
      id,
      title,
      style,
      content,
      height,
      width,
      offset,
      viewDistance,
      color,
      withoutLine,
    });
    const obj = new CSS2DObject($div);
    obj.position.set(position[0], position[2] || 0, position[1]);
    this.addObj2Scene(obj, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 渲染3D弹出框
   * @param options 
   */
  renderPopup3D(options: PopupOption) {
    options = this.checkOptions(options);
    let {
      id,
      title,
      content = '',
      height,
      width,
      style,
      viewDistance = [0, 200],
      color,
      withoutLine,
      offset = [0, 0],
      position,
    } = options;
    if (!checkArray(position, 2, 'number')) {
      console.error('invalid position');
      return;
    }
    if (!checkArray(offset, 2, 'number')) {
      console.error('invalid offset');
      offset = [0, 0];
      options.offset = offset;
    }
    if (!checkArray(viewDistance, 2, 'number')) {
      console.error('invalid viewDistance');
      viewDistance = [0, 200];
      options.viewDistance = viewDistance;
    }
    const $div = document.createElement('div');
    $div.style.display = 'none';
    $div.style.marginTop = '0';
    $div.innerHTML = this.getInnerHTML({
      id,
      title,
      style,
      content,
      height,
      width,
      offset,
      viewDistance,
      color,
      withoutLine,
    });
    const obj = new CSS3DObject($div);
    obj.position.set(position[0], position[2] || 0, position[1]);
    this.addObj2Scene(obj, options);
    this.cacheObject(id, options);
    return id;
  }

  /**
   * 根据id设置弹出框内容
   * @param id 弹出框id
   * @param content 弹出框内容
   */
  setContentById(id: string, content: string) {
    if (this.objects.hasOwnProperty(id)) {
      const obj = this.getCache3Object(id);
      if (obj) {
        // obj.element.innerHTML = this.getInnerHTML(obj.hopeData);
        const el = document.getElementById(`${id}-contentHtml`);
        if (el) {
          el.innerHTML = content;
          obj.hopeData.content = content;
        }
      }
    }
  }

  private getInnerHTML({ id, style, title, content, height, width, offset, viewDistance, color, withoutLine }) {
    if (!offset) {
      offset = [0, 0];
    }
    if (!viewDistance) {
      viewDistance = [0, 200];
    }
    switch (style) {
      case 0:
        return this.getInnerHTML0({ id, content, offset, viewDistance });
      case 1:
        return this.getInnerHTML1({ id, content, height, width, offset, viewDistance, color });
      case 2:
        return this.getInnerHTML2({ id, title, content, offset, viewDistance, color, withoutLine });
      case 3:
        return this.getInnerHTML3({ id, title, content, offset, viewDistance, color, withoutLine });
      default:
        return this.getInnerHTMLDft({ id, content, height, width, offset, viewDistance });
    }
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

  private getInnerHTMLDft({ id, content, height, width, offset, viewDistance }) {
    const contentWidth = typeof width === 'number' ? `${width}px` : 'auto';
    const contentHeight = typeof height === 'number' && height >= 10 ? height : 88;
    const bgSizeWidth = ((contentHeight / 88) * 385).toFixed(0);
    const arrowWidth = contentHeight >= 88 ? 19 : 15;
    const arrowHeight = contentHeight >= 88 ? 44 : 33;
    const arrowStyle = `width: ${arrowWidth}px;height: ${arrowHeight}px;left: -4px;bottom: 0;`;
    const contentStyle = `width: ${contentWidth};height: ${contentHeight}px;bottom: ${arrowHeight - 1}px;left: -${
      contentHeight >= 88 ? 25 : 15
    }px;background-size: ${bgSizeWidth}px 100%;`;
    return this.getString({
      id,
      className: 'dft',
      classOut: 'dftOut',
      cssText: '',
      innerHTML: `<div><div style="${arrowStyle}"></div><div style="${contentStyle}" id="${id}-contentHtml">${content}</div></div>`,
      leftOffset: offset[0],
      bottomOffset: -offset[1],
      viewDistance,
    });
  }

  private getInnerHTML0({ id, content, offset, viewDistance }) {
    return this.getString({
      id,
      className: 'style0',
      classOut: 'style0Out',
      innerHTML: `<div>${content}</div>`,
      leftOffset: offset[0],
      bottomOffset: -offset[1],
      viewDistance,
    });
  }

  private getInnerHTML1({ id, content, height = 'auto', width = 'auto', offset, viewDistance, color = '#26f4fc' }) {
    const w = typeof width === 'number' ? width + 'px' : width;
    const h = typeof height === 'number' ? height + 'px' : height;
    return this.getString({
      id,
      className: 'style1',
      classOut: 'style1Out',
      innerHTML: `<div><div class="style-1" style="color: ${color};"><div></div><div><div></div><div></div><div></div><div><div></div><div></div><div></div><div></div><div></div><div style="width: ${w};height: ${h};" id="${id}-contentHtml">${content}</div></div></div></div></div>`,
      leftOffset: offset[0],
      bottomOffset: -offset[1],
      viewDistance,
    });
  }

  private getInnerHTML2({ id, title, content, offset, viewDistance, color = '#DCA91B', withoutLine = false }) {
    const display = withoutLine ? 'none' : 'block';
    const left = withoutLine ? 0 : 37;
    const bottom = withoutLine ? 0 : 35;
    return this.getString({
      id,
      className: 'style2',
      classOut: 'style2Out',
      innerHTML: `<div><div class="style-2" style="color: ${color};"><div style="display: ${display};"></div><div style="left: ${left}px;bottom: ${bottom}px;"><div><div><div>${title}</div></div><div><div id="${id}-contentHtml">${content}</div></div></div></div></div></div>`,
      leftOffset: offset[0],
      bottomOffset: -offset[1],
      viewDistance,
    });
  }

  private getInnerHTML3({ id, title, content, offset, viewDistance, color = '#DCA91B', withoutLine = false }) {
    return this.getString({
      id,
      className: 'style3',
      classOut: 'style3Out',
      innerHTML: `<div>
        <div class="style-3" style="color: ${color};">
          <div>
            <div><div>${title}</div></div>
            <div></div>
            <div><div id="${id}-contentHtml">${content}</div></div>         
          </div>
          <div style="${withoutLine ? 'height: 0 !important;' : ''}"></div>
        </div>
      </div>`,
      leftOffset: offset[0],
      bottomOffset: -offset[1],
      viewDistance,
    });
  }
}
