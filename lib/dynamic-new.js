'use strict';

/**
 * Simulates calling `new MyConstructor` with dynamic args
 * @module dynamicNew
 * @param {Function} Constructor The prototype you wish to instantiate
 * @param {Any} args The arguments to `new` up the instance with
 * @return {Object} new instance of `Constructor`
 * */
module.exports = function dynamicNew(Constructor, args) {
    var result = Object.create(Constructor.prototype)
    if(!result) {
        throw new Error('Could not dynamically new ' + toString.call(Constructor))
    }
    Constructor.apply(result,args || [])
    return result
}
