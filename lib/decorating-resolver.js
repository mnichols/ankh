'use strict';

module.exports = DecoratingResolver

function DecoratingResolver(targetModel, decoratorModels) {
    if(!targetModel){
        throw new Error('targetModel is required')
    }
    this.targetModel = targetModel
    this.innerResolver = targetModel.resolver()
    this.decoratorModels = (decoratorModels || [])
    this.resolve= this.resolve.bind(this)
}
DecoratingResolver.prototype.resolve = function(context, deps){
    var Promise = context.Promise
    var promise = Promise.resolve(this.innerResolver.resolve(context,deps))
    this.decoratorModels.forEach(function(decorator){
        var decorationContext = {
            model: decorator
            ,activator: decorator.activator()
            ,resolver: decorator.resolver()
            ,Promise: context.Promise
            ,impl: context.impl
        }
        promise = promise.then(function(prev){
            return decorator.resolver().resolve(decorationContext,{
                impl: prev
            })
        })
    },this)
    return promise
}

