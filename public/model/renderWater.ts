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
