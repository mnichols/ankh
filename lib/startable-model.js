'use strict';

module.exports = StartableModel

/**
 * Encapsulate a startable function description
 * @class StartableModel
 * */
function StartableModel(model,instance) {
    if(!model) {
        throw new Error('model is required')
    }
    if(!instance) {
        throw new Error('instance is required')
    }
    if(!(this instanceof StartableModel)) {
        return new StartableModel(model,instance,index)
    }
    this.model = model
    this.key = model.key
    this.instance= instance
    this.fn = instance[model.startable]
    if(!this.fn) {
        throw new Error('The instance of ' +
                        this.key +
                        ' does not have a method ' +
                        model.startable +
                       ' which is required for starting this service.')
    }
    this.inject = (this.fn.inject || [])
    this.hasDeps = (this.inject.length > 0)
}

/**
 * @method dependsOn
 * @param {String} dep the key to check this startable function dependencies agains
 * @return {Boolean} `true` if the function has a dependency on it; otherwise, `false`
 * */
StartableModel.prototype.dependsOn = function(dep){
    return (this.inject.indexOf(dep) > -1)
}

/**
 * @method start
 * @return {Promise} resolving the instance
 * */
StartableModel.prototype.start = function(invoke) {
    return invoke(this.instance,this.fn)
}
