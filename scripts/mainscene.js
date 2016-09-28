/**
 * メインシーン
 *
 */
phina.define('MainScene', {
  superClass: 'DisplayScene',

  isPlaying: false,
  score: 0,
  _judgeCount: 0,
  _judgeFrame: 0,

  bgVideo: null,
  player: null,
  model: null,

  rotBtn: null,
  rotBtnCCW: null,

  init: function(options) {
    var self = this;
    var _player, motionData, npcMotionData, firstProps, npcFirstProps;
    // var taskCount = 0;
    this.superInit(options);

    // 背景色を指定
    this.backgroundColor = '#000';

    // ビデオの配置
    var bgv = this.bgVideo = phina.display.VideoSprite('bgVideo')
    .setPosition(this.width/2, this.height/2)
      // .play() //ここでplayするとvideoがundefinedエラーとなる
    ;
    // 最奥レイヤーに配置
    this.addChildAt(bgv, 0);

    // キャラクター配置
    if (!options.player) {
      options.player = 'usamin';
      options.npc = 'shugaha';
    }
    // NPC側
    npcMotionData = AssetManager.get('json', options.npc+'_motion').data;
    this.npc = ProgrammableSprite(options.npc).addChildTo(this)
      .setMotionSequence(npcMotionData, bgv.position);

    // Player側
    _player = options.player;
    motionData = AssetManager.get('json', _player+'_motion').data;
    this.model = ProgrammableSprite(_player+'_blank').addChildTo(this)
      .setMotionSequence(motionData, bgv.position);
    // this.model.setMotion(motionData, this.bgVideo.position);
    this.player = Player(_player, motionData).addChildTo(this); // player が最前面

    // 初期位置設定
    npcFirstProps = npcMotionData[0].props;
    firstProps = motionData[0].props;
    this.npc.setPosition(npcFirstProps.x + bgv.x, firstProps.y + bgv.y);
    this.model.setPosition(firstProps.x + bgv.x, firstProps.y + bgv.y);
    this.player.setPosition(firstProps.x + bgv.x, firstProps.y + bgv.y);

    // 仮ラベル
    if (DEBUG_MODE) this.label = Label('BEMYBABY').addChildTo(this).setPosition(this.gridX.center(), this.gridY.center())

    // スコアとか
    this.scoreLabel = Label({
      text: 'dummy',
      fontColor: '#71726D',
      stroke: 'white',
      textAlign: 'right',
      fontFamily: 'Skranji',
    }).addChildTo(this)
    .setOrigin(1, 0)
    .setPosition(this.gridX.span(16), this.gridY.span(2))
    ;

    // 操作ボタン
    var btnSpan = SCREEN_WIDTH/9;
    this.rotBtnCCW = KeyCaptionButton("f0e2", 'Z', {
      fill: '#E83BEA',
      fontSize: btnSpan,
    })
    // .setPosition(this.gridX.span(2), this.gridY.span(14))
    .setPosition(btnSpan, this.gridY.span(14))
    .addChildTo(this)
    // .on('pointstay', function(){
    //   self.player.rotate(true);
    // })
    ;
    this.rotBtn = KeyCaptionButton("f01e", 'X', {
      fill: '#40EB3C',
      fontColor: '#4228E2',
      fontSize: btnSpan,
    })
    .setPosition(btnSpan*2.5, this.gridY.span(14))
    .addChildTo(this);

    this.on('enter', function(){
      var app = this.app;
      var playGame = function() {
        this.isPlaying = true;
        this.player.play();
        this.model.play();
        this.npc.play();
        // bgv.muted = false;
        // bgv.currentTime = 0;
        bgv.play();
      }.bind(this);

      // モバイルとPCでシーン変える
      if (!phina.isMobile()) {
        // カウントダウンシーンセットアップ & ゲームスタート
        app.pushScene(CountdownScene({
          width: self.width,
          height: self.height,
        }));
        // カウントダウンシーンから戻ったらgame start
        app.one('pop', playGame);

      } else {
        // ポーズシーン復帰でゲームスタート
        var pausescene = MyPauseScene({
          width: self.width,
          height: self.height,
          backgroundColor: 'hsla(0, 0%, 0%, 0.70)',
        });
        app.pushScene(pausescene);

        pausescene.onclick = function() {
          app.popScene();
          playGame();
        }.bind(this)
      }

    });

    // ビデオ・モーションが終わったらリサルト画面へ
    this.bgVideo.on('ended', function() {
      // alert('end')
      self.flare('complete');
    });

    this.one('complete', function(){
      // taskCount++;
      // if (taskCount == 2){
        console.log(self._judgeCount);
        options.score = self.score;
        self.exit(options);
      // }
    });

    // 動画の再生時間から動画フレーム数・加点頻度フレームを計算
    var videoFrameNum = Math.floor(bgv.duration/(1/FPS));
    this.judgeFrequency = Math.round((videoFrameNum*0.8)/MAX_JUDGE_COUNT);
    this._judgeFrame += this.judgeFrequency;
  },

  update: function(app) {
    var self = this;
    var ps = app.pointers;
    var kb = app.keyboard;
    var player = this.player;
    var curTime = this.bgVideo.currentTime;
    var frame = Math.floor(curTime*FPS);
    var jq = this.judgeFrequency

    this.scoreLabel.text = "SCORE "+this.score;
    if (this.label) this.label.text = frame;

    // ちょっとずれる・・・
    this.model.updateMove((curTime+0.3)*1000);
    this.npc.updateMove((curTime+0.3)*1000);
    this.player.updateMove((curTime+0.3)*1000);

    // 判定：
    // if (frame && frame%jq === 0 && this._judgeCount < MAX_JUDGE_COUNT) {
    if (frame && this._judgeFrame < frame && this._judgeCount < MAX_JUDGE_COUNT) {
      this._judgeCount++;
      this._judgeFrame += jq;

      this.judgePositionGap();
      this.judgeRotationGap();
    }

    // interaction
    ps.forEach(function(p){
      if (p.getPointing()) {
        // self.bgVideo.currentTime = 10;

        // ボタンを押している間は
        if (self.rotBtn.hitTest(p.x, p.y)) {
          player.rotate();
          // console.log('hit');
        } else if (self.rotBtnCCW.hitTest(p.x, p.y)){
          player.rotate(true);

        } else {
          // 指に合わせてプレイヤー移動
          player.setPosition(
            player.x + p.deltaPosition.x*SENSIBILITY,
            player.y + p.deltaPosition.y*SENSIBILITY
          );
        };

      }
    });
    if (kb.getKey('z')) {
      player.rotate(true);
    }
    if (kb.getKey('x')) {
      player.rotate();
    }

  },

  onclick: function(){
    // this.bgVideo.currentTime = 4;
    // this.bgVideo.play();
  },

  addScore: function(addedScore, property) {
    this.score += addedScore;
    var label;
    var params = {
      fontFamily: 'Skranji',
      fontSize: 25,
      // hoppingHeight: 100,
    };
    switch (property) {
      case 'rotation':
        // 緑系ラベル
        // label = HoppingLabel('角度ボーナス +'+addedScore, '#A9F1CB', '#15E891')
        // label = HoppingLabel('+'+addedScore, '#A9F1CB', '#15E891')
        label = HoppingLabel(params.$extend({text: '+'+addedScore, fill: '#A9F1CB', stroke: '#15E891'}))
        .setPosition(this.player.x, this.player.y+Math.randint(-40, -20));
        break;
      case 'position':
        // 赤系ラベル
        // label = HoppingLabel('位置ボーナス +'+addedScore, '#FFC4C4', '#BC1111')
        // label = HoppingLabel('+'+addedScore, '#FFC4C4', '#BC1111')
        label = HoppingLabel(params.$extend({text: '+'+addedScore, fill: '#FFC4C4', stroke: '#BC1111'}))
        .setPosition(this.player.x, this.player.y+Math.randint(-80, -40))
        break;
      default:
        label = HoppingLabel(addedScore, '#A9F1CB', '#15E891');
        break;
    }

    label.addChildTo(this);
  },

  judgeRotationGap: function() {
    var delta = Math.abs(this.model.rotation - this.player.rotation)*0.01;
    var score = (1-delta < 0)? 0 : MAX_SCORE * (1-delta);
    this.addScore(Math.floor(score),'rotation');
    // console.log("rotation", score)
  },

  judgePositionGap: function() {
    var distance = Vector2.distance(this.model.position, this.player.position);
    var ratio = distance/DISTANCE_BORDER;
    var score = (ratio > 1) ? 0 : MAX_SCORE * (1-ratio);
    this.addScore(Math.floor(score), 'position');
    // console.dir(this.model.position)
    // console.log(distance);
  },

});
