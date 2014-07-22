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
    return false
    //return config.reservedKeys.indexOf(key) > -1
}
Registrations.prototype.startables = function(){
    return Object.keys(this._registrations)
        .filter(function(key){
            return !!this._registrations[key].impl.startable
        },this)
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

    var deps = model.inject
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
    this.keys()
        .forEach(function(k){
            return this._graphDeps(graph,allDeps,k)
        }, this)
    return graph
}
Registrations.prototype.validate = function(key) {
    return new Promise(function(resolve,reject){
        var graph = this.generateGraph(key)
        var vertices = toposort(graph)
        if(vertices instanceof Error){
            return reject(vertices)
        }
        //reverse will return the legal execution order
        return resolve(vertices.reverse())
    }.bind(this))
}
Registrations.prototype.map = function(fn){
    return this.keys()
        .map(function(key){
            return fn(this._registrations[key])
        },this)

}

