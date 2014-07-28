'use strict';

module.exports = function dynamicNew(Constructor, args) {
    var result = Object.create(Constructor.prototype)
    if(!result) {
        throw new Error('Could not dynamically new ' + toString.call(Constructor))
    }
    Constructor.apply(result,args || [])
    return result


}
