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

function assert(pred, msg) {
    if(!pred){
        throw new Error(msg)
    }
}


function chain(promises,seed) {
    return promises.reduce(function(prev,cur){
        return prev.then(cur)
    },seed)
}

function registerSystemServices() {
    this.addResolver('@cacheable',CacheableResolver)
    this.addResolver('@transient',TransientResolver)
    this.addResolver('@impl',ImplResolver)
    this.addActivator('@factory',FactoryActivator)
    this.addActivator('@constructor',ConstructorActivator)
    this.addActivator('@impl',ImplActivator)

    //use `bluebird` OOTB
    var Promise = new ComponentModel('@Promise',require('bluebird'))
    Promise.resolver('@cacheable')
    Promise.activator('@impl')
    this.register(Promise)
}

/**
 * The workhorse for resolving dependencies
 * @class Kernel
 * */
function Kernel(){
    this.registrations = new Registrations()
    this.decorators = new Decorators()
    this.resolvers = {}
    this.activators = {}
    registerSystemServices.call(this)
}

/**
 * Instructs resolution of `targetKey` to be decorated by `decoratorKey`.
 * @method decorate
 * @memberof Kernel
 * @return {Kernel}
 * */
Kernel.prototype.decorate = function(targetKey, decoratorKey) {
    this.decorators.put(targetKey,decoratorKey)
    return this
}
/**
 * Registers a {ComponentModel} with the kernel
 * @method register
 * @param {ComponentModel} model
 * @return {Kernel}
 * */
Kernel.prototype.register = function(model) {
    this.registrations.put(model)
    return this
}
/**
 * Resolve the Promise implementation ('@Promise') to begin a promise chain
 * @method promise
 * @return {Promise} resolving the Promise implementation
 * */
Kernel.prototype.promise = function() {
    var promise = this.registrations.get('@Promise')
    return promise.impl.resolve(promise.impl)

}
/**
 * Registers an custom activator for instantiating a service
 * @method addActivator
 * @param {String} key the key to use when registering an component that uses this
 * @param {Function} impl the function constructor to use as an activator. This must expose an `activate` function that returns
 * either a value (the instance of `impl`) _or_  a {Promise} resolving the instance
 * @return {Kernel}
 * */
Kernel.prototype.addActivator = function(key, impl) {
    this.activators[key] = impl
    return this
}
/**
 * Registers an custom resolver for resolving a service
 * @method addResolver
 * @param {String} key the key to use when registering an component that uses this
 * @param {Function} impl the function constructor to use as an resolver. This must expose an `resolve` function that returns
 * either a value _or_ a {Promise} resolving the instance
 * @return {Kernel}
 * */
Kernel.prototype.addResolver = function(key, impl) {
    this.resolvers[key] = impl
    return this
}
/**
 * Creates a resolution context to be used at runtime
 * @method createContext
 * @param {ResolveableComponentModel} model the registered model
 * @param {Object} [deps] Values passed in to `.resolve` to use during instantiation
 * @return {Object} with a `model`, the `activator`, the `resolver`, the `Promise` implementation, and `deps` arguments to pass into the instance
 * */
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

/**
 * Resolves a service by `key` while passing in the `deps` as values
 * @method resolve
 * @memberof Kernel
 * @instance
 * @param {String} key the service name to resolve
 * @param {Object} deps a key/value map to use for dynamically passing arguments into the resolved instance.
 * @return {Promise} resolving the service
 * @example
 *
 * ```js
 *
 * //given
 * function MyService(){}
 * MyService.inject = ['dep1','dep2']
 * ioc.value('dep1','dep1')
 * ioc.factory('myService',MyService)
 *
 * //when
 * ioc.resolve('myService',{ dep2: 'myvalue'})
 *
 * //it will use 'myvalue' for the dep2 dependency resolution,
 * //but resolve dep1 from the container.
 *
 * ```
 */
Kernel.prototype.resolve = function(key, deps) {
    //lazily make the component resolveable
    return this._demandResolveable(key)
        .then(function(model){
            return this.createContext(model, deps)
                .then(this._resolveContext.bind(this))
        }.bind(this))
}
/**
 * Resolves all dependencies in `keys`, using `deps` to pass into each dependency
 * @method resolveAll
 * @memberof Kernel
 * @instance
 * @param {Array} keys Array of string keys to resolve
 * @param {Object} deps Key/value map to use, just like in `resolve` method
 * @return {Promise} resolving all instances of the services in order of `keys`
 * */
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
/**
 * @method invoke
 * @memberof Kernel
 * @instance
 * @param {Any} context The `this` to use during invocation.
 * @param {Function} fn The function to invoke
 * @param {Object} [deps] The key/value map to use, just like in `resolve` method
 * @return {Any} The result of the invocation
 * */
Kernel.prototype.invoke = function(context, fn, deps){
    assert(context,'context is required. this is the context for invoking the fn.')
    assert(fn,'fn is required')

    return this.resolveAll(fn.inject || [], deps)
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
/**
 * Starts the container, invoking all `startable` implementations
 * Needs to :
 * 1. collect all models that are startable
 * 2. first order them according to their root .inject
 * 3. next order them according to their 'startable' .inject
 * 3. invoke each in series
 * @method start
 * @return {Promise} resolving the startable instances
 * */
Kernel.prototype.start = function(){
    return this.promise()
        .then(function(Promise){
            //@todo ordering of startables?
            var startables = this.registrations.startables()
            //map to the starter function
            startables = startables.map(function(model){
                return this._startModel.bind(this,model)
            },this)
            //execute in series (not Promise.all)
            return chain(startables,Promise.resolve())
        }.bind(this))
}

Kernel.prototype.validate = function() {
    return this.registrations.validate()
}
