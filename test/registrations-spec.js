'use strict';

describe('Registrations',function(){
    var Registrations = require('../lib/registrations')
        ,ComponentModel = require('../lib/component-model')
    describe('when detecting circular dependencies',function(){
        var sut
            ,mod
        beforeEach(function(){
            sut = new Registrations()
        })
        it('should reject simple circular dep',function(){
            function Foo(){}
            function Bar(){}
            sut.put(new ComponentModel('bar',Bar))
            sut.put(new ComponentModel('foo',Foo))

            sut.validate('foo')
                .should.be.rejectedWith(/Cyclic dependency: "bar"/)
        })
        it('should disregard decorator `impl` dependencies',function(){
            function Foo(){}
            function Bar(){}
            function Dec(){}
            Foo.inject = ['bar']
            Bar.inject = []
            Dec.inject = ['impl']

            sut.put(new ComponentModel('foo',Foo))
            sut.put(new ComponentModel('bar',Bar))
            sut.put(new ComponentModel('dec',Dec))
            return sut.validate('foo')
                .should.be.ok
        })
        it('should reject complex circular dep for all registrations',function(){
            function Foo(){}
            function Bar(){}
            function Ron(){}
            function John(){}
            function Tom(){}
            Foo.inject = ['bar']
            Bar.inject = ['ron']
            John.inject = ['bar']
            Tom.inject = ['john']
            Ron.inject = ['tom']

            sut.put(new ComponentModel('foo',Foo))
            sut.put(new ComponentModel('bar',Bar))
            sut.put(new ComponentModel('ron',Ron))
            sut.put(new ComponentModel('john',John))
            sut.put(new ComponentModel('tom',Tom))

            return sut.validate()
                .should.be.rejectedWith(/Cyclic dependency: "john"/)
        })
        it('should resolve acyclic deps',function(){
            function Foo(){}
            function Bar(){}
            Foo.inject = ['bar']
            Bar.inject = ['mee']

            sut.put(new ComponentModel('foo',Foo))
            sut.put(new ComponentModel('bar',Bar))
            sut.put(new ComponentModel('mee','mike'))

            return sut.validate('foo')
                .should.eventually.eql(['mee','bar','foo'])

        })
    })

})
