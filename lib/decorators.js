'use strict';

var util = require('util')
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

    Object.defineProperty(this, '_decoratorKeys',{
        enumerable: false
        , configurable: false
        , writable: false
        , value: []
    })
}
Decorators.prototype.validate = function validateDecoration(targetModel, decoratorModel) {
    if(targetModel.isOneInstance() !== decoratorModel.isOneInstance()) {
        var msg = 'Lifestyle mismatch:\n' +
            'Using Decorator \'%s\' with \'%s\' ' +
            'could have unexpected results.'
        msg = util.format(msg
            ,decoratorModel.toString()
            ,targetModel.toString()
         )
        throw new Error(msg)
    }
}

Decorators.prototype.isDecorator = function(decoratorKey) {
    return this._decoratorKeys.indexOf(decoratorKey) > -1
}

Decorators.prototype.get = function(targetKey) {
    return (this._decorators[targetKey] || [])
}
Decorators.prototype.put = function(targetKey, decoratorKey) {
    this._decoratorKeys.push(decoratorKey)
    var arr = (this._decorators[targetKey] = this.get(targetKey))
    arr.push(decoratorKey)
    return this
}
Decorators.prototype.clear = function(){
    for(var k in this._decorators) {
        ;(delete this._decorators[k])
    }
    this._decoratorKeys.length = 0
}
