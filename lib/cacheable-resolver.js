'use strict';

module.exports = CacheableResolver
/**
 * Cache the resolved instance. Attempts to resolve this
 * while it is asynchronously resolving will be resolved _after_
 * the inflight resolution is done
 * */
function CacheableResolver() {
    this.inflight = false
}
CacheableResolver.prototype.store = function(instance) {
    Object.defineProperty(this,'_instance',{
        configurable: false
        ,writable: false
        ,value: instance
    })
    this.inflight = undefined
    return instance
}

CacheableResolver.prototype.resolve = function(context,deps){
    var Promise = context.Promise
        ,activator = context.activator
        ,deps = context.deps
        ,model = context.model
        ;
    if(this._instance) {
        return this._instance
    }
    if(this.inflight) {
        //subsequent requests will chain onto the currently inflight promise
        return this.inflight
    }
    this.inflight = Promise.resolve(activator.activate(model,deps))
        .then(this.store.bind(this))
    return this.inflight
}
