let gulp = require("gulp"),
  sass = require("gulp-sass"),
  browserSyns = require("browser-sync"),
  uglify = require("gulp-uglify"),
  concat = require("gulp-concat"),
  pug = require("gulp-pug"),
  imageMin = require("gulp-imagemin"),
  spritesmith = require("gulp.spritesmith"),
  merge = require("merge-stream"),
  ttf2woff2 = require("gulp-ttf2woff2"),
  svgSprite = require("gulp-svg-sprites"),
  filter = require("filter"),
  babel = require("gulp-babel");

let dirDist = "./dist/";
let dirApp = "./app/";
let _ = {
  dist: {
    images: dirDist + "images",
    fonts: dirDist + "fonts",
    js: dirDist + "js",
    css: dirDist + "css",
    out: "../../"
  },
  fonts: {
    dir: dirApp + "static/fonts/",
    select: "*.ttf"
  },
  minImg: {
    dir: dirApp + "static/images/",
    select: "*.*"
  },
  sprite: {
    png: {
      dir: dirApp + "static/images/pngSprite/",
      select: "*.png"
    },
    svg: {
      dir: dirApp + "static/images/svgSprite/",
      select: "*.svg"
    }
  },
  pug: {
    dir: dirApp + "templates/",
    select: {
      pages: "pages/*.pug",
      all: "**/*.pug"
    }
  },
  style: {
    base: dirApp + "scss/base/",
    dir: dirApp + "scss/",
    select: {
      conv: "*.scss",
      all: "**/*.scss"
    }
  },
  js: {
    libs: [
      "node_modules/jquery/src/jquery.js",
      "node_modules/fancybox/dist/js/jquery.fancybox.js",
      "node_modules/swiper/js/swiper.js"
    ],
    select: "*.js",
    dir: dirApp + "scripts/"
  }
};

gulp.task("scss", function() {
  return gulp
    .src(_.style.dir + _.style.select.conv)
    .pipe(sass({ outputStyle: "compressed" }))
    .pipe(gulp.dest(_.dist.css))
    .pipe(browserSyns.reload({ stream: true }));
});

gulp.task("libs-js", function() {
  return gulp
    .src(_.js.libs)
    .pipe(concat("libs.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest(_.dist.js))
    .pipe(browserSyns.reload({ stream: true }));
});

gulp.task("js", function() {
  return gulp
    .src(_.js.dir + _.js.select)
    .pipe(
      babel({
        presets: ["@babel/env"]
      })
    )
    .pipe(gulp.dest(_.dist.js))
    .pipe(browserSyns.reload({ stream: true }));
});

gulp.task("images", function() {
  return gulp
    .src(_.minImg.dir + _.minImg.select)
    .pipe(imageMin())
    .pipe(gulp.dest(_.dist.images))
    .pipe(browserSyns.reload({ stream: true }));
});

gulp.task("ttf2woff2", function() {
  return gulp
    .src(_.fonts.dir + _.fonts.select)
    .pipe(ttf2woff2())
    .pipe(gulp.dest(_.dist.fonts));
});

gulp.task("pngSprite", function() {
  var spriteData = gulp
    .src(_.sprite.png.dir + _.sprite.png.select) // путь, откуда берем картинки для спрайта
    .pipe(
      spritesmith({
        imgName: "sprite.png",
        cssName: "pngSprite.scss",
        cssFormat: "scss",
        algorithm: "binary-tree",
        cssVarMap: function(sprite) {
          sprite.name = "icon-" + sprite.name;
        }
      })
    );
  var cssStream = spriteData.css.pipe(gulp.dest(_.style.base)); // путь, куда сохраняем стили
  var imgStream = spriteData.img.pipe(gulp.dest(_.dist.images)); // путь, куда сохраняем картинку

  return merge(imgStream, cssStream);
});

gulp.task("svgSprite", function() {
  return gulp
    .src(_.sprite.svg.dir + _.sprite.svg.select)
    .pipe(
      svgSprite({
        selector: "svg-%f",
        cssFile: _.dist.out + _.style.base + "svgSprite.scss",
        svg: {
          sprite: "sprite.svg"
        },
        preview: false
      })
    )
    .pipe(gulp.dest(_.dist.images));
});

gulp.task("pug", function buildHTML() {
  return gulp
    .src(_.pug.dir + _.pug.select.pages)
    .pipe(
      pug({
        pretty: true
      })
    )
    .pipe(gulp.dest(dirDist))
    .pipe(browserSyns.reload({ stream: true }));
});

gulp.task("watch", function() {
  //Стили и скрипты
  gulp.watch(_.style.dir + _.style.select.all, gulp.parallel("scss"));
  gulp.watch(_.js.dir + _.js.select, gulp.parallel("js"));

  //Сборка страниц из шаблонов
  gulp.watch(_.pug.dir + _.pug.select.all, gulp.parallel("pug"));

  //Сжатие картинок
  gulp.watch(_.minImg.dir + _.minImg.select, gulp.parallel("images"));

  //спрайты
  gulp.watch(
    _.sprite.png.dir + _.sprite.png.select,
    gulp.parallel("pngSprite")
  );
  gulp.watch(
    _.sprite.svg.dir + _.sprite.svg.select,
    gulp.parallel("svgSprite")
  );

  //конвертация
  gulp.watch(_.fonts.dir + _.fonts.select, gulp.parallel("ttf2woff2"));
});

gulp.task("browser-sync", function() {
  browserSyns.init({
    server: {
      baseDir: dirDist
    }
  });
});

gulp.task(
  "default",
  gulp.parallel(
    "scss",
    "libs-js",
    "js",
    "pug",
    "images",
    "pngSprite",
    "svgSprite",
    "browser-sync",
    "watch"
  )
);
