var gulp = require('gulp')
    , $ = require('gulp-load-plugins')()
    , browserify = require('browserify')
    , sourcemaps = require('gulp-sourcemaps')
    , source = require('vinyl-source-stream')
    , buffer= require('vinyl-buffer')
    , fs = require('fs')
    , glob = require('glob')
    , path = require('path')
    , url = require('url')
    , util = require('util')
    , mkdirp = require('mkdirp')
    , uglify = require('gulp-uglify')
    ;


gulp.task('default',['build'])
gulp.task('build',[],function(){
    var b = browserify({
        entries: ['./lib']
        , debug: true
        , standalone: 'ankh'
    })
    return b.bundle()
        .pipe(source('ankh.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build'))
})
gulp.task('dist',[],function(){
    var b = new browserify({
        entries: ['./lib']
        , standalone: 'ankh'
    })
    b.transform({global: true},'uglifyify')
    return b.bundle()
        .pipe(source('ankh.min.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build'))
})


gulp.task('test',[],function(){
    var specFiles = './test/*-spec.js'
    var tests = glob.sync(specFiles)
    tests.unshift('./test/spec-support.js')
    var b = browserify({
        entries: tests
    })
    return b.bundle({ debug: true })
        .pipe(source('specs.js'))
        .pipe(gulp.dest('./build'))

})

// Helper method to kill the gulp task on error
gulp.fail = function(err) {
    console.log(err)
    process.exit(1)
}
