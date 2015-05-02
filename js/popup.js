jQuery.noConflict();
var image_container = document.getElementById('scrshot'),
    image_name      = '',
    image_data      = '',
    image_full_path = '',
    tab_id          = '',
    tab_url         = '',
    tab_title       = '',
    redmine_url     = '',
    redmine_key     = '';
    canvas          = '';
    scrshots        = 0;
    requestMethod   = 'POST';
    fetchedIssue    = {};
    projects        = [];
    trackers        = {};
    statuses        = {};
    priorities      = {};
    assignees       = {};
    categories      = {};
    targetVersions  = {};
    selectedShape   = { selected : false, type : 'Rect'};
    rectDims        = { 'medium' : { width : 90 , height : 20},'small': { width : 40 , height : 10} };
    addedShapes         = [];
    shapeUnderResize = {};
    shapeNotUnderResize = [];
    shapeToRemove = {};
    shapesNotRemove = [];
    isResizing = false;
    pencilled = {};
    pencilLines = {};
    pencilLineCount = 0;
    isPressHold = false;
    isRemover = false;
chrome.tabs.getSelected(null, function(tab) {
    tab_url   = tab.url;
    tab_title = tab.title;
    tab_id    = tab.id;
    document.getElementById('process')     .value = tab_title;
    document.getElementById('url_problema').value = tab_url;
});

jQuery(document).ready(function() {
    redmine_key = localStorage["api_key"];
    redmine_url = localStorage["api_url"];

    if(!redmine_key || redmine_key === "" || !redmine_url || redmine_url === ""){
        show_result('Error! Could not retrieve dropdown information. Please visit the Send to Redmine Extension Options page.');
        return false;
    }

    jQuery.ajaxSetup({
        dataType: 'json',
        headers: {'X-Redmine-API-Key': redmine_key}
    });

    jQuery(document).on('change', '#upload_image', function() {
        if(jQuery('#upload_image').is(':checked')) {
            jQuery('#image_container').show('slow');
        } else {
            jQuery('#image_container').hide('slow');
        }
    });

   /*chrome.tabs.captureVisibleTab(null, {'format': 'png'}, function(dataUrl) {
        image_data = dataUrl;
        console.log("capturing image ..");
        var dataURI    = dataUrl;
        console.log(";;;;"+dataURI);
            byteString = atob(dataURI.split(',')[1]),
            mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0],
            ab         = new ArrayBuffer(byteString.length),
            ia         = new Uint8Array(ab);

        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        var blob = new Blob([ab], {type: mimeString});

        image_data = blob;
        image_name = tab_title.split('?')[0].split('#')[0];

        if (image_name) {
            image_name = image_name.replace(/^https?:\/\//, '')
                                   .replace(/[^A-z0-9]+/g , '-')
                                   .replace(/-+/g         , '-')
                                   .replace(/^[_\-]+/     , '')
                                   .replace(/[_\-]+$/     , '');
            image_name = '-' + image_name;

        } else {
            image_name = '';
        }

        image_name = 'screenshot' + image_name + '.png';

        window.webkitRequestFileSystem(TEMPORARY, 1024*1024, function(fs){
            fs.root.getFile(image_name, {create:true}, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = onwriteend;
                    fileWriter.write(blob);
                }, errorHandler);
            }, errorHandler);
        }, errorHandler);
    });*/

    jQuery.ajax({
        type: 'get',
        url: redmine_url + '/projects.json',
    }).done(function(response){
        projects = response.projects;
        for(var i = 0; i < response.projects.length; i++){
            var option = document.createElement('option');

            option.text  = response.projects[i].name;
            option.value = response.projects[i].id;

            jQuery('#project').append(option);
        }

        jQuery('#project').change(function(){
            get_project_data(jQuery(this).val());
        });

        get_project_data(jQuery('#project option').first().val());
    });

    jQuery.ajax({
        type: 'get',
        url: redmine_url + '/trackers.json',
    }).done(function(response){
        trackers = response.trackers;
        for(var i = 0; i < response.trackers.length; i++){
            var option = document.createElement('option');

            option.text  = response.trackers[i].name;
            option.value = response.trackers[i].id;

            jQuery('#tracker').append(option);
        }
    });

    jQuery.ajax({
        type: 'get',
        url: redmine_url + '/issue_statuses.json',
    }).done(function(response){
        statuses = response.issue_statuses;
        for(var i = 0; i < response.issue_statuses.length; i++){
            var option = document.createElement('option');

            option.text  = response.issue_statuses[i].name;
            option.value = response.issue_statuses[i].id;

            jQuery('#status').append(option);
        }
    });

    jQuery.ajax({
        type: 'get',
        url: redmine_url + '/enumerations/issue_priorities.json',
    }).done(function(response){
        priorities = response.issue_priorities;
        for(var i = 0; i < response.issue_priorities.length; i++){
            var option = document.createElement('option');
            option.text  = response.issue_priorities[i].name;
            option.value = response.issue_priorities[i].id;

            if(response.issue_priorities[i].is_default) {
                option.selected = true;
            }

            jQuery('#priority').append(option);
        }
    });

    jQuery.ajax({
        type: 'get',
        url: redmine_url + '/users.json',
    }).done(function(response){

        for(var i = 0; i < response.users.length; i++){
            if(response.users[i].firstname + ' ' + response.users[i].lastname != 'Redmine Admin') {
                var option = document.createElement('option');
                option.text  = response.users[i].firstname + ' ' + response.users[i].lastname;
                option.value = response.users[i].id;

                jQuery('#asign').append(option);
            }
        }

        jQuery.ajax({
            type: 'get',
            url: redmine_url + '/groups.json',
        }).done(function(response){
            assignees = response.groups;
            var optgroup = document.createElement('optgroup');
            optgroup.label = 'Groups';
            jQuery('#asign').append(optgroup);

            for(var i = 0; i < response.groups.length; i++){
                var option = document.createElement('option');

                option.text  = ' > ' + response.groups[i].name;
                option.value = response.groups[i].id;

                jQuery('#asign').append(option);
            }
        });
    });

    jQuery.ajax({
        type: 'get',
        url: redmine_url + '/custom_fields.json'
    }).done(function(response){
            if(response.custom_fields.length > 0) {
                    var testphase = response.custom_fields[0];
                    var resolution = response.custom_fields[1];
                    for(var i = 0; i<testphase.possible_values.length ; i++){
                        var option = document.createElement('option');

                        option.text = testphase.possible_values[i].value;
                        option.value = option.text;
                        if(option.text == 'System Test'){
                            option.selected = true;
                        }
                        jQuery('#testphase').append(option);
                    }
                    for(var j = 0; j<resolution.possible_values.length ; j++){
                        var option = document.createElement('option');

                        option.text = resolution.possible_values[j].value;
                        option.value = option.text;
                        if(option.text == 'UnResolved'){
                            option.selected = true;
                        }
                        jQuery('#resolution').append(option);
                    }

            }
            //jQuery('#priority').append(option);
    });

    jQuery('#update').bind("click",function(data) {
        clean_form();
        var bugId = jQuery('#issue').val();
        console.log('Bug selected :'+bugId);
        var url = '/issues/'+bugId+'.json?include=attachments'
        jQuery.ajax({
            type: 'GET',
            // data: JSON.stringify(data),
            url: redmine_url + url,
            contentType: 'application/json',
        }).done(function(response){
            fetchedIssue = response.issue;
            populate_response();
            jQuery('#issueFormLabel').text('Update Issue');
            jQuery('#submit').text('Update');
            requestMethod = 'PUT';
        }).fail(function(response){
            show_result('ERROR! "' + escape(response.errors) + '"');
        });
    });

    jQuery('#capture').bind("click",function(data) {
      //  chrome.windows.create({'left' : 20,'height' : 800,'width' : 1000,'focused' : true,'type' : 'popup'},
        //function(){
            console.log('pop up img capturer');


        var imgSrc = '';
        chrome.tabs.captureVisibleTab(null, {'format': 'jpeg'}, function(dataUrl) {
            console.log("capturing image ..");
            var dataURI = dataUrl;
            console.log(dataURI);
            byteString = atob(dataURI.split(',')[1]),
                mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0],
                ab = new ArrayBuffer(byteString.length),
                ia = new Uint8Array(ab);

            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            var blob = new Blob([ab], {type: mimeString});

            image_data = blob;
            image_name = tab_title.split('?')[0].split('#')[0];

            if (image_name) {
                image_name = image_name.replace(/^https?:\/\//, '')
                    .replace(/[^A-z0-9]+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^[_\-]+/, '')
                    .replace(/[_\-]+$/, '');
                image_name = '-' + image_name;

            } else {
                image_name = '';
            }

            image_name = 'screenshot'+scrshots + image_name + '.png';
            scrshots++;
           // navigator.webkitPersistentStorage.requestQuota( 1024 * 1024, function (grantedBytes) {
                window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function (fs) {
                    fs.root.getFile(image_name, {create: true}, function (fileEntry) {
                        fileEntry.createWriter(function (fileWriter) {
                            fileWriter.onwriteend = onwriteend;
                            fileWriter.write(blob);
                        }, errorHandler);
                    }, errorHandler);
                }, errorHandler);
           // });
        });

       /*setTimeout(function(){
                                jQuery('#myCanvas').show();
                                createCanvas();
                            },2000);*/

        });
    jQuery('#done').show();
    jQuery('#palette').show();
   /* jQuery('#highlightrect').bind('click',function(){
        addRectHighlight();
    })*/
    jQuery('#done').bind('click',function(){
      // addRectHighlight();
        var canvas1 = document.getElementById('myCanvas');
        var context = canvas1.getContext('2d');

        var canvas2 = document.getElementById('myCanvas1');
        var context1 = canvas2.getContext('2d');
        context.drawImage(canvas2,0,0);
        var dataUrl = canvas1.toDataURL();
        image_data = dataURItoBlob(dataUrl);
        jQuery('#image_container').append('<img src="'+dataUrl+'"/>');
        context.clearRect(0, 0, canvas1.width, canvas1.height);
        context1.clearRect(0, 0, canvas2.width, canvas2.height);
      // jQuery("#scrshot").attr('src',dataUrl);
        jQuery('.canvas-container').remove();
     });
    jQuery('#pencilpicker').bind('click',function(event){
        selectedShape.selected=true;
        selectedShape.type="Pencil";

    });
    jQuery('#Text').bind('click',function(event){
        jQuery('#annotationText').show();
        selectedShape.selected=true;
        selectedShape.type="Text";

    });
    jQuery('#Rect').bind('click',function(event){
        //jQuery('#annotationText').show();
        jQuery('#rectShapePicker').show();
        selectedShape.selected=true;
        selectedShape.type="Rect";

    });
    jQuery('#mediumRect').bind('click',function(event){
        selectedShape.selected=true;
        selectedShape.type="mediumRect";
        jQuery('#mediumRect').css('background-color', '#e9322d');
        jQuery('#smallRect').css('background-color','#FFFFFF');
    });
    jQuery('#smallRect').bind('click',function(event){
        selectedShape.selected=true;
        selectedShape.type="smallRect";
        jQuery('#smallRect').css('background-color' , '#e9322d');
        jQuery('#mediumRect').css('background-color',  '#FFFFFF');
    });
    jQuery('#annotationText').on("keypress",function(){
      console.log(this.value);
    });

    function isResizerClicked(x,y){
        shapeNotUnderResize.splice(0,shapeNotUnderResize.length);
        for(i=0; i < addedShapes.length ; i++){
            var shape = addedShapes[i];
            if((x == shape.resizerX || (x > shape.resizerX && x < (shape.resizerX+7))) && (y == shape.resizerY || (y > shape.resizerY && y < (shape.resizerY+7)))){
                shapeUnderResize = shape;
                console.log("resizer clicked");
                isResizing=true;
                return;
            }
            else{
                shapeNotUnderResize.push(shape);
            }

        }
    }


    function isShapeClicked(x,y){
        shapesNotRemove.splice(0,shapesNotRemove.length);
        for(i=0; i < addedShapes.length ; i++){
            var shape = addedShapes[i];
            if((x == shape.rectX || (x > shape.rectX && x < (shape.rectX+shape.width))) && (y == shape.rectY || (y > shape.rectY && y < (shape.rectY+shape.height)))){
                shapeToRemove = shape;
                console.log("for removal clicked");
                isRemover = true;
            }
            else{
                shapesNotRemove.push(shape);
            }

        }
    }

    jQuery('#myCanvas1').on("mousemove",function(event){
        console.log("This is mousemove");
            var nowOffsetX = 0;
            var nowOffsetY = 0;
            nowOffsetX += this.offsetLeft - this.scrollLeft;
            nowOffsetY += this.offsetTop - this.scrollTop;

            canvasXnow = event.pageX - nowOffsetX;
            canvasYnow = event.pageY - nowOffsetY;
            var ctx = this.getContext("2d");
        if(isPressHold && selectedShape.type=='Pencil'){

                    ctx.strokeStyle = "Red";
                    ctx.moveTo(pencilled.rectX,pencilled.rectY);
                    ctx.lineTo(canvasXnow,canvasYnow);
                    ctx.stroke();

                    var movedPencil = {};
                    movedPencil.rectX = canvasXnow;
                    movedPencil.rectY = canvasYnow;
                    pencilLines[pencilLineCount].push(movedPencil);
                    pencilled.rectX = canvasXnow;
                    pencilled.rectY = canvasYnow;

        }
        if(isResizing) {
            // clearRectHighlight(ctx,shapeUnderResize.rectX,shapeUnderResize.rectY,shapeUnderResize.width,shapeUnderResize.height);
            // console.log("clearing rect at " + shapeUnderResize.rectX + ":" + shapeUnderResize.rectY + " of width " + shapeUnderResize.width + " and height " + shapeUnderResize.height);
            ctx.clearRect(0, 0, 1000, 800);
            // ctx.clearRect(shapeUnderResize.rectX, shapeUnderResize.rectY, 1000, 800);
            addRectHighlight(ctx, canvasXnow, canvasYnow, shapeUnderResize.width + 5, shapeUnderResize.height + 5);
            fillRectHighlight(ctx, canvasXnow - 7, canvasYnow - 7, 7, 7);
            addedShapes.splice(0, addedShapes.length);
            var shapeResized = {};
            if (canvasXnow < shapeUnderResize.rectX || canvasYnow > shapeUnderResize.rectY) {
                shapeResized = {
                    'rectX': canvasXnow,
                    'rectY': canvasYnow,
                    'width': shapeUnderResize.width + 5,
                    'height': shapeUnderResize.height + 5,
                    'resizerX': canvasXnow - 7,
                    'resizerY': canvasYnow - 7,
                    'text': ''
                };
            }
            else {
                shapeResized = {
                    'rectX': canvasXnow,
                    'rectY': canvasYnow,
                    'width': shapeUnderResize.width - 5,
                    'height': shapeUnderResize.height - 5,
                    'resizerX': canvasXnow - 7,
                    'resizerY': canvasYnow - 7,
                    'text': ''
                };
            }
            addedShapes.push(shapeResized);
            shapeUnderResize = shapeResized;
            for (i = 0; i < shapeNotUnderResize.length; i++) {
                var shape = shapeNotUnderResize[i];
                if (shape.text == '') {
                    addRectHighlight(ctx, shape.rectX, shape.rectY, shape.width, shape.height);
                    fillRectHighlight(ctx, shape.resizerX, shape.resizerY, 7, 7);
                    addedShapes.push({
                        'rectX': shape.rectX,
                        'rectY': shape.rectY,
                        'width': shape.width,
                        'height': shape.height,
                        'resizerX': shape.resizerX,
                        'resizerY': shape.resizerY,
                        text: ''
                    });
                }
                else {
                    addRectHighlight(ctx, shape.rectX, shape.rectY, shape.width, shape.height);
                    ctx.fillText(shape.text, shape.rectX + 12, shape.rectY + 12);
                }
            }
            jQuery.each(pencilLines, function (prop, val) {
                ctx.beginPath();
                for (j = 1; j < val.length; j++) {
                    var obj = val[j];
                    var nextObj = val[j+1];
                    if (nextObj != undefined) {

                        ctx.strokeStyle = "Red";
                        ctx.moveTo(obj.rectX, obj.rectY);

                        ctx.lineTo(nextObj.rectX, nextObj.rectY);
                        ctx.stroke();

                    }
                }
                ctx.closePath();
            });
        }
    });
    jQuery('#myCanvas1').on("mouseup",function(event){
        console.log("This is mouseup");
        if(isResizing) {
            isResizing = false;
        }
        else{
            isPressHold = false;
            pencilled={};
            if(selectedShape.type == 'Pencil') {
                pencilLineCount++;
                selectedShape={};
                var ctx = this.getContext("2d");
                ctx.closePath();
            }
        }
    });

    jQuery('#myCanvas1').on("mousedown",function(event){
        console.log("This is mouse down");

        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var currentElement = this;
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;

        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;
        console.log(canvasX + ":" + canvasY);
        if(selectedShape.type == 'Pencil') {
            isPressHold = true;
            pencilled = {'rectX' : canvasX,'rectY' : canvasY,'width' : rectDims.small.width,'height' : rectDims.small.height,'resizerX' : canvasX-7,'resizerY' : canvasY-7,'type': 'pencil'};
            var pencilPath =[];
            pencilPath.push(pencilled);
            pencilLines[pencilLineCount] = pencilPath;
            var ctx = currentElement.getContext("2d");
            ctx.beginPath();
            //addedShapes.push(pencilled);
        }
        isResizerClicked(canvasX,canvasY);
        if(!isResizing) {
                if(event.button == 2){
                    isShapeClicked(canvasX,canvasY);
                    console.log("right click for remove? "+isRemover);
                    if(isRemover) {
                        addedShapes.splice(0, addedShapes.length);
                        var ctx = currentElement.getContext("2d");
                        ctx.clearRect(0, 0, 1000, 800);
                        for(i=0;i<shapesNotRemove.length;i++){
                            var shape = shapesNotRemove[i];
                            if(shape.text == '') {
                                addRectHighlight(ctx, shape.rectX, shape.rectY, shape.width, shape.height);
                                fillRectHighlight(ctx, shape.resizerX, shape.resizerY, 7, 7);
                                addedShapes.push({
                                    'rectX': shape.rectX,
                                    'rectY': shape.rectY,
                                    'width': shape.width,
                                    'height': shape.height,
                                    'resizerX': shape.resizerX,
                                    'resizerY': shape.resizerY,
                                    'text': shape.text
                                });
                            }
                            else{
                                addRectHighlight(ctx, shape.rectX, shape.rectY, shape.width, shape.height);
                                ctx.fillText(shape.text, shape.rectX+12, shape.rectY+12);

                            }
                        }
                        jQuery.each(pencilLines,function(prop,val){
                                ctx.beginPath();
                                for (j = 1; j < val.length; j++) {
                                    var obj = val[j];
                                    var nextObj = val[j+1];
                                    if (nextObj != undefined) {

                                        ctx.strokeStyle = "Red";
                                        ctx.moveTo(obj.rectX, obj.rectY);

                                        ctx.lineTo(nextObj.rectX, nextObj.rectY);
                                        ctx.stroke();

                                    }
                                }
                                ctx.closePath();

                        });
                    }
                }

        }
    });

    jQuery('#myCanvas1').on("click",function(event){
        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var currentElement = this;
            totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
            totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;

        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;
        console.log(canvasX + ":" + canvasY);
        //isResizerClicked(canvasX,canvasY);


       if(selectedShape.selected) {
           var ctx = this.getContext("2d");
           if (selectedShape.type == "Text") {
               ctx.font = "12px Arial";
               ctx.fillStyle="Red";
               var textTyped = jQuery('#annotationText').val();
               addRectHighlight(ctx,canvasX-12,canvasY-12,(textTyped.length * 10),rectDims.medium.height);

               ctx.fillText(textTyped, canvasX, canvasY);
               addedShapes.push({'rectX' : canvasX-12,'rectY' : canvasY-12,'width' : (textTyped.length * 10),'height' : rectDims.medium.height,'resizerX' : canvasX-7,'resizerY' : canvasY-7,'text' : textTyped});
               selectedShape.selected=false;
           }
           else if(selectedShape.type == 'smallRect'){
               //ctx.fillStyle = "#FF0000";
               addRectHighlight(ctx,canvasX,canvasY,rectDims.small.width,rectDims.small.height);

               fillRectHighlight(ctx,canvasX-7,canvasY-7,7,7);
               addedShapes.push({'rectX' : canvasX,'rectY' : canvasY,'width' : rectDims.small.width,'height' : rectDims.small.height,'resizerX' : canvasX-7,'resizerY' : canvasY-7,'text' : ''});
               selectedShape.selected=false;
           }
           else if(selectedShape.type == 'mediumRect'){
               //ctx.fillStyle = "#FF0000";
               addRectHighlight(ctx,canvasX,canvasY,rectDims.medium.width,rectDims.medium.height);
               fillRectHighlight(ctx,canvasX-7,canvasY-7,7,7);
               addedShapes.push({'rectX' : canvasX,'rectY' : canvasY,'width' : rectDims.medium.width,'height' : rectDims.medium.height,'resizerX' : canvasX-7,'resizerY' : canvasY-7,'text' : ''});
               selectedShape.selected=false;
           }
       }

    });


    //});
});

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}
function createCanvas(imgUrl){
   // jQuery('#done').before('<canvas id="myCanvas"></canvas>');
    //jQuery('#myCanvas').attr('width',1000);
    //jQuery('#myCanvas').attr('height',800);
    //jQuery('#myCanvas').css('border','7px solid #d3d3d3');
    //var imgElement= document.getElementById('scrshot');
   // var canvas1 = new fabric.Canvas('myCanvas',{ isDrawingMode: true });
    //canvas1.freeDrawingBrush.color='rgb(239,1,1)';
   /* var imgInstance = new fabric.Image(imgElement, {
       left: 10,
       top: 10
        //angle: 30,opacity: 0.85

    });
    canvas1.add(imgInstance);*/
    jQuery('#myCanvas').show();
    jQuery('#myCanvas1').show();
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 0, 0,1000,600);
    };
    imageObj.src = imgUrl;

    /*fabric.Image.fromURL(imgUrl, function(oImg) {
        canvas1.add(oImg);
    });*/
    /*canvas.on('mouse:down', function(options) {
        console.log(options.e.clientX, options.e.clientY);
        clicked.x = options.e.clientX;
        clicked.y = options.e.clientY;
    });*/
  //  jQuery('#myCanvas').show();

}
document.getElementById("form").onsubmit = function() {
    var subject = document.getElementById("subject").value,
        key     = localStorage["api_key"],
        url     = localStorage["api_url"];

    if(subject === ""){
        show_result('Error! You must specify a subject first.');
        return false;
    }

    if(!key || key === "" || !url || url === ""){
        show_result('Error! Could not retrieve dropdown information. Please visit the Send to Redmine Extension Options page.');
        return false;
    }

    var json_data = {
        'issue' : {
            'subject': subject,
            'project_id': escape(document.getElementById('project').value),
            'tracker_id': escape(document.getElementById('tracker').value),
            'description': document.getElementById('description').value,
            'status_id': escape(document.getElementById('status').value),
            'priority': escape(document.getElementById('priority').value),
            'category_id': escape(document.getElementById('category').value),
            'assigned_to_id': escape(document.getElementById('asign').value),
            'fixed_version_id': escape(document.getElementById('version').value),
            'custom_fields': [
                {
                    'id'   : 1,
                    'name' : 'Test Phase',
                    'value': [document.getElementById('testphase').value]
                },
                {
                    'id'   : 2,
                    'name' : 'Resolution',
                    'value': [document.getElementById('resolution').value]
                },
                {
                    'id'   : 3,
                    'value': document.getElementById('process').value
                },
                {
                    'id'   : 4,
                    'value': document.getElementById('url_problema').value
                }
            ]
        }
    }

    var json_data_put = {
        'issue' : {
            'subject': subject,
            'project_id': escape(document.getElementById('project').value),
            'tracker': { id : 1, name : escape(document.getElementById('tracker').value)},
            'description': document.getElementById('description').value,
            'status_id': escape(document.getElementById('status').value),
            'priority': escape(document.getElementById('priority').value),
            'category_id': escape(document.getElementById('category').value),
            'assigned_to_id': escape(document.getElementById('asign').value),
            'fixed_version_id': escape(document.getElementById('version').value),
            'custom_fields': [
                {
                    'id'   : 1,
                    'name' : 'Test Phase',
                    'value': [document.getElementById('testphase').value]
                },
                {
                    'id'   : 2,
                    'name' : 'Resolution',
                    'value': [document.getElementById('resolution').value]
                }
            ]

        }
    }
    show_result('Submitting issue...');

    if(jQuery('#upload_image').is(':checked')) {
        var isUploadDone = 0;
        //for(img=0 ; img < image_data.length ; img++) {
            jQuery.ajax({
                type: 'POST',
                data: image_data,
                processData: false,
                url: redmine_url + '/uploads.json',
                contentType: 'application/octet-stream',
            }).done(function (response) {
                if(requestMethod == 'POST') {
                    json_data.issue.uploads = [
                        {
                            'token': response.upload.token,
                            'filename': image_name,
                            'description': 'Screenshot URL: ' + tab_url + ' Page title: ' + tab_title,
                            'content_type': 'image/png'
                        }
                    ];
                    /* if(img == (image_data.lentgth - 1)){
                     isUploadDone = 1;
                     }*/

                        submit_issue(json_data);

                }
                else{
                    json_data_put.issue.uploads = [
                        {
                            'token': response.upload.token,
                            'filename': image_name,
                            'description': 'Screenshot URL: ' + tab_url + ' Page title: ' + tab_title,
                            'content_type': 'image/png'
                        }
                    ];
                    /* if(img == (image_data.lentgth - 1)){
                     isUploadDone = 1;
                     }*/

                        submit_issue(json_data_put);

                }

            }).fail(function (response) {
                //show_result('Error! "' + escape(response.errors) + '"');
            });
    //}
        /*while(true){
            if(isUploadDone == 1){
                submit_issue(json_data);
                break;
            }
        }*/
    } else {
        submit_issue(json_data);
    }

    return false;
}

function submit_issue(data) {
    var url = '/issues.json';
    if(requestMethod == 'PUT') {
        var bugId = jQuery('#issue').val();
        url = '/issues/' + bugId + '.json';
    }

    jQuery.ajax({
        type: requestMethod,
        data: JSON.stringify(data),
        url: redmine_url + url,
        contentType: 'application/json',
    }).done(function(response){
        var result = 'Issue submited: ' +
                     '<a href="' + redmine_url + '/issues/'+escape(response.issue.id)+'" target="_blank">' +
                        '#' + escape(response.issue.id) +
                     '</a>.';

        show_result(result);

        clean_form();
    }).fail(function(response){
       if(requestMethod == 'POST') {
           show_result('ERROR! "' + escape(response.errors) + '"');
       }
        /*else {
           show_result('ERROR! "' + escape(response.error)+'"');
       }*/
    });
}

function show_result(result) {
    if(result != '') {
        jQuery('#result').html(result).css('top', '0px');
    }

    var hide_result = setTimeout(function(){
        jQuery('#result').html('').css('top', '-100px');
    }, 10000);

    jQuery(document).on('mouseover',+ '#result', function() {
        clearTimeout(hide_result);

        jQuery(document).on('mouseleave', '#result', function() {
            var hide_result = setTimeout(function(){
                jQuery('#result').html('').css('top', '-100px');
            }, 10000);
        });
    });
}

function get_project_data(project_id) {
    jQuery.ajax({
        type: 'get',
        url: redmine_url + '/projects/' + parseInt(project_id) + '/versions.json',
    }).done(function(response){
        for(var i = 0; i < response.versions.length; i++){
            var option = document.createElement('option');

            option.text  = response.versions[i].name;
            option.value = response.versions[i].id;

            jQuery('#version').append(option);
        }
    });

    jQuery.ajax({
        type: 'get',
        url: redmine_url + '/projects/' + parseInt(project_id) + '/issue_categories.json',
    }).done(function(response){
        for(var i = 0; i < response.issue_categories.length; i++){
            var option = document.createElement('option');

            option.text  = response.issue_categories[i].name;
            option.value = response.issue_categories[i].id;

            jQuery('#category').append(option);
        }
    });
}

function clean_form() {
    jQuery('#project') .val(jQuery('#project option') .first().attr('value'));
    jQuery('#tracker') .val(jQuery('#tracker option') .first().attr('value'));
    jQuery('#status')  .val(jQuery('#status option')  .first().attr('value'));
    jQuery('#asign')   .val(jQuery('#asign option')   .first().attr('value'));
    jQuery('#version') .val(jQuery('#version option') .first().attr('value'));
    jQuery('#category').val(jQuery('#category option').first().attr('value'));
    jQuery('#priority').val(jQuery('#priority option').first().attr('value'));
    jQuery('#testphase').val(jQuery('#testphase option').first().attr('value'));
    jQuery('#resolution').val(jQuery('#resolution option').first().attr('value'));
    jQuery('#url_problema').val('');
    jQuery('#subject')     .val('');
    jQuery('#process')     .val('');
    jQuery('#description') .val('');

    jQuery('#upload_image').attr('checked', false);
    var images = [];
    jQuery('#image_container').children().not('legend').not('#scrshot').each(function(){
        this.remove();
    });
}

function onwriteend() {
    image_full_path = 'filesystem:chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/temporary/' + image_name;

    //scrshot.src = (image_full_path);
    createCanvas(image_full_path);
}

function errorHandler(e) {
    var msg = '';

    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
    };

    console.log('Error: ' + msg);
}

function populate_response() {
   // var issue = response.issue;
    jQuery('#project option[value='+fetchedIssue.project.id+']') .attr('selected','selected');
    jQuery('#tracker option[value='+fetchedIssue.tracker.id+']') .attr('selected','selected');
    jQuery('#status option[value='+fetchedIssue.status.id+']')  .attr('selected','selected');
    jQuery('#asign option[value='+fetchedIssue.assigned_to.id+']')   .attr('selected','selected');
   // $('#version') .val($('#version option') .first().attr('value'));
    //$('#category').val($('#category option').first().attr('value'));
    jQuery('#priority option[value='+fetchedIssue.priority.id+']').attr('selected','selected');

   // $('#url_problema').val('');
   // $('#url_problema').val('');
    jQuery('#subject')     .val(fetchedIssue.subject);
    //$('#process')     .val('');
    jQuery('#description') .val(fetchedIssue.description);
    if(fetchedIssue.attachments != undefined && fetchedIssue.attachments.length > 0) {
        jQuery('#upload_image').attr('checked', true);
        for(i=0 ;i<fetchedIssue.attachments.length;i++){
            jQuery('#image_container').append('<img src="'+fetchedIssue.attachments[i].content_url+'"/>');
        }
        /*jQuery('#scrshot').attr('src', issue.attachments[0].content_url).load(function(){
            console.log('load image');
        })*/
    }

    if(fetchedIssue.custom_fields != undefined && fetchedIssue.custom_fields.length > 0) {
        for(i=0 ;i<fetchedIssue.custom_fields.length;i++){
            var customField = fetchedIssue.custom_fields[i];
            if(customField.id == 1){
                if(customField.value.length > 0) {
                    jQuery('#testphase option[value="' + customField.value[0] + '"]').attr('selected', 'selected');
                }
            }
            else if(customField.id == 2){
                if(customField.value.length > 0) {

                    jQuery('#resolution option[value="' + customField.value[0] + '"]').attr('selected', 'selected');
                }
            }
        }
    }
    jQuery('#image_container').children('img').each(function(){
        console.log(this);
        //this.load(function(){console.log('load Image');});
    });
}
