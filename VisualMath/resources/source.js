const parser = math.parser();

const SYMBOL_WIDTH = 50;
const SYMBOL_HEIGHT = 50;

const BUTTON_BOX_WIDTH = 300;

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
        '!':    "exclamation",
        '%':    "percent",
        '/':    "slash",
        '^':    "pow",
        "sin":  "sin",
        "cos":  "cos",
        "tan":  "tan",
        "exp":  "exp",
        "log":  "log",
        "sqrt": "sqrt",
        "pi":   "pi",
        "number_e": "number_e",
        "cross":    "cross",
        "dot":      "dotProduct",
        "det":      "det",
        "inv":      "inv",
        "multiply": "multiply"

};

MathApp.blocks = [];
MathApp.selected_block = null;

MathApp.is_mouse_dragging = false;       
MathApp.mouse_drag_prev = {x:0, y:0};

MathApp.block_types = {
    UNDEFINED:  "undefind",
    SYMBOL:     "symbol",
    BUTTON:     "button",
    MULTIBLOCK: "multiblock"
};

MathApp.button_types = {
    OPERATION: "operation",
    SUPPORT: "support"
}


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
 
    initOperationButtons();
    initSupportButtons();
    initVectorMatrixButtons();
}


MathApp.handleKeyPress = function(key) {
    if (key in this.symbol_paths) 
    {  
        let size = {
            width : SYMBOL_WIDTH,
            height : SYMBOL_HEIGHT
        };
        let position = {
            x : Math.random() * (this.canvas.width - size.width - BUTTON_BOX_WIDTH) + size.width/2,
            y : Math.random() * (this.canvas.height - size.height) + size.height/2
        };

        let new_symbol = new MathApp.Symbol(position, size, key);
    }     
}

MathApp.handleMouseDown = function(window_p) {
    if(MathApp.isInCanvas(window_p))
    {
        let canvas_p = MathApp.transformToCanvasCoords(window_p);
        let mem_selected_block = MathApp.selected_block;
        // 일단 다 초기화. 선택블록도 초기화
        if( MathApp.selected_block != null )
        {
            MathApp.selected_block.onDeselected();
            MathApp.selected_block = null;
        }

        let block = MathApp.findBlockOn(canvas_p);
       
        if(block != null && block.type == MathApp.block_types.SYMBOL) // 클릭된 블록이 심볼, 혹은 멀티블록이라면
        {           
            MathApp.selected_block = block;
            MathApp.selected_block.onSelected();
            MathApp.is_mouse_dragging = true;
            MathApp.mouse_drag_prev = canvas_p;           
        }
        else if (block != null && block.type == MathApp.block_types.MULTIBLOCK) {
            MathApp.selected_block = block;
            MathApp.selected_block.onSelected();
            MathApp.is_mouse_dragging = true;
            MathApp.mouse_drag_prev = canvas_p;     
        }
        else if (block != null && block.type == MathApp.block_types.BUTTON ) { // 클릭 블록이 버튼이라면
           block.translate({x:0, y:5});              
           block.buttonOperation(mem_selected_block);           
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

    let canvas_p = MathApp.transformToCanvasCoords(window_p);    
    
    if(MathApp.is_mouse_dragging) // 드래그하고 있는 경우
    {
        MathApp.is_mouse_dragging = false;
        MathApp.mouse_drag_prev = {x:0, y:0};        
       
        let leftBlock = MathApp.findBlockOnLeft(canvas_p);
        if (MathApp.selected_block != leftBlock && leftBlock != null) {            
            assemble(leftBlock);
        }
    }    
    else if (!MathApp.is_mouse_dragging) { // 드래그하고 있지 않은 경우 
        let block = MathApp.findBlockOn(canvas_p);      
        if (block != null && block.type == MathApp.block_types.BUTTON) {
            block.translate({x:0, y:-5});            
        }
    }


    MathApp.canvas.requestRenderAll();
    
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
        
        if( x >= block.position.x - 25 && x <= block.position.x + block.size.width - 25 &&
            y >= block.position.y - 25  && y <= block.position.y + 25 )
        {
            return block;
        }               
    }
    return null;
}

MathApp.findBlockOnLeft = function(canvas_p) {
    let x = canvas_p.x;
    let y = canvas_p.y;

    for(let i=0; i < this.blocks.length; i++)
    {
        let block = this.blocks[i];

        if( x >= block.position.x + block.size.width/2 && x <= block.position.x + block.size.width * 2  &&  y >= block.position.y - block.size.height/2 && y <= block.position.y + block.size.height/2 )
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
    this.numberOfSymbols;
    this.visual_items = [];

    MathApp.blocks.push(this);
}

//테두리색을 바꿈
MathApp.Block.prototype.onDeselected = function() {
   
    for (var i = 0; i < this.visual_items.length ; i++) {
        this.visual_items[i].set({  stroke: "rgba(0,0,255,1)" });        
     }
}
//테두리 색을 바꾸고 캔버스 맨위에 배치
MathApp.Block.prototype.onSelected = function() {

    for (var i = 0; i < this.visual_items.length ; i++) {
       this.visual_items[i].set({ stroke: "rgba(255,0,0,1)" });        
    }

    this.visual_items.forEach(item => {
        MathApp.canvas.bringToFront(item);        
    });
}
// p값과 현재 위치를 뺀 값만큼 이동
MathApp.Block.prototype.moveTo = function(p) {
    let tx = p.x - this.position.x;
    let ty = p.y - this.position.y;

    this.translate({x: tx, y: ty});
}

//블록의 모든 비주얼 아이템의 위치를 v 만큼 이동시킴
MathApp.Block.prototype.translate = function(v) {
    this.position.x += v.x;
    this.position.y += v.y;

    this.visual_items.forEach(item => {
        item.left += v.x;
        item.top += v.y;
    });
}
// 선택된 블록이 이 메소드를 호출한 블록이라면 선택 블록을 null 로 설정하고 모든 비주얼 아이템을 캔버스에서 제거, blocks 배열에서 해당 블록의 인덱스를 찾고 빼냄
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

function assemble(leftBlock) {

    let newPos = leftBlock.position;

    if (MathApp.selected_block.type == MathApp.block_types.SYMBOL && leftBlock.type == MathApp.block_types.SYMBOL) {
        let sizes = [];
        let names = [];

        sizes.push(leftBlock.size);
        sizes.push(MathApp.selected_block.size);
        names.push(leftBlock.name);
        names.push(MathApp.selected_block.name);
      
        let size = {
            width : 0,
            height: 0
        };

        sizes.forEach(i => {
            size.width += i.width ;
            size.height += i.height;
        });
      

        leftBlock.destroy();
        MathApp.selected_block.destroy();

        let newMultiBlock = new MathApp.MultiBlock(newPos,sizes,names,size);
        
    }
    else if (MathApp.selected_block.type == MathApp.block_types.SYMBOL && leftBlock.type == MathApp.block_types.MULTIBLOCK) {
        console.log("yes");
        let sizes = [];
        let names = [];

        sizes.push(leftBlock.size);
        sizes.push(MathApp.selected_block.size);
        names.push(leftBlock.name);
        names.push(MathApp.selected_block.name);
    }
    
}

// position : 시작 위치 받음, size : 모든 심볼들의 size를 배열로 받음 , names : 모든 심볼들의 이름을 배열로 받음
MathApp.MultiBlock = function (position, sizes = [], names = [], size) {
    MathApp.Block.call(this,position,size);
    this.size = size;
    this.type = MathApp.block_types.MULTIBLOCK;    
    this.position = position;
    this.sizes = sizes;
    this.names = names;    
   
    let block = this;
    let Pos = { x: position.x, y: position.y }
    
    this.numberOfSymbols = names.length;

    for (var i = 0; i < names.length ; i++) {
        
        if (names[i] in MathApp.symbol_paths) 
        {           
            let w = sizes[i].width;
            let h = sizes[i].height;

            let newPos = Pos;

            newPos.x +=  w * i;                       

            let path = "resources/" + MathApp.symbol_paths[names[i]] + ".jpg";
           
            fabric.Image.fromURL(path, function(img) {
                img.scaleToWidth(37);
                img.scaleToHeight(50);
                MathApp.canvas.add(img).renderAll();
                block.visual_items.push(img);
            }, {
                left: newPos.x - 37/2,
                top : newPos.y - 23,
            });

            let background = new fabric.Rect({
                    left: newPos.x - w/2,
                    top: newPos.y -h/2,
                    width: w,
                    height: h,
                    fill: "rgba(255,255,255,1)",
                    stroke: "rgba(0,0,0,0)",
                    selectable: false
            });

            let boundary = new fabric.Rect({
                left: newPos.x - w/2,
                top: newPos.y - h/2,
                width: w,
                height: h,
                fill: "rgba(0,0,0,0)",
                stroke: "rgba(0,0,255,1)",
                strokeWidth: 5,
                selectable: false
            });
          
           

            MathApp.canvas.add(background);
            MathApp.canvas.add(boundary);

            block.visual_items.push(background);
            block.visual_items.push(boundary);
            
        }
    }  
    
       
}

MathApp.MultiBlock.prototype = Object.create(MathApp.Block.prototype);





// 블록 생성자를 상속. 매개변수로 주어진 이름에 해당하는 사진, 바탕, 테두리 를 생성하여 비주얼 아이템에 push, canvas에 생성한 객체들 푸시
MathApp.Symbol = function(position, size, name) {
    MathApp.Block.call(this, position, size);
    this.type = MathApp.block_types.SYMBOL;
    this.name = name;
    this.numberOfSymbols = 1;
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

            MathApp.canvas.add(background);
            MathApp.canvas.add(img);
            MathApp.canvas.add(boundary);

            block.visual_items.push(background);
            block.visual_items.push(img);
            block.visual_items.push(boundary);
        });
    }
}

MathApp.Symbol.prototype = Object.create(MathApp.Block.prototype);

MathApp.Symbol.prototype.GetName = function() {
    return this.name;
}

MathApp.Symbol.prototype.GetSize = function() {
    return this.size;
}

MathApp.Button = function(position, size, name, opType) {    
    MathApp.Block.call(this, position, size);
    this.type = MathApp.block_types.BUTTON;
    this.name = name;   
    this.button_type = opType;
    this.numberOfSymbols = 1;
    let block = this;

    let background = new fabric.Rect({
        left: position.x - size.width/2,
        top: position.y - size.height/2,
        width: size.width,
        height: size.height,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 3,
        selectable: false
    });

    let text = new fabric.Text(name, {
        left: position.x - size.width/3,
        top: position.y - size.height/5,
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

MathApp.Button.prototype.buttonOperation = function( mem_selected_block) {

    let op = this.name;   

    if (mem_selected_block == null && this.button_type == MathApp.button_types.OPERATION) {
        return;
    }
    else if (mem_selected_block != null) {
        MathApp.selected_block = mem_selected_block;
        MathApp.selected_block.onSelected();    
    }
    switch(op) {
        case "Delete" : {
            MathApp.selected_block.destroy();
            break;
        }
        case "Duplicate" : {
            key = MathApp.selected_block.name;
            makeSymbol(key);
            break;
        }
        case "sin" : {
            makeSymbol("sin");
            break;
        }
        case "cos" : {
            makeSymbol("cos");
            break;
        }
        case "tan" : {
            makeSymbol("tan");
            break;
        }
        case "exp" : {
            makeSymbol("exp");
            break;
        }
        case "log" : {
            makeSymbol("log");
            break;
        }
        case "sqrt" : {
            makeSymbol("sqrt");
            break;
        }
        case "pi" : {
            makeSymbol("pi");
            break;
        }
        case "e" : {
            makeSymbol("number_e");
            break;
        }
        case "Cross" : {
            makeSymbol("cross");
            break;
        }
        case "Dot Product" : {
            makeSymbol("dot");
            break;
        }
        case "Determinant" : {
            makeSymbol("det");
            break;
        }
        case "Inverse" : {
            makeSymbol("inv");
            break;
        }
        case "Multiply" : {
            makeSymbol("multiply", {width: 30, height:0});
            break;
        }
    }
   
}

function makeSymbol(key, ssize) {
   
    if (ssize == null || ssize == undefined) {
        ssize = { width : 0, height: 0};
    }

    let size = {
        width : SYMBOL_WIDTH + ssize.width,
        height : SYMBOL_HEIGHT + ssize.height
    };
    let position = {
        x : Math.random() * (MathApp.canvas.width - size.width - BUTTON_BOX_WIDTH) + size.width/2,
        y : Math.random() * (MathApp.canvas.height - size.height) + size.height/2
    };

    let new_symbol = new MathApp.Symbol(position, size, key);
}

//
function initOperationButtons() {

    let size = {
        width : 120,
        height: 50
    };

    let position = [];
    
    let position0 = {
        x: 900,
        y: 0
    }

    let position1 = {
        x: 950,
        y: 50
    }

    let position2 = {
        x: 950,
        y: 120
    }

    let position3 = {
        x : 950,
        y : 190
    }

    let position4 = {
        x : 950,
        y : 260
    }

    position.push(position0);
    position.push(position1);
    position.push(position2);
    position.push(position3);
    position.push(position4);

    let positioning = {
        x: -30 , y : 20
    }

    for (var i = 0 ; i < position.length ; i++) {
        position[i].x += positioning.x;
        position[i].y += positioning.y;
    }    

    let operation =  MathApp.button_types.OPERATION;   

    let operation_label = new MathApp.Text(position0, {width: 60, height: 50}, "Operation Buttons",20);

    let delete_button = new MathApp.Button(position1, size, "Delete", operation);
   
    let duplicate_button = new MathApp.Button(position2, size, "Duplicate",operation);
   
    let disassemble_button = new MathApp.Button(position3, size, "Disassemble",operation);
    
    let execute_button = new MathApp.Button(position4, size, "Execute",operation);


}


function initSupportButtons() {

    let support = MathApp.button_types.SUPPORT;

    let size = {
        width: 60, height : 50
    }

    let position = [];
    
    let position0 = { x:  910,  y : 340 }
    let position1 = { x:  980,  y : 340 }
    let position2 = { x:  910,  y : 410 }
    let position3 = { x : 980,  y : 410 }
    let position4 = { x : 910,  y : 480 }
    let position5 = { x : 980,  y : 480 }
    let position6 = { x : 910,  y : 560 }
    let position7 = { x : 980,  y : 560 }
    let label_position1 = {x: 910, y : 320};
    let label_position2 = {x: 910, y : 340};

    position.push(position0);
    position.push(position1);
    position.push(position2);
    position.push(position3);
    position.push(position4);
    position.push(position5);
    position.push(position6);
    position.push(position7);
    //position.push(label_position);

    let positioning = {
        x: -30 , y : 40
    }

    for (var i = 0 ; i < position.length ; i++) {
        position[i].x += positioning.x;
        position[i].y += positioning.y;
    }    
    
    let support_button = new MathApp.Text(label_position1, size, "Constant and ",15);
    let support_button2 = new MathApp.Text(label_position2 , size, "predefined functions",15);

    let sin = new MathApp.Button(position0, size, "sin",support);

    let cos = new MathApp.Button(position1, size, "cos",support);

    let tan = new MathApp.Button(position2, size, "tan",support);

    let exp = new MathApp.Button(position3, size, "exp",support);

    let log = new MathApp.Button(position4, size, "log",support);

    let sqrt = new MathApp.Button(position5, size, "sqrt",support);

    let pi = new MathApp.Button(position6, size, "pi",support);

    let e = new MathApp.Button(position7, size, "e",support);


}


function initVectorMatrixButtons() {
    
    let support = MathApp.button_types.SUPPORT;

    let size = { width : 100, height: 50 };
    let position = [];
    let position0 = { x: 870, y : 620 }
    let position1 = { x: 840, y : 680 }
    let position2 = { x: 950, y : 680 }
    let position3 = { x: 840, y : 740 }
    let position4 = { x: 950, y : 740 }
    let position5 = { x: 840, y : 800}

    position.push(position0);
    position.push(position1);
    position.push(position2);
    position.push(position3);
    position.push(position4);
    position.push(position5);

    let positioning = {
        x: 0 , y : 30
    }

    for (var i = 0 ; i < position.length ; i++) {
        position[i].y += positioning.y;
    }    

    let operation_label = new MathApp.Text(position0, {width: 60, height: 50}, "Vector & Matrix Buttons",15);

    let delete_button = new MathApp.Button(position1, size, "Cross", support );
   
    let duplicate_button = new MathApp.Button(position2, size, "Dot Product",support);
   
    let disassemble_button = new MathApp.Button(position3, size, "Inverse",support);
    
    let execute_button = new MathApp.Button(position4, size, "Determinant",support);

    let multiply_button = new MathApp.Button(position5, size, "Multiply", support)
}

MathApp.Text = function(position, size, name, fontSize) {    
    
    this.name = name;  
 
    let text = new fabric.Text(name, {
        left: position.x - size.width,
        top: position.y - size.height/5,
        selectable: false,
        fontFamily: 'System',
        fontSize: fontSize,
        fontWeight: 'bold',
        textAlign: 'center',
        stroke: 'black',
        fill: 'black'
    });
    
    MathApp.canvas.add(text);
}


$(document).ready(function() {
    MathApp.initialize();    
});



