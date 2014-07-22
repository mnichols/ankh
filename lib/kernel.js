'use strict';

var Registrations = require('./registrations')
    ,ComponentModel = require('./component-model')
    ,CacheableResolver = require('./cacheable-resolver')
    ,TransientResolver = require('./transient-resolver')
    ,FactoryActivator = require('./factory-activator')
    ,ConstructorActivator = require('./constructor-activator')
    ;
module.exports = Kernel


function registerSystemServices() {
    this.resolvers['@cacheable'] = CacheableResolver
    this.resolvers['@transient'] = TransientResolver
    this.activators['@factory'] = FactoryActivator
    this.activators['@constructor'] = ConstructorActivator


    var Promise = new ComponentModel('@Promise',require('bluebird'))
    Promise.resolver('@cacheable')
    Promise.activator('@impl')
    this.register(Promise)

}
function bindDecorators(decorators) {
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
function Kernel(){
    this.registrations = new Registrations()
    this.resolvers = {}
    this.activators = {}
    registerSystemServices.call(this)
}


Kernel.prototype.register = function(model) {
    this.registrations.put(model)
    return this
}
Kernel.prototype.promise = function() {
    var promise = this.registrations.get('@Promise')
    return promise.impl.resolve(promise.impl)

}
Kernel.prototype.resolveAll = function(keys,deps) {
    keys = (keys || [])
    deps = (deps || {})
    var elements = keys.map(function mapKeys(key){
        if(deps[key]) {
            return deps[key]
        }
        return this.resolve(key,deps)
    }.bind(this))
    return this.promise()
        .then(function(Promise){
            return Promise.all(elements)
        })
}
Kernel.prototype.createActivator = function(key) {
    var res = this.activators[key];
    return this.resolveAll(res.inject)
        .then(function(deps){
            return res.apply(this,deps)
        }.bind(this))
}
Kernel.prototype.createResolver  = function(key) {
    var res = this.resolvers[key]
    return this.resolveAll(res.inject)
        .then(function(deps){
            return res.apply(this,deps)
        }.bind(this))
}
Kernel.prototype.createContext = function(model,deps) {
    //@todo we gotta hold onto the resolver once created...
    var context = {
            model: model
            ,activator: this.activators[model.activator()]
            ,Promise: undefined
            ,resolver: this.resolvers[model.resolver()]
        }
    return this.createResolver(model.resolver())
        .then(function(resolver){
            context.resolver = resolver
            return this.createActivator(model.activator())
                .then(function(activator){
                    context.activator = activator
                    return context
                })
        }.bind(this))
}

Kernel.prototype.resolve = function(key, deps) {
    var model = this.registrations.get(key)
    return this.createContext(function(context){
        return this.resolveAll(model.inject,deps)
            .then(function doResolve(resolvedDeps){
                context.Promise = Promise
                return Promise.resolve(context.resolver.resolve(context, resolvedDeps))
            }.bind(this))

    }.bind(this))
}
