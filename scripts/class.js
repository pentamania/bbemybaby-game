'use strict';
phina.globalize();

/**
 * 矩形型選択カーソル
 */
phina.define('RectCursor', {
  superClass: 'phina.display.RectangleShape',

  init: function(size, options) {
    options = {
      width: size,
      height: size,
      // fill: 'transparent',
      fill: 'hsla(120, 50%, 50%, 0.2)',
      stroke: '#aaa',
      strokeWidth: 4,
    }.$extend(options);

    this.superInit(options);
  },

  move: function(position) {
    this.tweener.clear()
      .to({x: position.x, y:position.y}, 500, "easeOutElastic");
    return this;
  },
});

/**
* はねるように出現して消えるラベル
* 得点演出とかに使う
*
*/
phina.define('HoppingLabel', {
  superClass: 'phina.display.Label',

  init: function(options) {
  // init: function(text, color, stroke, callback) {
    var self = this;

    var defaultCallback = function() {self.remove();};
    var _callback = (options.callback) ? options.callback : defaultCallback;
    var hoppingHeight = options.hoppingHeight || 20;

    this.superInit(options);

    this.tweener.by({
      y: -hoppingHeight,
    }, 100)
    .by({
      y: hoppingHeight,
    }, 200, 'easeOutElastic')
    .wait(300)
    .to({
      alpha: 0
    }, 400, "easeOutQuad")
    .call(_callback)
  },

});

/**
*
*/
phina.define('Player', {
  superClass: 'ProgrammableSprite',

  init: function(image, motionData) {
    this.superInit(image);
    // if (motionData) this.setScaleTweener(motionData);
    if (motionData) this.setScaleMove(motionData);
  },

  rotate: function(ccw) {
    var unit = ROTATION_UNIT;
    if (ccw) unit *= -1;
    this.rotation = (this.rotation + unit)%360;
  },

  // scaleのアニメーションのみセット
  setScaleMove: function(motionData) {
    var newMotionData = [];
    motionData.forEach(function(data) {
      var modifiedMove = {};
      var props = {}.$extend(data.props);
      Object.keys(props).forEach(function(key){
        if (key !== "scaleX" && key !== "scaleY") {
          delete props[key];
        }
      });

      modifiedMove.duration = data.duration;
      modifiedMove.props = props;

      newMotionData.push(modifiedMove);
    }.bind(this));

    // console.log(newMotionData);
    this.setMotionSequence(newMotionData);

  },

  // scaleのアニメーションのみ実行するtweener
  setScaleTweener: function(motionData) {
    motionData.forEach(function(data){
      var props = {}.$extend(data.props);
      Object.keys(props).forEach(function(key){
        if (key !== "scaleX" && key !== "scaleY") {
          delete props[key];
        }
      });

      // console.log(props)
      this.tweener.to(props, data.duration);
    }.bind(this));

    return this;
  }

});

/**
 *  動きのシーケンスが設定可能なSpriteクラス
 */
phina.define('ProgrammableSprite', {
  superClass: 'phina.display.Sprite',

  isActive: false,

  init: function(image, motionData) {
    this.superInit(image);
    this.tweener.pause();
    this.sequences = [];
    // if (motionData) this.setMotionSequence(motionData);
  },

  update: function(app) {
  },

  // tweenerを利用したシーケンスのセット (フレームレートベースで動く、一回動作したら細かい制御は不可能)
  setTweenerSequence: function(motionData, origin) {
    // var origin = origin || {x:0, y:0};
    motionData.forEach(function(data){

      var props = {}.$extend(data.props); //copy
      if (origin) {
        props.x += origin.x;
        props.y += origin.y;
        // props.x = data.x + origin.x;
        // props.y = data.y + origin.y;
      }
      this.tweener.to(props, data.duration);
      // this.tweener.to(props, (data.frameLength)*33.3333);
    }.bind(this));

    // 動きが終了したらイベント発火
    this.tweener.call(function(){
      this.flare('motionend');
    }.bind(this));

    // 停止
    this.tweener.stop();

    return this;
  },

  /**
   * [モーションデータから動作の順番をセット]
   * @param {[Object]} motionData [description:TODO]
   * @param {[Object]} origin     [動作のxy原点を指定]
   */
  setMotionSequence: function(motionData, origin) {
    var elapsedTime = 0;
    motionData.forEach(function(data){
      var move = {};
      var props = {}.$extend(data.props); //copy
      if (origin) {
        props.x += origin.x;
        props.y += origin.y;
      }
      move.props = props;

      elapsedTime += data.duration;
      move.time = elapsedTime;

      this.sequences.push(move);
    }.bind(this));

    return this;
  },

  /**
   * [指定した絶対時間に応じて動く]
   * @param  {[Number]} currentTime [unit:ms]
   * @return {[type]}             [description]
   */
  updateMove: function(currentTime) {
    if (!this.isActive) return;

    var self = this;
    var seq = this.sequences;
    var target, previous;
    var timeRatio;
    var startTime = 0;

    // ターゲットとなるプロパティをcurrentTimeから設定
    // FIXME: ターゲットが最後の場合、余計な走査をしてしまう...
    // sequencesはソートされているので二分探索する？
    seq.some(function(prop, i){
      // if (prop.time < currentTime) {
      if (currentTime < prop.time) {
        target = prop;
        if (i !== 0) {
          previous = seq[i-1];
          startTime = seq[i-1].time;
        } else {
          // 最初の位置
          // previous = {props:{}.$extend(self)} //重いのでやめる
          previous = {props:self};
        }
        return true;
      }
    });

    // ターゲットが無い場合、終点
    if (!target) return;

    // 現在位置から動かす（非破壊でやること）
    timeRatio = (currentTime - startTime)/(target.time - startTime);
    if (timeRatio > 1) timeRatio = 1; //不要？
    target.props.forIn(function(key, targetValue) {
      var delta = targetValue - previous.props[key];

      // プロパティ更新
      self[key] = previous.props[key] + delta*timeRatio;
    });
  },

  play: function(){
    if (!this.isActive) this.isActive = true;
    this.tweener.play();
  }
});

phina.namespace(function() {

  /**
   * @class phina.asset.Video
   *
   */
  phina.define('phina.asset.Video', {
    superClass: "phina.asset.Asset",

    /**
     * @constructor
     */
    init: function() {
      this.superInit();
    },

    _load: function(resolve) {

      var self = this;
      var v = this.domElement = document.createElement('video');
      v.setAttribute('preload', "none");
      v.setAttribute('controls', true); //不要？
      v.oncanplay = function() {
        self.loaded = true;
        resolve(self);
      };
      v.src = this.src;
      v.load();

    },

  });

});

/**
 * [init description]
 * @class phina.display.VideoSprite
 * @param  {[String, HtmlElement]} video    [description]
 * @param  {[Object]} options) [description]
 * @return {[type]}          [description]
 */
phina.define('phina.display.VideoSprite', {
  superClass: 'phina.display.Sprite',

  init: function(video, options) {
    if (typeof video === 'string') {
      var _video = phina.asset.AssetManager.get('video', video);
      video = this.video = _video.domElement;
    } else {
      this.video = video; //TODO: アクセサにする？
    }

    var options = {}.$safe(options, phina.display.VideoSprite.defaults);
    video.loop = options.loop;
    video.volume = options.volume; //iosでは音量のコントロールは不可

    var _image = phina.graphics.Canvas();
    _image.setSize(video.videoWidth, video.videoHeight);
    this.superInit(_image);

    // image(内部canvas)とvideoの内容を常に同期する
    // 音の同期はずれることも・・・
    this.on('enterframe', function() {
      this.image.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    });

    video.onended = function(){
      this.flare('ended');
    }.bind(this)
  },

  play: function() {
    // if (!this.video.played) this.video.play();
    // console.log(!this.video.played);
    this.video.play();
    return this;
  },

  pause: function() {
    this.video.pause();
    return this;
  },

  _accessor: {
    currentTime: {
      get: function()  { return this.video.currentTime; },
      set: function(v) {
        // console.log('change')
        this.video.currentTime = v;
      },
    },
    paused: {
      get: function()  { return this.video.paused; },
    },
    duration: {
      get: function()  { return this.video.duration; },
    },
    volume: {
      get: function()  { return this.video.volume; },
      set: function(v)  { this.video.volume = v; },
    },
    muted: {
      get: function()  { return this.video.muted; },
      set: function(v)  { this.video.muted = v; },
    },
  },

  _static: {
    defaults: {
      loop: false,
      volume: 0.5,
    },
  },
});

/**
* Font Awsomeなどのアイコンフォントを使ったボタン
*
* @param String(unicode), Number(decimal/hex) or Object:
* ###caveat
*  - cdn利用の場合、webfont loaderなどで事前ロードしないと豆腐化する（Ref: https://ics.media/entry/8385）
*  - link要素によってcssを読み込んだ場合、HTML内でどこかに一度表示(透明でもOK)しないと豆腐化する
*    ex: <i class="fa fa-html5" style="opacity: 0"></i>
*  - assetLoaderでfontデータ(fontawsome-webfont.woff等)を直接ロードしている場合は問題なし
*/
phina.define('phina.ui.IconFontButton', {
  superClass: 'phina.ui.Button',

  init: function(options) {
    if (typeof arguments[0] !== 'object') {
      options = { text: arguments[0], };
    }
    else {
      options = arguments[0];
    }

    this.unicode = options.text;

    var fontSize = options.fontSize || 60;
    var defaultOptions = {
      // text: unicode,
      width: fontSize * 1.2,
      height: fontSize * 1.2,
      fontSize: fontSize,
      cornerRadius: 5,
      fontFamily: "FontAwesome",
    };

    options = ({}).$safe(options, defaultOptions);
    this.superInit(options);
  },

  _accessor: {
    text: {
      get: function()  { return this._text; },
      set: function(v) {
        var iconInt = (typeof v === 'string') ? parseInt(v, 16) : v;
        this._text = String.fromCharCode(iconInt);
      },
    },
    unicode: {
      get: function()  { return this._unicode; },
      set: function(v) { this._unicode = v; },
    }
  }
});

/**
* @class KeyCaptionButton
* @extends phina.ui.IconFontButton
* かんたんなキャプション付きボタン
* キーボードとタッチ操作を両方扱うボタン用
*/
phina.define('KeyCaptionButton', {
  superClass: 'phina.ui.IconFontButton',

  init: function(iconUnicode, labelStr, options) {
    options.text = iconUnicode;
    this.superInit(options);

    var label = phina.display.Label(options)
    .setPosition(0, -this.height * 0.8)
    .addChildTo(this);
    label.fontSize = options.fontSize * 0.8;
    label.text = labelStr;
  },

});
