function initTabs() {

  $('#layerprep').on('keyup','input', function() {
    var newval = $(this).val();
    var newval = parseFloat(newval, 3)
    var id = $(this).attr('id');
    var objectseq = $(this).attr('objectseq');
    console.log('Value for ' +id+ ' changed to ' +newval+ ' for object ' +objectseq );
    if ( id.indexOf('rasterxoffset') == 0 ) {
      objectsInScene[objectseq].position.x = objectsInScene[objectseq].userData.offsetX + parseFloat(newval, 3);
      console.log('Moving ' +objectsInScene[objectseq].name+ ' to X: '+newval);
    } else if ( id.indexOf('rasteryoffset') == 0 ) {
      objectsInScene[objectseq].position.y = objectsInScene[objectseq].userData.offsetY + parseFloat(newval, 3);
      console.log('Moving ' +objectsInScene[objectseq].name+ ' to Y: '+newval);
    } else if ( id.indexOf('rasterDPI') == 0 ) {

      var bboxpre = new THREE.Box3().setFromObject(objectsInScene[objectseq]);
      console.log('bbox for BEFORE SCALE: Min X: ', (bboxpre.min.x + (laserxmax / 2)), '  Max X:', (bboxpre.max.x + (laserxmax / 2)), 'Min Y: ', (bboxpre.min.y + (laserymax / 2)), '  Max Y:', (bboxpre.max.y + (laserymax / 2)));
      console.log('Scaling ' +objectsInScene[objectseq].name+ ' to: '+scale);
      var scale = (25.4 / parseFloat(newval, 3) );
      objectsInScene[objectseq].scale.x = scale;
      objectsInScene[objectseq].scale.y = scale;
      objectsInScene[objectseq].scale.z = scale;
      putFileObjectAtZero(objectsInScene[0]);
      $("#rasterxoffset"+objectseq).val('0')
      $("#rasteryoffset"+objectseq).val('0')
    } else if ( id.indexOf('svgdpi') == 0 ) {
      var svgscale = (25.4 / parseFloat(newval, 3) );
      objectsInScene[objectseq].scale.x = svgscale;
      objectsInScene[objectseq].scale.y = svgscale;
      objectsInScene[objectseq].scale.z = svgscale;
      putFileObjectAtZero();
    }


  });


  $('#tabsLayers').on('click','.close',function(){
     var tabID = $(this).parents('a').attr('href');
     $(this).parents('li').remove();
     $(tabID).remove();

     //display first tab
     var tabFirst = $('#tabsLayers a:first');
     tabFirst.tab('show');

     var layerIndex = $(this).parents('a').attr('layerindex');
     console.log('dumping ' + layerIndex + ' from objectsInScene')
     objectsInScene.splice(layerIndex, 1)
     fillLayerTabs();
   });

   $('#tabsLayers').on('click','a',function(){
      console.log("selected object id: " + $(this).attr('layerindex'));
      console.log("selected tab name: " + $(this).parents('li').attr('id'));
      var tabName = $(this).parents('li').attr('id')

      $(".layertab").removeClass('active');
      $(this).parents('li').addClass('active');

      if (tabName == "allView") {
        for (var j = 0; j < objectsInScene.length; j++) {
          console.log('added object ' + j)
          scene.add(objectsInScene[j]);
        }
        if (typeof(object) != 'undefined') {
            scene.add(object);
        }
        scene.remove(boundingBox)

      } else if (tabName == "gCodeView") {
        console.log('L: ', scene.children.length)
        var total = scene.children.length
        for (var j = 5; j < total; j++) {
          console.log('Removed ', scene.children[5].name);
          scene.remove(scene.children[5]);
        }
        if (object) {
          scene.add(object);
          attachBB(object);
        }
      } else {
        var total = scene.children.length
        for (var j = 5; j < total; j++) {
          console.log('Removed ', scene.children[5].name);
          scene.remove(scene.children[5]);
        }
        var i = parseInt($(this).attr('layerindex'));
        scene.add(objectsInScene[i]);
        attachBB(objectsInScene[i]);
      };
    });

} // End init


function fillLayerTabs() {
  $("#tabsLayers").empty();
  $("#layerprep").empty();
  $("#tabsLayers").append('<li role="presentation" class="active layertab" id="allView"><a href="#">All Layers</a></li><li role="presentation" class="layertab" id="gCodeView"><a href="#">GCODE View</a></li>');
  for (j = 5; j < scene.children.length; j++) {
    scene.remove(scene.children[5])
  }
  for (i = 0; i < objectsInScene.length; i++) {

    var pwr = objectsInScene[i].pwr
    var speed = objectsInScene[i].speed
    if (!pwr) {
      pwr = 100;
    }
    if (!speed) {
      speed = 20;
    }
    $("#tabsLayers").append('<li role="presentation" class="layertab" id="'+objectsInScene[i].name+'"><a href="#" layerindex="'+i+'">'+objectsInScene[i].name+'<button class="close" type="button" title="Remove this page">×</button></a></li>');

    if (objectsInScene[i].type == 'Group') {
      var xoffset = objectsInScene[i].userData.offsetX
      var yoffset = objectsInScene[i].userData.offsetY
      var template = `
      <hr>
      <label class="control-label">`+objectsInScene[i].name+`</label>
      <div class="input-group">
        <input type="number" class="form-control" value="`+speed+`" id="speed`+i+`" objectseq="`+i+`">
        <span class="input-group-addon">mm/s</span>
        <input type="number" class="form-control" value="`+pwr+`" id="power`+i+`" objectseq="`+i+`">
        <span class="input-group-addon">%</span>
      </div>
      <div class="input-group">
        <span class="input-group-addon">X</span>
        <input type="number" class="form-control" xoffset="`+xoffset+`" value="0" id="rasterxoffset`+i+`" objectseq="`+i+`">
        <span class="input-group-addon">Y</span>
        <input type="number" class="form-control" yoffset="`+yoffset+`" value="0" id="rasteryoffset`+i+`" objectseq="`+i+`">
      </div>
      `
      $("#layerprep").append(template);
      var objname = objectsInScene[i].name
      if (objname.indexOf('.svg') != -1) {
        var templatedpi = `
        <div class="input-group">
          <span class="input-group-addon">DPI</span>
          <input type="number" class="form-control" value="25.4" id="svgdpi`+i+`" objectseq="`+i+`">

        </div>
        `
        $("#layerprep").append(templatedpi);

      }

    } else if (objectsInScene[i].type == 'Mesh') {
      var xoffset = objectsInScene[i].userData.offsetX
      var yoffset = objectsInScene[i].userData.offsetY
      var xpos = objectsInScene[i].position.x
      var ypos = objectsInScene[i].position.y
      // var seq = objectsInScene[i].userData.seq;
      var template = `
      <hr>
      <label class="control-label">`+objectsInScene[i].name+`</label>
      <div class="input-group">
        <span class="input-group-addon">Light mm/s</span>
        <input type="number" class="form-control"  value="20" id="feedRateW`+i+`" objectseq="`+i+`">
        <span class="input-group-addon">Dark mm/s</span>
        <input type="number" class="form-control"  value="20" id="feedRateB`+i+`" objectseq="`+i+`">
      </div>
      <div class="input-group">
        <span class="input-group-addon">Min Pwr</span>
        <input type="number" class="form-control" value="0" id="minpwr`+i+`" objectseq="`+i+`">
        <span class="input-group-addon">Max Pwr</span>
        <input type="number" class="form-control" value="100" id="maxpwr`+i+`" objectseq="`+i+`">
      </div>
      <div class="input-group">
        <span class="input-group-addon">X</span>
        <input type="text" class="form-control" xoffset="`+xoffset+`" value="`+ -(xoffset - xpos)+`" id="rasterxoffset`+i+`" objectseq="`+i+`">
        <span class="input-group-addon">Y</span>
        <input type="text" class="form-control" yoffset="`+yoffset+`" value="`+ -(yoffset - ypos)+`" id="rasteryoffset`+i+`" objectseq="`+i+`">
      </div>
      <div class="input-group">
        <span class="input-group-addon">DPI</span>
        <input type="number" class="form-control" value="25.4" id="rasterDPI`+i+`" objectseq="`+i+`">
      </div>
      `;
      $("#layerprep").append(template);
    };
    scene.add(objectsInScene[i])
  }
};
