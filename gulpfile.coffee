browserSync  = require('browser-sync')
watchify     = require('watchify')
browserify   = require('browserify')
source       = require('vinyl-source-stream')
buffer       = require('vinyl-buffer')
gulp         = require('gulp')
preprocess   = require("gulp-preprocess")
gutil        = require('gulp-util')
gulpSequence = require('gulp-sequence')
sass         = require('gulp-sass')
autoprefixer = require('gulp-autoprefixer')
watch        = require('gulp-watch')
uglify       = require('gulp-uglify')
streamify    = require('gulp-streamify')
sourcemaps   = require('gulp-sourcemaps')
concat       = require('gulp-concat')
coffee       = require('gulp-coffee')

prod = gutil.env.NODE_NV is "production"

onError = (err) ->
  console.log err.message
  @emit 'end'

gulp.task 'bundle-vendor', ->
  browserify('./src/coffee/vendor',
    transform: ['coffeeify']
    extensions: ['.coffee']
    cache: {}
    packageCache: {}
    fullPaths: true
  )
  .bundle().on 'error', onError
  .pipe source("vendor.coffee")
  .pipe buffer()
  .pipe concat("vendor.js")
  .pipe gulp.dest('./public/js')

gulp.task 'bundle-app', ->
  gulp.src './src/coffee/app.coffee'
  .pipe coffee({bare: true}).on('error', onError)
  .pipe preprocess()
  .pipe buffer()
  .pipe gulp.dest('./public/js')
  .pipe browserSync.stream()

gulp.task 'js', ['bundle-vendor', 'bundle-app']

gulp.task 'sass', () ->
  gulp.src './src/scss/public.scss'
  .pipe sass()
  .on 'error', onError
  .pipe gulp.dest('./public/css')
  .pipe browserSync.stream()

gulp.task 'serve', () ->
  browserSync.init
    server:
      baseDir: './public'
    port: 3003
  gulp.watch './src/scss/**/*.scss', ['sass']
  gulp.watch './src/coffee/app.coffee', ['bundle-app']

gulp.task('default', gulpSequence(['sass', 'js'], 'serve'))