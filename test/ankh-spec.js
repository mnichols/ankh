'use strict';

describe('Ankh',function(){
    var Ankh = require('..')

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


    DFactory.inject = ['@impl']
    function DFactory(impl) {
        return {
            b: 'DFactoryPre -> ' + impl.b + ' -> DFactoryPost'
        }

    }
    EFactory.inject = ['@impl']
    function EFactory(impl) {
        return {
            b: 'EFactoryPre -> ' + impl.b + ' -> EFactoryPost'
        }

    }
    FFactory.inject = ['@impl']
    function FFactory(impl) {
        return {
            b: 'FFactoryPre -> ' + impl.b + ' -> FFactoryPost'
        }

    }

    DynamoFactory.inject = ['dynamicParam']
    function DynamoFactory(dynamic){
        return {
            dynamic: dynamic
        }
    }

    var sut
    describe('when resolving a value',function(){
        var val
        beforeEach(function(){
            sut = Ankh.create()
        })
        beforeEach(function(){
            sut.value('val',val ={ dont: 'change'})
        })
        it('should resolve a copy of that value',function(){
            return sut.resolve('val')
                .then(function(it){
                    it.dont.should.equal('change')
                    it.dont = 'ever change'
                    val.dont.should.equal('change')
                })

        })
    })
    describe('when resolving a simple factory',function(){
        beforeEach(function(){
            sut = Ankh.create()
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
            sut = Ankh.create()
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
    describe('when resolving an instance',function(){
        var instance
        beforeEach(function(){
            sut  = Ankh.create()
        })
        beforeEach(function(){
            instance = { foo: 'bar'}
            sut.instance('foo',instance)
        })
        beforeEach(function(){
            instance.foo = 'baz'
        })
        it('should return that instance',function(){
            return sut.resolve('foo')
                .should.eventually.have.property('foo','baz')
        })
    })
    describe('when starting with container having startables',function(){
        beforeEach(function(){
            sut = Ankh.create()
        })
        beforeEach(function(){
            function GFactory(){

                return {
                    started: false
                    ,startemUp: function(){
                        this.started = true
                    }
                }
            }

            GFactory.startable = 'startemUp'

            sut.factory('g',GFactory,{ lifestyle: 'singleton'})
            sut.factory('a',AFactory, { lifestyle: 'singleton'})
        })
        beforeEach(function(){
            return sut.start()
        })

        it('should invoke its startable function',function(){
            return sut.resolve('g')
                .should.eventually
                .have.property('started',true)
        })

    })
    describe('when resolving an initializable component',function(){
        beforeEach(function(){
            sut = Ankh.create()
        })
        beforeEach(function(){
            function Greeter(){

            }
            function sayHello(lang){
                this.greeting = lang.hello
            }

            sayHello.inject = ['lang']
            Greeter.prototype.sayHello = sayHello

            Greeter.initializable = 'sayHello'
            sut.ctor('greeter',Greeter)
            sut.value('lang',{
                hello: 'hola'
            })
        })

        it('should invoke its initializing function',function(){
            return sut.resolve('greeter')
                .should.eventually
                .have.property('greeting','hola')
        })

    })
    describe('when resolving a factory with dynamic deps',function(){
        beforeEach(function(){
            sut = Ankh.create()
        })
        beforeEach(function(){
            sut.factory('dynamo',DynamoFactory)
        })
        it('should return instance with deps',function(){
            return sut.resolve('dynamo',{
                dynamicParam: 'foo'
            }).then(function(instance){
                return instance.dynamic.should.equal('foo')
            })
        })

    })
    describe('when using custom activator having deps',function(){
        beforeEach(function(){
            sut = Ankh.create()
        })
        beforeEach(function(){
            sut.value('bypass','BYPASSED')
            function CustomActivator(bypass){
                this.inner = bypass
            }
            CustomActivator.prototype.activate = function(){
                return 'I activate using factory named ' + this.inner
            }
            CustomActivator.inject = ['bypass']
            sut.kernel.addActivator('customActivator',CustomActivator)

            sut.ctor('cust',function CustComponent(){
                throw new Error('should not have been created!')
            },{ activator: 'customActivator'})
        })
        it('should activate using those deps',function(){
            return sut.resolve('cust').should.eventually
                .equal('I activate using factory named BYPASSED')
        })
    })
    describe('when using custom resolver having deps',function(){
        beforeEach(function(){
            sut = Ankh.create()
        })
        beforeEach(function(){
            sut.value('bypass','BYPASSED')
            function CustomResolver(bypass){
                this.inner = bypass
            }
            CustomResolver.prototype.resolve = function(){
                return 'I resolve using factory named ' + this.inner
            }
            CustomResolver.inject = ['bypass']
            sut.kernel.addResolver('customResolver',CustomResolver)

            sut.ctor('cust',function CustComponent(){
                throw new Error('should not have been created!')
            },{ resolver: 'customResolver'})
        })
        it('should resolve those deps',function(){
            return sut.resolve('cust').should.eventually
                .equal('I resolve using factory named BYPASSED')
        })
    })
    describe('when decorating a factory',function(){
        var decorators
        beforeEach(function(){
            sut = Ankh.create()
        })
        describe('given simple decoration',function(){
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
        describe('given deep decoration',function(){
            beforeEach(function(){
                sut.factory('a',AFactory)
                sut.factory('b',BFactory)
                sut.factory('d',DFactory)
                sut.factory('e',EFactory)
                sut.factory('f',FFactory)
                sut.decorate('b','f')
                sut.decorate('b','e')
                sut.decorate('b','d')
            })
            it('should return decorated instance',function(){
                return sut.resolve('b')
                    .then(function(instance){
                        return instance.b.should.equal('DFactoryPre -> ' +
                                                       'EFactoryPre -> ' +
                                                       'FFactoryPre -> ' +
                                                       'BFactory received a factory -> ' +
                                                       'FFactoryPost -> ' +
                                                       'EFactoryPost -> ' +
                                                       'DFactoryPost')
                    })
            })

        })
    })


})