'use strict';

var dynamicNew = require('./dynamic-new')
module.exports = ResolveableComponentModel

function ResolveableComponentModel(model) {
    if(!(this instanceof ResolveableComponentModel)){
        return new ResolveableComponentModel(model)
    }
    this.key = model.key
    this.impl = model.impl
    this.inject = (model.inject || [])
    this._model = model
    this.initializable = model.initializable
    this.startable = model.startable
}
ResolveableComponentModel.prototype.isResolveable = true


ResolveableComponentModel.prototype.resolver = function(val) {
    if(val) {
        this._resolver = val
    }
    if(!this._resolver) {
        throw new Error('resolver has not been assigned for:' + this.key)
    }
    return this._resolver
}

ResolveableComponentModel.prototype.activator = function(val) {
    if(val) {
        this._activator = val
    }
    if(!this._activator) {
        throw new Error('activator has not been assigned for:' + this.key)
    }
    return this._activator
}
ResolveableComponentModel.prototype.createResolver = function(kernel,key) {
        var Resolver = kernel.resolvers[key]
        var deps = (Resolver.inject || [])
        return kernel.resolveAll(deps)
            .then(dynamicNew.bind(null,Resolver))
}
ResolveableComponentModel.prototype.createActivator = function(kernel,key) {
        var Activator = kernel.activators[key]
        var deps = (Activator.inject || [])
        return kernel.resolveAll(deps)
            .then(dynamicNew.bind(null,Activator))
}
/**
 * Creates resolver and activator implementations, based on the
 * `resolver` and `activator` keys from the inner `model`
 * */
ResolveableComponentModel.prototype.prepare = function(kernel) {
    return kernel.promise()
        .then(function(){
            return this.createResolver(kernel, this._model.resolver())
                .then(this.resolver.bind(this))
                .then(this.createActivator.bind(this,kernel, this._model.activator()))
                .then(this.activator.bind(this))
                .then(function(){
                    return this
                }.bind(this))
        }.bind(this))
}
ResolveableComponentModel.prototype.toString = function(){
    return this._model.key + ' [' + this._model.resolver() +  ']'
}
