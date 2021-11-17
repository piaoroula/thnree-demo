import * as THREE from "three";

/**绘制文字 */
function createCanvas(data) {
  /* 创建画布 */
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  // context.scale(2, 2);
  // //this.drawRect(context);
  // //制作矩形
  context.strokeStyle = "#0864ee";
  context.strokeRect(0, 0, 250, 30);
  context.fillStyle = "rgba(10,18,51,0.8)";
  context.fillRect(1, 1, 250, 30);
  // ctx.scale(2, 2)
  // /* 字体颜色 */
  context.fillStyle = "rgba(255,255,255,1)";
  context.font = "16px bold";
  // // 绘制图片
  // var img = document.getElementById("tulip");
  // context.drawImage(img, 5, 5, 368, 148);
  /**文字 */
  context.fillText(data, 10, 20);
  return canvas;
};

function createSprite(data) {
  var texture = new THREE.Texture(createCanvas(data));
  texture.needsUpdate = true;
  var spriteMaterial = new THREE.SpriteMaterial({
    map: texture
  }); //创建精灵材质对象
  var sprite = new THREE.Sprite(spriteMaterial); //// 创建精灵模型对象，
  sprite.scale.set(8, 8, 8);
  return sprite;
}

export {
  createSprite
}
