
/**
 * @class LoadingScene
 *
 * @param {object} [options] [description]
 */
phina.define('MyLoadingScene', {
  superClass: 'phina.display.DisplayScene',

  init: function(options) {
    this.superInit(options);

    var self = this;

    // ロード
    var loader = phina.asset.AssetLoader();
    loader.on('progress', function(e) {
      console.log(e);
    });
    loader.on('load', function(){
      console.log("loaded");
      self.exit();
    });
    loader.load(options.assets);

    // アニメーション
    this.backgroundColor = BB_BLUE;
    var label = this.label = Label("なうろーでぃんぐ").addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.center())
    ;
    label.alpha = 0;
    label.tweener
      .clear()
      .to({alpha:1}, 700, 'easeOutCubic')
      .to({alpha:0}, 700, 'easeOutCubic')
      .setLoop(true);

  },

  update: function() {
    this.label.rotation += 3;
  },

});

/**
 * SplashScene
 * 最初の制作会社表記的なやつ
 *
 * @param {object} [options]
 */
phina.define('SplashScene', {
  superClass: 'phina.display.DisplayScene',

  init: function(options) {
    this.superInit(options);

    var texture = phina.asset.Texture();
    texture.load(SPLASH_IMAGE_SRC).then(function() {
      this._init();
    }.bind(this));
    this.texture = texture;
  },

  _init: function() {
    this.sprite = phina.display.Sprite(this.texture).addChildTo(this);
    // this.sprite = phina.display.Sprite('splashImage').addChildTo(this);

    this.sprite
    .setPosition(this.gridX.center(), this.gridY.center())
    .setSize(this.width, this.height);
    this.sprite.alpha = 0;

    var label = Label("タップしてスタート").addChildTo(this)
    .setPosition(this.gridX.center(), this.gridY.span(14))
    ;
    label.alpha = 0;
    label.tweener
      .clear()
      .to({alpha:1}, 650, 'easeOutCubic')
      .to({alpha:0}, 650, 'easeOutCubic')
      .setLoop(true);

    label.tweener.stop();

    this.sprite.tweener
      .clear()
      .to({alpha:1}, 500, 'easeOutCubic')
      .wait(1200)
      // .call(function() {
      //   label.tweener.play();
      // })
    ;

    // PCならそのまま遷移、モバイルはサウンド再生制限アンロックのためタップ操作を挟む
    // と思ったけど、結局うまくいかないのでとりあえずモバイルでも自動遷移
    // if (!phina.isMobile()) {
      this.sprite.tweener
        .to({alpha:0}, 500, 'easeOutCubic')
        .wait(250)
        .call(function() {
          this.exit();
        }, this)
      ;
    // }

    // var event = (phina.isMobile()) ? 'touchend' : 'click';
    var event = 'pointend';
    this.addEventListener(event, function(){
      // if (phina.isMobile()) {
        // モバイル音楽制限のアンロック （が、効かない...）
        var actx = new (window.AudioContext || window.webkitAudioContext)();
        var buffer = actx.createBuffer(1, 1, 22050);
        var source = actx.createBufferSource();
        source.buffer = buffer;
        source.connect(actx.destination);
        source.start(0);
        this.exit();
      // }

    });

    // var self = this;
    // var event = (phina.isMobile()) ? 'touchend' : 'click';
    // var _func;
    // this.app.domElement.addEventListener(event, _func = function(){
    //   // unlock moble sound limit
    //   var me = this;
    //   var actx = new (window.AudioContext || window.webkitAudioContext)();
    //   var buffer = actx.createBuffer(1, 1, 22050);
    //   var source = actx.createBufferSource();
    //   source.buffer = buffer;
    //   source.connect(actx.destination);
    //   source.start(0);
    //   // console.log(this)
    //   source.onended = function() {
    //     source.disconnect(0);
    //     self.exit();
    //     // Remove the touch start listener.
    //     me.removeEventListener(event, _func, true);
    //   };
    //   // this.removeEventListener(event, _func)
    // }, true);
  },

});


/**
 * CountdownScene
 * ゲーム開始前のカウントダウン画面、PCのみ
 *
 * @param {object} [options]
 */
phina.define('CountdownScene', {
  superClass: 'phina.game.CountScene',

  init: function(options) {
    var _options = {
      // width: SCREEN_WIDTH,
      // height: SCREEN_HEIGHT,
      fontColor: "#27D0EF",
      fontFamily: 'Skranji',
      count: 2,
      // count: 1,
      backgroundColor: "hsla(200, 0%, 50%, 0.7)",
    }.$extend(options);

    this.superInit(_options);
  },
});

/**
 * タイトル画面
 *
 */
phina.define('TitleScene', {
  superClass: 'DisplayScene',

  init: function(options) {
    var self = this;
    var sprites = [];
    var characters = ['usamin', 'shugaha'];
    var spriteSize = 0;
    var cursor, bgm, charaSelect, hiScoreLabel;

    this.superInit(options);

    this.backgroundColor = BB_BLUE;

    //　セーブデータのロード（初回、プレイヤー選択されていないときのみ）
    var saveData = window.localStorage.getItem("save_data");
    if (!options.player && saveData) {
      console.log('セーブデータロード')
      options = ({}).$extend(options, JSON.parse(saveData));
    }

    // タイトルラベル
    Label({
      text: 'BBEMYBABY \n        the GAME',
      fontSize: 90,
      fontFamily: 'Skranji',
      fill: '#838383',
      stroke: '#464646',
    })
    .setOrigin(0.5, 0)
    .setPosition(this.gridX.center(), this.gridY.span(0))
    .addChildTo(this);

    // bgm
    bgm = AssetManager.get('sound', 'bgm').setLoop(true);
    bgm.volume = 0.5;
    if (!DEBUG_MODE) bgm.play();

    // ハイスコア表示
    if (!options.hiScores) options.hiScores = {};
    hiScoreLabel = Label({
      fontSize: 30,
      fontFamily: 'Skranji',
      fill: '#5AF3A9',
      stroke: '#464646',
    })
    .setOrigin(1, 1)
    .setPosition(this.width, this.height)
    .addChildTo(this);

    Label({
      text: "↓SELECT CHARACTER↓",
      fontSize: 30,
      fontFamily: 'Skranji',
      fill: '#838383',
      stroke: '#464646',
    })
    // .setOrigin(1, 1)
    .setPosition(self.gridX.center(), self.gridY.span(7))
    .addChildTo(this);

    // 操作キャラ
    if (!options._playerIndex) options._playerIndex = 0;
    characters.forEach(function(characterName, i){
      var posXShift = (i%2===0) ? -100 : 100;
      var sprite = Sprite(characterName).addChildTo(self)
      .setPosition(self.gridX.center()+posXShift, self.gridY.span(10))
      .setInteractive(true);

      sprites.push(sprite);
      spriteSize = Math.max(sprite.width, spriteSize);
    });

    // 選択用カーソル
    cursor = RectCursor(spriteSize*1.2)
    .setPosition(sprites[options._playerIndex].x, sprites[options._playerIndex].y)
    .addChildTo(this);

    // キャラ選択
    charaSelect = function(index) {
      // console.log(index);
      options._playerIndex = index;
      options.player = characters[index];
      // NPCの雑な指定
      options.npc = characters[(characters.length-1) - index];

      cursor.move(sprites[index]);
      hiScoreLabel.text = "HISCORE: " + (options.hiScores[options.player] || 0);

      return options.player;
    };

    // 画像クリック選択時の処理
    sprites.forEach(function(sprite, i){
      sprite.on('pointstart', function(){
        charaSelect(i);
        // ハイスコア表記の変更
        // self.hiScoreLabel.text = options.hiScores[pl] || 0;
      });
    });

    // デフォルト選択
    charaSelect(options._playerIndex);

    // 開始ボタン
    var btn = Button({
      text: 'スタート',
      cornerRadius: 5,
    })
    .setPosition(this.gridX.center(), this.gridY.span(14))
    .addChildTo(this);

    btn.onclick = function(){
      bgm.stop();

      // se鳴らす
      var yell = AssetManager.get('sound', 'yell').play();
      self.exit(options);
    };

  },

});

/**
* リサルト画面
*
*/
phina.define('ResultScene', {
  superClass: 'DisplayScene',

  init: function(options) {
    var self = this;
    this.superInit(options);
    // this.backgroundColor = 'hsla(200, 30%, 90%, 0.8)';
    this.backgroundColor = BB_BLUE;
    if (!options.score) options.score = 0;

    // bgm
    var bgm = AssetManager.get('sound', 'bgm').setLoop(true);
    bgm.volume = 0.5;
    if (!DEBUG_MODE) bgm.play();

    // 見出し
    Label({
      text: 'RESULT',
      fontSize: 50,
      fill: '#838383',
    })
    .setPosition(this.gridX.center(), this.gridY.span(2))
    .addChildTo(this)

    // score label
    Label({
      text: options.score + " 点",
      fontSize: 100,
      fill: '#838383',
    })
    .setPosition(this.gridX.center(), this.gridY.span(6))
    .addChildTo(this);

    // スコアの保存・更新
    if (!options.hiScores) options.hiScores = {};
    var currentScore = options.hiScores[options.player];
    if (currentScore) {
      options.hiScores[options.player] = Math.max(options.score, currentScore);
    } else {
      options.hiScores[options.player] = options.score;
    }

    // localstorageに記録
    window.localStorage.setItem("save_data", JSON.stringify(options));

    // タイトル戻るボタン
    var returnButton = Button({
      width: BUTTON_WIDTH,
      text: 'やり直す',
      cornerRadius: 5,
    })
    .setPosition(this.gridX.center(), this.gridY.span(10))
    .addChildTo(this)
    .on('push', function(){
      bgm.stop();
      self.exit(options);
    });

    // twitter投稿ボタン
    var _onPush = function() {
      // 新規タブでシェアページ開く
      // Ref: http://qiita.com/yukiyukki/items/907d3173001c52df50c0
      var childWindow = window.open('about:blank');

      // サウンド
      bgm.stop();
      var se = AssetManager.get('sound', 'ahu');
      // AssetManager.get('sound', 'yell').play();
      se.volume = 0.5;
      se.play();

      var playerNameHash = {
        usamin:'ウサミン',
        shugaha:'シュガハ',
      };

      // URL生成
      var sharedText = 'ｱｯﾌｩﾌﾝ!　キャラ：{player}　点：{score}'.format({
        player: playerNameHash[options.player],
        score: options.score,
      });
      var url = phina.social.Twitter.createURL({
        text: sharedText,
        hashtags: ['BBEMYBABYゲーム'],
      });

      childWindow.location.href = url;
      // childWindow = null;
      childWindow.setTimeout(function() { // 次のイベントループで処理
        childWindow.location.href = url;
      }, 0);
      // window.open(url, 'share window', 'width=480, height=320');
    };

    var tweetButton = Button({
      width: BUTTON_WIDTH,
      text: 'twitterにｱｯﾌｩﾌﾝ!',
      cornerRadius: 5,
    })
    .setPosition(this.gridX.center(), this.gridY.span(13))
    .addChildTo(this)
    // .on('push', _onPush);
    .onclick = _onPush;

    // 何かいる
    var usamin = Sprite('usamin').addChildTo(this);
    usamin.y = Math.randint(0, this.height);
    var shugaha = Sprite('shugaha').addChildTo(this);
    shugaha.x = this.width;
    shugaha.y = Math.randint(0, this.height);
  },

});

/**
* ポーズ画面 スマホでタップさせる用
*
*/
phina.define('MyPauseScene', {
  superClass: 'phina.display.DisplayScene',

  init: function(params) {
    params = ({}).$safe(params, phina.game.PauseScene.defaults);
    this.superInit(params);

    this.backgroundColor = params.backgroundColor;

    var icon = phina.ui.IconFontButton({
      text: 'f04b',
      fill: 'transparent',
      stroke: 'hsla(0, 50%, 100%, 0.5)',
      fontSize: 150,
      cornerRadius: 20,
    }).addChildTo(this)
    .setPosition(this.gridX.center(), this.gridY.center())
    ;
  },
});

/**
* デバッグ用
*/
phina.define('DebugScene', {
  superClass: 'phina.display.DisplayScene',

  init: function(params) {
    params = ({}).$safe(params, phina.game.PauseScene.defaults);
    this.superInit(params);

    this.backgroundColor = BB_BLUE;

  },
});