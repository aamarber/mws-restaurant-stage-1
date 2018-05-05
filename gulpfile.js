/*eslint-env node */

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var eslint = require('gulp-eslint');
// var jasmine = require('gulp-jasmine-phantom');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
const babel = require('gulp-babel');

gulp.task('default', ['copy-html', 'copy-images', 'scripts', 'styles'], function () {
	// gulp.watch('sass/**/*.scss', ['styles']);
	gulp.watch('js/**/*.js', ['scripts']);
	gulp.watch('./*.html', ['copy-html']);
	gulp.watch('./dist/index.html').on('change', browserSync.reload);

	browserSync.init({
		server: './dist'
	});
});

gulp.task('dist', [
	'copy-html',
	'copy-images',
	'styles',
	'lint',
	'scripts-dist'
]);

gulp.task('scripts', function () {
	gulp.src(['js/*.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(concat('all.js'))
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/list/*.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(concat('list.js'))
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/detail/*.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(concat('detail.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', function () {
	gulp.src(['js/*.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(concat('all.js'))
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/list/*.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(concat('list.js'))
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/detail/*.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(concat('detail.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('copy-html', function () {
	gulp.src('./*.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function () {
	gulp.src('img/*')
		.pipe(gulp.dest('dist/img'));
});

gulp.task('styles', function () {
	gulp.src('styles/**/*.scss')
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.stream());
});

// gulp.task('lint', function () {
// 	return gulp.src(['js/**/*.js'])
// 		// eslint() attaches the lint output to the eslint property
// 		// of the file object so it can be used by other modules.
// 		.pipe(eslint())
// 		// eslint.format() outputs the lint results to the console.
// 		// Alternatively use eslint.formatEach() (see Docs).
// 		.pipe(eslint.format())
// 		// To have the process exit with an error code (1) on
// 		// lint error, return the stream and pipe to failOnError last.
// 		.pipe(eslint.failOnError());
// });

// gulp.task('tests', function () {
// 	gulp.src('tests/spec/extraSpec.js')
// 		.pipe(jasmine({
// 			integration: true,
// 			vendor: 'js/**/*.js'
// 		}));
// });