'use strict';

var DependencyGraph = require('./dependency-graph')

var warn = console.warn.bind(console)
    ,error = console.error.bind(console)
    ,debug = console.log.bind(console)
;
module.exports = Registrations

function assert(pred, msg) {
    if(pred){
        return
    }
    throw new Error(msg)
}

//simply append left string to right string
function hashCode(left, right) {
    return left + '' + right + ''
}



//flattens array of arrays of arrays...
function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
        // See if this index is an array that itself needs to be flattened.
        if(toFlatten.some && toFlatten.some(Array.isArray)) {
            return flat.concat(flatten(toFlatten));
            // Otherwise just add the current index to the end of the flattened array.
        } else {
            return flat.concat(toFlatten);
        }
    }, []);
};
/**
 * Registrations collection stores all configurations
 * created for the container to resolve at runtime
 * */
function Registrations() {
    Object.defineProperty(this,'_registrations',{
        value: {}
        ,enumerable: false
        ,configurable: false
        ,writable: false
    })
    this.get = this.get.bind(this)
    this.put = this.put.bind(this)
    this.clear = this.clear.bind(this)
    this.has = this.has.bind(this)
}
Registrations.RESERVED_KEYS = ['@impl']
Registrations.prototype.get = function(key) {
    if(!key) {
        throw new Error('key is required')
    }
    var model =  this._registrations[key]
    if(model) {
        return model
    }
    throw new Error(key + ' is not registered.')
}
Registrations.prototype.put = function(model) {
    assert(model,'model is required')
    if(this.isReserved(model.key)) {
        throw new Error(model.key + ' is reserved. Choose another key.')
    }
    this._registrations[model.key] = model
}
Registrations.prototype.has = function(key) {
    return !!this._registrations[key]
}
Registrations.prototype.clear = function(){
    for(var k in this._registrations) {
        ;(delete this._registrations[k])
    }
}
Registrations.prototype.keys = function(){
    return Object.keys(this._registrations)
}
Registrations.prototype.isReserved = function(key) {
    return (Registrations.RESERVED_KEYS.indexOf(key) > -1)
}

/**
 * Provide a executable graph of model keys that
 * designated `startable` on them.
 * This orders them according to the model's `inject`
 * setting, finally appending models which don't have dependencies.
 * @method startables
 * @return {Array} of strings; model keys in executable order
 * */
Registrations.prototype.startables = function(){
    var keys = Object.keys(this._registrations)
    .filter(function(key){
        return !!this._registrations[key].startable
    },this)
    var graph = this.createGraph(keys,keys,Registrations.RESERVED_KEYS)
    return graph.legal()
        //reverse the ordering so that dependents can manipulate their dependencies
        .reverse()
        .map(this.get.bind(this))
}


Registrations.prototype.toMap = function(keys) {
    return (keys || this.keys())
        .map(function(key){
            return this.get(key)
        },this)
        .reduce(function(prev,model){
            prev[model.key] = model.inject
            return prev
        },{})
}
Registrations.prototype.createGraph = function(keys,include,exclude){
    var map  = this.toMap(keys)
    return new DependencyGraph(map,include,exclude)
}


