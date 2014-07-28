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
Kernel.prototype.addActivator = function(key, impl) {
    this.activators[key] = impl
}
Kernel.prototype.addResolver = function(key, impl) {
    this.resolvers[key] = impl
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
            ,deps: (deps || {})
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

    //early return (returns value, not promise)
    if(!decorators.length) {
        return resolveable
    }
    return this.promise()
        .then(function(Promise){
            if(!decorators.length){
                //no decorators configured
                return resolveable
            }
            return Promise.all(decorators)
                .then(function(resolvedDecorators){
                    //replace resolver with decorating resolver
                    resolveable.resolver(new DecoratingResolver(resolveable
                        ,resolvedDecorators
                        ,this))
                    return resolveable
                }.bind(this))
        }.bind(this))

}
/**
 * Perform resolution given a resolveContext object
 * (from `createContext`)
 * */
Kernel.prototype._resolveContext = function(context) {
    var model = context.model
        ,deps = context.deps
        ,inject = model.inject
    return this.resolveAll(inject,deps)
        .then(function doResolve(resolvedDeps){
            try {
                var finish = context.Promise.resolve
                if(!finish) {
                    throw new Error('missing `resolve` on ' + model.key + ' resolver.')
                }
                return finish(context.resolver.resolve(context, resolvedDeps))
            } catch(err) {
                error('error trying to resolve',model.key,err.message,err.stack)
                throw err
            }
        }.bind(this))
        .then(this._initializeInstance.bind(this,context,deps))
}
Kernel.prototype._initializeInstance = function(context,deps,instance){
    var initializable = context.model.initializable
        ,Promise = context.Promise
        ,deps = deps
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

Kernel.prototype.resolve = function(key, deps) {
    //lazily make the component resolveable
    return this._demandResolveable(key)
        .then(function(model){
            return this.createContext(model, deps)
                .then(this._resolveContext.bind(this))
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
Kernel.prototype.invoke = function(context, fn, args){
    assert(context,'context is required. this is the context for invoking the fn.')
    assert(fn,'fn is required')

    return this.resolveAll(fn.inject || [], args)
        .then(function(resolvedDeps){
            return fn.apply(context,resolvedDeps)
        })

}
Kernel.prototype._startModel = function(model){
    assert(model,'model is required')
    return this.resolve(model.key)
        .then(function(instance){
            //startables must expose a function provided by the `startable` config
            var fn = instance[model.startable]
            if(!fn) {
                throw new Error(model.key + ' is not startable. Please check for the `startable` config on the impl ctor.')
            }
            return this.invoke(instance, fn)
                .then(function(){
                    return instance
                })
        }.bind(this))
}
Kernel.prototype.start = function(){
    return this.promise()
        .then(function(Promise){
            var startables = this.registrations.startables()
                .map(this._startModel.bind(this))
            return Promise.all(startables)
        }.bind(this))
}
