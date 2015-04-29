

    var addRectHighlight = function(ctx,x,y,width,height){
        ctx.strokeStyle = "Red";
        console.log("adding rect at "+x+":"+y+" of width "+width+" and height "+height);
        ctx.beginPath();
        ctx.strokeRect(x, y, width, height);
        ctx.closePath();
    }

    var fillRectHighlight = function(ctx,x,y,width,height){
        ctx.strokeStyle = "Red";
        ctx.beginPath();
        ctx.fillRect(x, y, width, height);
        ctx.closePath();
    }

    var clearRectHighlight = function(ctx,x,y,width,height){
        console.log("clearing rect at "+x+":"+y+" of width "+width+" and height "+height);
        ctx.clearRect(0, 0, width, height);
    }






