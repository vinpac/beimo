const path = require('path')
const gulp = require('gulp')
const babel = require('gulp-babel')
const copy = require('gulp-copy')
const fs = require('fs')

const babelConfig = JSON.parse(fs.readFileSync(path.resolve('.babelrc'), 'utf8'))

const sourceDirs = [
  'build/**/*.js',
  'server/**/*.js',
  'defaults/**/*.js',
  'client/**/*.js',
  'scripts/**/*.js',
  'modules/**/*.js',
]

gulp.task('compile-js', () =>
  gulp
    .src(sourceDirs, { base: './' })
    .pipe(babel(babelConfig))
    .pipe(gulp.dest('./dist')),
)

gulp.task('copy', () => gulp.src(sourceDirs.map(x => `${x}on`)).pipe(copy('dist')))

gulp.task('transpile', ['compile-js', 'copy'])
gulp.task('transpile:watch', () => gulp.watch(sourceDirs, ['transpile']))
