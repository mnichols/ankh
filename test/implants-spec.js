'use strict';

describe('Implants',function(){
    var Implants = require('..')

    function AFactory() {
        return {
            a: 'factory'
        }
    }

    BFactory.inject = ['a']
    function BFactory(a) {
        return {
            b: 'BFactory received a ' + a.a
        }
    }


    DFactory.inject = ['impl']
    function DFactory(impl) {
        return {
            b: 'DFactoryPre -> ' + impl.b + ' -> DFactoryPost'
        }

    }

    var sut
    describe('when resolving a simple factory',function(){
        beforeEach(function(){
            sut = Implants.create()
        })
        describe('given singleton',function(){
            beforeEach(function(){
                sut.factory('singleton',AFactory,{
                    lifestyle: 'singleton'
                })
            })
            beforeEach(function(){
                return sut.resolve('singleton')
                    .then(function(instance){
                        instance.a.should.equal('factory')
                        instance.ME = true
                    })
            })
            it('should return same instance',function(){
                return sut.resolve('singleton')
                    .then(function(instance){
                        instance.ME.should.be.true
                        instance.a.should.equal('factory')
                    })
            })

        })
        describe('given transient',function(){
            beforeEach(function(){
                sut.factory('transient',AFactory,{
                    lifestyle: 'transient'
                })
            })
            beforeEach(function(){
                return sut.resolve('transient')
                    .then(function(instance){
                        instance.a.should.equal('factory')
                        instance.ME = true
                    })
            })
            it('should return distinct instance',function(){
                return sut.resolve('transient')
                    .then(function(instance){
                        expect(instance.ME).not.to.exist
                        instance.a.should.equal('factory')
                    })
            })

        })
    })
    describe('when resolving a factory with deps',function(){
        beforeEach(function(){
            sut = Implants.create()
        })
        beforeEach(function(){
            sut.factory('a',AFactory)
            sut.factory('b',BFactory)
        })
        it('should return instance with deps',function(){
            return sut.resolve('b')
                .then(function(instance){
                    return instance.b.should.equal('BFactory received a factory')
                })
        })

    })
    describe('when decorating a factory',function(){
        var decorators
        beforeEach(function(){
            sut = Implants.create()
        })
        beforeEach(function(){
            sut.factory('a',AFactory)
            sut.factory('b',BFactory)
            sut.factory('d',DFactory)
            sut.decorate('b','d')
        })
        it('should return decorated instance',function(){
            return sut.resolve('b')
                .then(function(instance){
                    return instance.b.should.equal('DFactoryPre -> BFactory received a factory -> DFactoryPost')
                })
        })
    })


})
