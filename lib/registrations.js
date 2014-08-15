'use strict';

var toposort = require('toposort')
;

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
    return key === '@impl'
}
Registrations.prototype.startables = function(){
    var keys = Object.keys(this._registrations)
    .filter(function(key){
        return !!this._registrations[key].startable
    },this)
    var graph = this._generateGraphForKeys(keys)
    graph = flatten(graph)
    return graph
        .map(this.get.bind(this))
}

/**
 * Recursive build up of a graph array.
 * Note that this will ignore dependencies which have not been registered.
 * This is to allow for dynamic dependency injection at runtime using the props
 * passed into `resolve`
 * @return {Array} with dependencies in left,right array pairs
 * */
Registrations.prototype._graphDeps = function(graph, allDeps, key) {
    var model = this.get(key)
        ,hasher = hashCode.bind(hashCode,key)
    ;

    var deps = (model.inject || [])
    .filter(function(dep){
        var code = hasher(dep)
        return !allDeps[code] &&
            !this.isReserved(dep) && //ignore special keys
            this.has(dep) //perhaps the dependency is intended to be dynamic
    },this)
    if(!deps || !deps.length) {
        return graph
    }
    //first map this dependents
    deps.forEach(function(dep){
        var code = hasher(dep)
        //store our code to prevet circular array!
        allDeps[code] = true
        graph.push([key,dep])
    },this)
    return deps.forEach(this._graphDeps.bind(this,graph,allDeps))

}
Registrations.prototype.generateGraph = function(key) {
    var allDeps = {}
        ,graph  = []
    ;
    if(key) {
        this._graphDeps(graph,allDeps,key)
        return graph
    }
    return this._generateGraphForKeys(this.keys())
}
Registrations.prototype._generateGraphForKeys = function(keys) {
    var allDeps = {}
        ,graph  = []
    ;
    keys = (keys || [])
    keys.forEach(function(k){
        return this._graphDeps(graph,allDeps,k)
    }, this)
    return graph

}
Registrations.prototype.validate = function(key) {
    var graph = this.generateGraph(key)
    var vertices = toposort(graph)
    if(vertices instanceof Error){
        throw vertices
    }
    //reverse will return the legal execution order
    return vertices.reverse()
}

