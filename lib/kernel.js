'use strict';

var Registrations = require('./registrations')
    ,Decorators = require('./decorators')
    ,ComponentModel = require('./component-model')
    ,CacheableResolver = require('./cacheable-resolver')
    ,TransientResolver = require('./transient-resolver')
    ,ImplResolver  = require('./impl-resolver')
    ,DecoratingResolver = require('./decorating-resolver')
    ,FactoryActivator = require('./factory-activator')
    ,ConstructorActivator = require('./constructor-activator')
    ,ImplActivator = require('./impl-activator')
    ,ResolveableComponentModel = require('./resolveable-component-model')
    ;
module.exports = Kernel

var warn = console.warn.bind(console)
    ,error  = console.error.bind(console)
    ,debug = console.log.bind(console)


function registerSystemServices() {
    this.resolvers['@cacheable'] = CacheableResolver
    this.resolvers['@transient'] = TransientResolver
    this.resolvers['@impl'] = ImplResolver
    this.activators['@factory'] = FactoryActivator
    this.activators['@constructor'] = ConstructorActivator
    this.activators['@impl'] = ImplActivator

    var Promise = new ComponentModel('@Promise',require('bluebird'))
    Promise.resolver('@cacheable')
    Promise.activator('@impl')
    this.register(Promise)

}

function demandResolveable(model) {
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
    this.decorators = new Decorators()
    this.resolvers = {}
    this.activators = {}
    registerSystemServices.call(this)
}

Kernel.prototype.decorate = function(targetKey, decoratorKey) {
    this.decorators.put(targetKey,decoratorKey)
    return this
}
Kernel.prototype.register = function(model) {
    this.registrations.put(model)
    return this
}
Kernel.prototype.promise = function() {
    var promise = this.registrations.get('@Promise')
    return promise.impl.resolve(promise.impl)

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
    if(!model) {
        throw new Error('model is required')
    }
    if(!model.isResolveable) {
        throw new Error('model must be resolveable')
    }
    //@todo we gotta hold onto the resolver once created...
    var context = {
            model: model
            ,activator: model.activator()
            ,Promise: undefined
            ,resolver: model.resolver()
        }
    return this.promise()
        .then(function(Promise){
            context.Promise = Promise
            return context
        })
}
Kernel.prototype.demandResolveable = function(key) {
    var model = this.registrations.get(key)
    if(!model) {
        throw new Error('model is required')
    }
    if(model.isResolveable) {
        return model
    }
    var resolveable = ResolveableComponentModel.fromModel.call(this,model)
    //decorate if possible
    var decorators = this.decorators.get(resolveable.key)
        .map(this.demandResolveable.bind(this))
    if(decorators.length){
        resolveable.resolver(new DecoratingResolver(resolveable,decorators))
    }
    this.register(resolveable)
    return resolveable
}

Kernel.prototype.resolve = function(key, deps) {
    //lazily make the component resolveable
    var model = this.demandResolveable(key)

    return this.createContext(model, deps)
        .then(function(context){
            return this.resolveAll(model.inject,deps)
                .then(function doResolve(resolvedDeps){
                    try {
                        return Promise.resolve(context.resolver.resolve(context, resolvedDeps))
                    } catch(err) {
                        error('error trying to resolve',context.model.key,err.message,err.stack)
                        throw err
                    }
                }.bind(this))

        }.bind(this))
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
