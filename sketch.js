"use strict";

class MIDI{
    constructor(){
        this.midi = null;
        this.inputs = [];
        this.outputs = [];
        this.params = {};
    }
    _success(midiAccess){
        return new Promise((resolve, reject) => {
            console.log("MIDI READY");
            this.midi = midiAccess;
            resolve();
        });
    }
    _failure(msg){
        console.log("Failed - " + msg);
    }
    _setInputs(){
        return new Promise((resolve, reject) => {
            console.log("INPUTS READY");
            this.inputs = this.midi.inputs;
            this.inputs.forEach((key) => {
                key.onmidimessage = this._onMidiMessage.bind(this);
            });
            resolve();
        });
    }
    _onMidiMessage(event){
        this.params[event.data[0]] = this.params[event.data[0]] ? this.params[event.data[0]] : {};
        this.params[event.data[0]][event.data[1]] = event.data[2];
        console.log(event.data[1] + " : " + event.data[2]);
    }
    _setOutputs(){
        return new Promise((resolve, reject) => {
            console.log("OUTPUTS READY");
            this.outputs = this.midi.outputs;
            this.outputs.forEach((key) => {
                console.log(key);
                key.send([176, 64, 1]);
            });
            resolve();
        });
    }
    connect(){
        return navigator.requestMIDIAccess()
            .then(this._success.bind(this), this._failure.bind(this))
            .then(this._setInputs.bind(this), this._failure.bind(this))
            .then(this._setOutputs.bind(this), this._failure.bind(this))
    }
}

class Wave{
    constructor(p){
        this.p = p;
        this.STEP = 40;
        this.alpha;
        this.range;
        this.color;
        this.random;
    }
    init(){
        this.alpha = 0;
        this.range = 0;
        this.color = 0;
    }
    update(){
        if(!midi.params[176]){
            return;
        }
        this.alpha = midi.params[176][0] ? midi.params[176][0] * 2 : 0;
        this.range = midi.params[176][16] ? midi.params[176][16] * 10 : 0;
        if(midi.params[176][64]){
            this.color = 0; //black
        }else{
            this.color = 255; //white
        }
        this.random = Math.random();
    }
    _getRandomNoise(i){
        var i = i ? i : Math.random() / 1000;
        return this.p.noise(this.random + (i * 0.1)) * this.range - (this.range / 2) + (this.p.windowHeight / 2);
    }
    draw(){
        var before = this._getRandomNoise();
        var after;
        this.p.stroke(this.color, this.alpha);
        for(var i = 0; i < this.p.windowWidth; i += this.STEP){
            after = this._getRandomNoise(i);
            this.p.line(i, before, i + this.STEP, after);
            before = after;
        }
    }
}

class Circle{
    constructor(p){
        this.p = p;
        this.r;
        this.CENTER_X = p.windowWidth / 2;
        this.CENTER_Y = p.windowHeight / 2;
        this.noiseParam = 0;
        this.alpha = 0;
        this.color = 0;
    }
    init(){
        this.r = 0;
    }
    update(){
        if(!midi.params[176]){
            return;
        }
        this.alpha = midi.params[176][1] ? midi.params[176][1] * 2 : 0;
        this.r = midi.params[176][17] ? midi.params[176][17] : 0;
        if(midi.params[176][65]){
            this.color = 0;
        }else{
            this.color = 255;
        }
    }
    _getRandomNoise(){
        return this.p.noise(Math.random()) * 10;
    }
    draw(){
        this.p.strokeWeight(3);
        this.p.noStroke();
        this.p.fill(this.color, this.alpha);
        var random = this._getRandomNoise();
        this.p.ellipse(this.CENTER_X, this.CENTER_Y, this.r * random, this.r * random);
    }
}

class Gritch{
    constructor(p){
        this.p = p;
        this.time = 0;
        this.step = 0;
        this.color = 0;
        this.alpha = 0;
    }
    init(){
        this.step = 0;
    }
    update(){
        if(!midi.params[176]){
            return;
        }
        if(this.time >= this.step){
            this.time = 0;
            if(this.alpha === 0){
                this.alpha = 255;
            }else{
                this.alpha = 0;
            }
        }
        this.time += 1;
        this.step = 60 * (127 - midi.params[176][7]) / 127;
        if(this.step === 60){
            this.alpha = 255;
        }
    }
    draw(){
        this.p.background(this.color, this.alpha);
    }
}

var midi = new MIDI();
var wave;
var circle;
var gritch;

var sketch = function(p){
    var centerX;
    var centerY;
    var step = 10;
    var span;
    p.setup = function() {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.background(0);
        centerX = p.windowWidth / 2;
        centerY = p.windowHeight / 2;
        wave = new Wave(p);
        circle = new Circle(p);
        gritch = new Gritch(p);
        wave.init();
        circle.init();
        gritch.init();
    };
    p.draw = function() {
        gritch.update();
        circle.update();
        wave.update();
        gritch.draw();
        circle.draw();
        wave.draw();
    }
}

midi.connect()
    .then(function(){
        var p = new p5(sketch);
    });
