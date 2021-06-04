const parser = math.parser();

const SYMBOL_WIDTH = 50;
const SYMBOL_HEIGHT = 50;

const BUTTON_BOX_WIDTH = 200;


let MathApp = {};

MathApp.symbol_paths = {
        '+':    "add",
        '-':    "sub",
        '*':    "mul",
        '/':    "div",
        '(':    "parenthesis_open",
        ')':    "parenthesis_close",
        '[':    "squarebracket_open",
        ']':    "squarebracket_close",
        '{':    "curlybrace_open",
        '}':    "curlybrace_close",
        '.':    "period",
        ',':    "comma",
        ':':    "colon",
        ';':    "semicolon",
        '=':    "equal",
        '>':    "more",
        '<':    "less",
        '!':    "exclamation"
};

MathApp.blocks = [];
MathApp.selected_block = null;

MathApp.is_mouse_dragging = false;       
MathApp.mouse_drag_prev = {x:0, y:0};

MathApp.block_types = {
    UNDEFINED:  "undefind",
    SYMBOL:     "symbol",
    BUTTON:     "button"
};



MathApp.initialize = function() {
    for(let i=0; i <= 9; i++)
    {
        let key = i.toString();
        let value = key;
        this.symbol_paths[key] = value;
    }

    for(let c="a".charCodeAt(0); c <= "z".charCodeAt(0); c++)
    {
        let key = String.fromCharCode(c);
        let value = key;
        this.symbol_paths[key] = value;
    }

    this.canvas = new fabric.Canvas("c", {
        backgroundColor: "#eee",
        hoverCursor: "default",
        selection: false
    });

    //
    $(document).keypress(function(event) {
        let key = String.fromCharCode(event.which);
        MathApp.handleKeyPress(key);
    });
    $(document).mousedown(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        MathApp.handleMouseDown(p);
    });
    $(document).mouseup(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        MathApp.handleMouseUp(p);
    });
    $(document).mousemove(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        MathApp.handleMouseMove(p);
    });

 
    initButtons();
    
}


MathApp.handleKeyPress = function(key) {
    if (key in this.symbol_paths) 
    {  
        let size = {
            width : SYMBOL_WIDTH,
            height : SYMBOL_HEIGHT
        };
        let position = {
            x : Math.random() * (this.canvas.width-size.width - BUTTON_BOX_WIDTH) + size.width/2,
            y : Math.random() * (this.canvas.height-size.height) + size.height/2
        };

        let new_symbol = new MathApp.Symbol(position, size, key);
    }     
}

MathApp.handleMouseDown = function(window_p) {
    if(MathApp.isInCanvas(window_p))
    {
        let canvas_p = MathApp.transformToCanvasCoords(window_p);

        if( MathApp.selected_block != null )
        {
            MathApp.selected_block.onDeselected();
            MathApp.selected_block = null;
        }

        let block = MathApp.findBlockOn(canvas_p);
        if(block != null && block.type == MathApp.block_types.SYMBOL)
        {
            MathApp.selected_block = block;
            MathApp.selected_block.onSelected();
            MathApp.is_mouse_dragging = true;
            MathApp.mouse_drag_prev = canvas_p;
           
        }
        else if (block != null && block.type == MathApp.block_types.BUTTON) {
            console.log("tes");
        }
      

        MathApp.canvas.requestRenderAll();
    }
    else
    {
        MathApp.is_mouse_dragging = false;
        MathApp.mouse_drag_prev = {x:0, y:0};
    }
}

MathApp.handleMouseMove = function(window_p) {
    if(MathApp.is_mouse_dragging)
    {
        let canvas_p = MathApp.transformToCanvasCoords(window_p);


        if(MathApp.selected_block != null)
        {
            let tx = canvas_p.x - MathApp.mouse_drag_prev.x;
            let ty = canvas_p.y - MathApp.mouse_drag_prev.y;
            MathApp.selected_block.translate({x: tx, y: ty});
        }
        MathApp.mouse_drag_prev = canvas_p;

        MathApp.canvas.requestRenderAll();
    }
}

MathApp.handleMouseUp = function(window_p) {
    if(MathApp.is_mouse_dragging)
    {
        let canvas_p = MathApp.transformToCanvasCoords(window_p);

        MathApp.is_mouse_dragging = false;
        MathApp.mouse_drag_prev = {x:0, y:0};

        MathApp.canvas.requestRenderAll();
    }
}

MathApp.transformToCanvasCoords = function(window_p) {
    let rect = MathApp.canvas.getElement().getBoundingClientRect();
    let canvas_p = {
        x : window_p.x - rect.left,
        y : window_p.y - rect.top
    };
    return canvas_p;
}

MathApp.isInCanvas = function(window_p) {
    let rect = MathApp.canvas.getElement().getBoundingClientRect();
    if( window_p.x >= rect.left && 
        window_p.x < rect.left + rect.width &&
        window_p.y >= rect.top && 
        window_p.y < rect.top + rect.height )
    {
        return true;
    }
    else
    {
        return false;
    }
}

MathApp.findBlockOn = function(canvas_p) {
    let x = canvas_p.x;
    let y = canvas_p.y;

    for(let i=0; i < this.blocks.length; i++)
    {
        let block = this.blocks[i];

        if( x >= block.position.x - block.size.width/2 && x <= block.position.x + block.size.width/2 &&
            y >= block.position.y - block.size.height/2 && y <= block.position.y + block.size.height/2 )
        {
            return block;
        }               
    }
    return null;
}

// MathApp objects
MathApp.Block = function(position, size) {
    this.position = position;
    this.size = size;
    this.type = MathApp.block_types.UNDEFINED;

    this.visual_items = [];

    MathApp.blocks.push(this);
}

MathApp.Block.prototype.onDeselected = function() {
    this.visual_items[this.visual_items.length-1].set({
        stroke: "rgba(0,0,255,1)"
    });
}

MathApp.Block.prototype.onSelected = function() {
    this.visual_items[this.visual_items.length-1].set({
        stroke: "rgba(255,0,0,1)"
    });

    this.visual_items.forEach(item => {
        MathApp.canvas.bringToFront(item);
    });
}

MathApp.Block.prototype.moveTo = function(p) {
    let tx = p.x - this.position.x;
    let ty = p.y - this.position.y;

    this.translate({x: tx, y: ty});
}

MathApp.Block.prototype.translate = function(v) {
    this.position.x += v.x;
    this.position.y += v.y;

    this.visual_items.forEach(item => {
        item.left += v.x;
        item.top += v.y;
    });
}

MathApp.Block.prototype.destroy = function() {
    if(this == MathApp.selected_block)
    {
        MathApp.selected_block = null;
        this.onDeselected();
    }

    this.visual_items.forEach(item => {
        MathApp.canvas.remove(item);
    });
    this.visual_items = [];
    
    let index = MathApp.blocks.indexOf(this);
    if(index > -1)
    {
        MathApp.blocks.splice(index, 1);
    }
}

// 
MathApp.Symbol = function(position, size, name) {
    MathApp.Block.call(this, position, size);
    this.type = MathApp.block_types.SYMBOL;
    this.name = name;

    let block = this;

    if (name in MathApp.symbol_paths) 
    {
        let path = "resources/" + MathApp.symbol_paths[name] + ".jpg";
        fabric.Image.fromURL(path, function(img) {
            // (0) Background
            let background = new fabric.Rect({
                left: position.x - size.width/2,
                top: position.y - size.height/2,
                width: size.width,
                height: size.height,
                fill: "rgba(255,255,255,1)",
                stroke: "rgba(0,0,0,0)",
                selectable: false
            });

            // (1) Image
            img.scaleToWidth(size.width);
            img.scaleToHeight(size.height);

            let img_w = img.getScaledWidth();
            let img_h = img.getScaledHeight();

            img.set({
                left: position.x - img_w/2,
                top: position.y - img_h/2,
                selectable: false
            });

            // (2) Boundary
            let boundary = new fabric.Rect({
                left: position.x - size.width/2,
                top: position.y - size.height/2,
                width: size.width,
                height: size.height,
                fill: "rgba(0,0,0,0)",
                stroke: "rgba(0,0,255,1)",
                strokeWidth: 5,
                selectable: false
            });

            //
            MathApp.canvas.add(background);
            MathApp.canvas.add(img);
            MathApp.canvas.add(boundary);

            //
            block.visual_items.push(background);
            block.visual_items.push(img);
            block.visual_items.push(boundary);
        });
    }
}

MathApp.Symbol.prototype = Object.create(MathApp.Block.prototype);



MathApp.Button = function(position, size, name) {    
    MathApp.Block.call(this, position, size);
    this.type = MathApp.block_types.BUTTON;
    this.name = name;    

    let block = this;

    let background = new fabric.Rect({
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 3,
        selectable: false
    });

    let text = new fabric.Text(name, {
        left: position.x + 5,
        top: position.y + 15,
        selectable: false,
        fontFamily: 'System',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        stroke: 'black',
        fill: 'black'
    });
  
    MathApp.canvas.add(background);
    MathApp.canvas.add(text);

    block.visual_items.push(background);
    block.visual_items.push(text);

}


MathApp.Button.prototype = Object.create(MathApp.Block.prototype);


//
function initButtons() {
    let size = {
        width : 120,
        height: 50
    };

    let position1 = {
        x : 890,
        y : 100
    }

    let position2 = {
        x : 890,
        y : 200
    }

    let position3 = {
        x : 890,
        y : 300
    }

    let position4 = {
        x : 890,
        y : 400
    }

    let delete_button = new MathApp.Button(position1, size, "Delete");
   
    let duplicate_button = new MathApp.Button(position2, size, "Duplicate");
    
    let disassemble_button = new MathApp.Button(position3, size, "Disassemble");
    
    let execute_button = new MathApp.Button(position4, size, "Execute");
}



$(document).ready(function() {
    MathApp.initialize();    
});



