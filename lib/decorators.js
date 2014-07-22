'use strict';

var util = require('util')
    ,ComponentModel = require('./component-model')
    ,DecoratingResolver = require('./decorating-resolver')
    ;



module.exports = Decorators
/**
 * Decorators collection
 * */
function Decorators() {
    Object.defineProperty(this,'_decorators',{
        enumerable: false
        ,configurable: false
        ,writable: false
        ,value: {}
    })
}
Decorators.prototype.bind = function(registrations){
    assert(registrations,'registrations are required')
    Object.keys(this._decorators)
        .forEach(function(k) {
            var decs = (this._decorators[k] || [])
            decs.forEach(function(dec){
                //refetch each loop
                //to compose decoration
                var targetModel = registrations.get(k)
                var decoratorModel = registrations.get(dec)
                this.decorate(registrations, targetModel,decoratorModel)
            },this)
        },this)
}
Decorators.prototype.get = function(targetKey) {
    return (this._decorators[targetKey] || [])
}
Decorators.prototype.put = function(targetKey, decoratorKey) {
    var arr = (this._decorators[targetKey] = this.get(targetKey))
    arr.push(decoratorKey)
    return this
}
Decorators.prototype.clear = function(){
    for(var k in this._decorators) {
        ;(delete this._decorators[k])
    }
}
