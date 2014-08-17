'use strict';
var clone = require('clone')
    ,toposort = require('toposort')
    ;

module.exports = DependencyGraph

function DependencyGraph(mapOrArray, include,exclude) {
    if(!(this instanceof DependencyGraph)) {
        return new DependencyGraph(mapOrArray,include,exclude)
    }
    if(!mapOrArray) {
        throw new Error('mapOrArray is required')
    }
    this.include = (include || [])
    this.exclude = (exclude || [])
    this._input = mapOrArray
    this._map = undefined
}
/**
 * Transforms a map of serviceKey / .inject arrary to an object map with
 * the inject deps denormalized per serviceKey
 * @method generateDependencyGraph
 * @return {Object} of `serviceKey: [[]]`
 * */
DependencyGraph.prototype.fromMap = function(map) {
    return Object.keys(map || {})
        .reduce(function(graph, key){
            var arr
            graph[key] = (map[key] || [])
                .filter(function(dep){
                    return this.has(dep) && !this.excludes(dep)
                },this)
                .map(function(dep){
                    return [key,dep]
                },this)
            return graph
        }.bind(this),{})

}
DependencyGraph.prototype.has = function(dep) {
    if(!this.include) {
        return true
    }
    return (this.include.indexOf(dep) > -1)
}

DependencyGraph.prototype.excludes = function(dep) {
    return (this.exclude && this.exclude.indexOf(dep) > -1)
}
DependencyGraph.prototype.load = function(mapOrArray){
    if(this._map) {
        return
    }
    if(!Array.isArray(mapOrArray)) {
        this._map = this.fromMap(mapOrArray)
    }
}

/**
 * Lazily generates the map of deps and then returns a clone of it
 * */
DependencyGraph.prototype.toMap = function(){
    this.load(this._input)
    return clone(this._map)
}
/**
 * Converts dependency map to an array of [{serviceKey},[{serviceKey,dep1,...}]]
 * @method toArray
 * @return {Array} [{serviceKey},[[{serviceKey,dep1}],[{serviceKey,dep2}]..]]
 * */
DependencyGraph.prototype.toArray = function(sortBy){
    return  (sortBy || [])
        .concat(Object.keys(this.toMap()))
        .filter(this.unique)
        .map(function(key){
            return [key,this._map[key]]
        },this)
}

DependencyGraph.prototype.unique = function(key,index,arr) {
    return arr.indexOf(key) === index
}
DependencyGraph.prototype.legal = function() {
    return this.validate()
        .reverse()
        .filter(function(key){
            //prevent undefined
            return !!key
        })
        .concat(Object.keys(this._map))
        .filter(this.unique,this)
}
DependencyGraph.prototype.validate = function(){
    this.load(this._input)
    var values = []
    Object.keys(this._map)
        .forEach(function(key){
            values.push.apply(values,this._map[key])
        },this)

    var vertices = toposort(values)
    if(vertices instanceof Error){
        throw vertices
    }
    return vertices

}
