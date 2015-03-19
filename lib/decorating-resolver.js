'use strict';

module.exports = DecoratingResolver

function DecoratingResolver(targetModel, decoratorModels, kernel) {
    if(!targetModel){
        throw new Error('targetModel is required')
    }
    this.targetModel = targetModel
    this.innerResolver = targetModel.resolver()
    this.decoratorModels = (decoratorModels || [])
    this.kernel = kernel
}
DecoratingResolver.prototype.resolve = function(context, deps){
    var Promise = context.Promise
    var promise = Promise.resolve(this.innerResolver.resolve(context,deps))
    return promise
    .bind(this)
    .then(function(prev){
        return Promise.resolve(this.decoratorModels)
        .bind(this)
        .reduce(function(prev, decorator){
            var decoratorDeps = (deps || {})
            decoratorDeps['@impl'] = prev
            return this.kernel.resolve(decorator.key,decoratorDeps)
        }, prev)
    })
}

