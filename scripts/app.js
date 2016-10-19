
/* const */
var DEBUG_MODE = false;
// var TAS_MODE = false;
// var STEALTH_MODE = false;

var SENSIBILITY = 1.4;
var JUDGE_FREQUENCY = 30;
var ROTATION_UNIT = 4;
var FPS = 60;
var SCREEN_WIDTH = 760;
var SCREEN_HEIGHT = 600;
var MAX_SCORE = 1000;
var DISTANCE_BORDER = 300;
var BUTTON_WIDTH = SCREEN_WIDTH * 0.35;
var BB_BLUE = "#0000fd";
var MAX_JUDGE_COUNT = 40;
// var RATINGS = [
//   'perfect',
//   'cool',
//   'good',
//   'baby',
// ];

// アセット
var ASSET_PATH = "./assets/";
var ASSETS = {
  image: {
    usamin: ASSET_PATH+'images/usamin.png',
    usamin_blank: ASSET_PATH+'images/usamin_blank.png',
    shugaha: ASSET_PATH+'images/shugaha.png',
    shugaha_blank: ASSET_PATH+'images/shugaha_blank.png',
    // splashImage: ASSET_PATH+'images/splash-image.png',
  },
  sound: {
    bgm: ASSET_PATH+'sounds/bgm-loop.mp3',
    yell: ASSET_PATH+'sounds/yell-fast.mp3',
    ahu: ASSET_PATH+'sounds/ahu.mp3',
  },
  json: {
    usamin_motion: './data/usamin-motion.json',
    shugaha_motion: './data/shugaha-motion.json',
  },
  font: {
    FontAwesome: ASSET_PATH+'fonts/fontawesome-webfont.woff'
  },
  video: {
    bgVideo: ASSET_PATH+"videos/bemybaby-original.mp4"
  }
};
// var VIDEO_SRC = ASSET_PATH+"videos/bemybaby-original.mp4";
var SPLASH_IMAGE_SRC = ASSET_PATH+'images/splash-image.png';

WebFont.load({
  google: {
    families: ['Skranji']
  },
  active: init

});

function init() {

  var app = MyGameApp({
    assets: ASSETS,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    startLabel: 'splash',
    // startLabel: 'debug',
    fps: FPS,
  });

  app.run();
}

phina.define('MyGameApp', {
  superClass: 'phina.display.CanvasApp',

  init: function(options) {
    this.superInit(options);

    var startLabel = options.startLabel || 'splash';

    var scenes = [
      {
        className: 'SplashScene',
        label: 'splash',
        nextLabel: 'loading',
      },
      {
        className: 'MyLoadingScene',
        label: 'loading',
        nextLabel: 'title',
      },
      {
        className: 'TitleScene',
        label: 'title',
        nextLabel: 'main',
      },
      {
        className: 'MainScene',
        label: 'main',
        nextLabel: 'result',
      },
      {
        className: 'ResultScene',
        label: 'result',
        nextLabel: 'title',
      },
      {
        className: 'DebugScene',
        label: 'debug',
        nextLabel: 'title',
        // arguments: {},
      },
    ];

    // 引数としてそれぞれoptionsを渡す
    scenes = scenes.each(function(s) {
      s.arguments = s.arguments || options;
    });

    // 最初のシーンをセット
    var scene = phina.game.ManagerScene({
      startLabel: startLabel,
      scenes: scenes,
    });

    this.replaceScene(scene);
  },
});