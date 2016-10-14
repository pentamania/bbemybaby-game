<?php
/**
* Convert the Aviutl alias file (.exa) to tweener data(.json).
* How to run : 'php [source.exa] [dist.json] [source fps]'

  @format：
  [
    {framelength:number, duration:number, props:{x:number, y:number, scaleX:number, scaleY:number, rotation:number} },
    {...},
    ...
  ]
*/

// setlocale(LC_ALL, 'ja_JP.UTF-8');
const DEFAULT_FPS = 30;
$MSPF = (1000/DEFAULT_FPS); // ms per frame: フレームごとの時間

// ファイルパス： オプションで指定
$file = './dummy.exa';
$convertedFileName = "dummy-motion.json";
if (isset($argv[1])) $file = $argv[1];
if (isset($argv[2])) $convertedFileName = $argv[2];
if (isset($argv[3])) $MSPF = 1000/$argv[3];

$match_strings = [
  // ['match string', "converted-property-name"],
  ["length", "frameLength"],
  ["X", "x"],
  ["Y", "y"],
  ["拡大率", "scale"],
  ["回転", "rotation"],
];
$converted_data = array();
$tween_data = [];
$_props = [];

// ファイルの文字コード変換 shift-jis -> utf-8
$data = file_get_contents($file);
$data = mb_convert_encoding($data, 'UTF-8', 'sjis-win');
$temp = tmpfile();
fwrite($temp, $data);
rewind($temp);

// ファイルのスキャン
while (!feof($temp)) {
// while (($data = fgetcsv($temp, 0, ",")) !== FALSE) {
  $line = fgets($temp);

  // 行毎に必要な文字列があるか検索
  foreach($match_strings as $word) {
    if (strpos($line, $word[0]) !== false) {
      $pieces = explode(",", $line);

      // 整数・小数点部分のみ抜き出し、$matchesに保存
      preg_match('/[-]?\d+(\.\d+)?/', $pieces[0], $matches);
      // $line = mb_convert_encoding($line, "sjis-win", "UTF-8");

      // プロパティの追加
      if ($word[0] === 'length') {
         // frameLength: int
        $tween_data[$word[1]] = (int)$matches[0];
        $tween_data['duration'] = ($tween_data['frameLength']) * $MSPF;
      } else if ($word[0] === '拡大率') {
         // scale: float
        $tween_data[$word[1]] = (float)$matches[0]/100;
        $_props['scaleX'] = $_props['scaleY'] = (float)$matches[0]/100;
      } else {
        // $_props[$word[1]] = ($word[0] === "拡大率") ? (float)$matches[0]/100 : (float)$matches[0];
        $_props[$word[1]] = (float)$matches[0];
      }

      // ”回転”で一区切り （"[vo]"でもいい？）
      if ($word[0] === "回転") {
        // echo $matches[0].'\n';
        $tween_data['props'] = $_props;

        // push
        $converted_data[] = $tween_data;

        // 初期化
        $_props = [];
        $tween_data = [];
      }
    }
  }
}
fclose($temp);

// JSON変換
// $converted_data = json_encode($converted_data, JSON_PRETTY_PRINT);
$converted_data = json_encode($converted_data);

// Save to new file
$newfile = fopen($convertedFileName, "w");
if ($newfile) {
  fwrite($newfile, $converted_data);
  fclose($newfile);
}
