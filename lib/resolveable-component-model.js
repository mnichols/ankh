'use strict';

module.exports = ResolveableComponentModel

function ResolveableComponentModel(model) {
    this.key = model.key
    this.impl = model.impl
    this.inject = (model.inject || [])
    this._model = model
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
ResolveableComponentModel.fromModel = function(model) {
    var resolveable = new ResolveableComponentModel(model)
    var Resolver = this.resolvers[model.resolver()]
        ,Activator = this.activators[model.activator()]
    resolveable.resolver(new Resolver())
    resolveable.activator(new Activator())
    return resolveable
}
ResolveableComponentModel.prototype.toString = function(){
    return this._model.key + ' [' + this._model.resolver() +  ']'
}
