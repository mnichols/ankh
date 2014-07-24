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
Kernel.prototype._demandResolveable = function(key) {
    var model = this.registrations.get(key)
    if(!model) {
        throw new Error('model is required')
    }
    return this.promise().then(function(){
        if(model.isResolveable) {
            return model
        }
        var resolveable = new ResolveableComponentModel(model)
        return resolveable.prepare(this)
            .then(this._decorate.bind(this))
            .then(this.register.bind(this))
            .then(function(){
                return resolveable
            })
    }.bind(this))
}
Kernel.prototype._decorate = function(resolveable) {
    //decorate if possible
    var decorators = this.decorators.get(resolveable.key)
        .map(this._demandResolveable.bind(this))
    return this.promise()
        .then(function(Promise){
            if(!decorators.length){
                return resolveable
            }
            return Promise.all(decorators)
                .then(function(resolvedDecorators){
                    resolveable.resolver(new DecoratingResolver(resolveable
                        ,resolvedDecorators
                        ,this))
                    return resolveable
                }.bind(this))
        }.bind(this))

}

Kernel.prototype.resolve = function(key, deps) {
    //lazily make the component resolveable
    return this._demandResolveable(key)
        .then(function(model){
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
                        .then(this.handleResolved.bind(this,context,deps))
                }.bind(this))
        }.bind(this))
}
Kernel.prototype.handleResolved = function(context, deps,  instance) {
    var initializable = context.model.initializable
        ,Promise = context.Promise
        ;
    if(!initializable) {
        return instance
    }
    var fn = instance[initializable]
    if(!fn){
        throw new Error(context.model.key + ' was designated as initializable, but ' +
                        initializable + ' function could not be located.')
    }
    return this.invoke(instance, fn, deps)
        .then(function(result){
            return instance
        })
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
Kernel.prototype.invoke = function(context, fn, args){
    assert(context,'context is required. this is the context for invoking the fn.')
    assert(fn,'fn is required')

    return this.resolveAll(fn.inject || [], args)
        .then(function(resolvedDeps){
            return fn.apply(context,resolvedDeps)
        })

}
Kernel.prototype.start = function(){
    return this.promise()
        .then(function(Promise){
            var startables = this.registrations.startables()
                .map(function(model){
                    return this.resolve(model.key)
                        .then(function(instance){
                            var fn = instance[model.startable]
                            return this.invoke(instance, fn)
                                .then(function(){
                                    return instance
                                })
                        }.bind(this))
                }.bind(this))
            return Promise.all(startables)
        }.bind(this))
}
