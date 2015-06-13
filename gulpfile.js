var gulp = require('gulp'),
    debug = require('gulp-debug'),
    plumber = require('gulp-plumber'),
    sass = require('gulp-sass');

gulp.task('sass', function() {
    gulp.src('./public/css/*.{scss,sass}')
        .pipe(debug({ title: 'Building Sass' }))
        .pipe(plumber())
        .pipe(sass())
        .pipe(debug({ title: 'Deploying CSS' }))
        .pipe(gulp.dest('./public/css/'));
});

gulp.task('default', [
    'sass'
]);