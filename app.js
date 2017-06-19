var fs = require("fs");
var express = require('express');
var session = require('express-session');
var server = require("http").createServer(function(req, res) {
     res.writeHead(200, {"Content-Type":"text/html"});
     var output = fs.readFileSync("index.html", "utf-8");
     res.end(output);
}).listen(3000);
var io = require("socket.io").listen(server);

app = express();

// セッションの設定を行います.
app.use(session({

    // 必須項目署名を行うために使います
    secret : 'my-special-secret',

    // 推奨項目セッション内容に変更がない場合にも保存する場合にはtrue
    resave : false,

    // 推奨項目新規にセッションを生成して何も代入されていなくても値を入れる場合>>
にはtrue
    saveUninitialized : true,

    // アクセスの度に有効期限を伸ばす場合にはtrue
    rolling : true,

    // クッキー名デフォルトではconnect.sid
    name : 'my-special-site-cookie',

    // 一般的なCookie指定
    // デフォルトは{ path: '/', httpOnly: true, secure: false, maxAge: null }
    cookie            : {
        // 生存期間単位ミリ秒
        maxAge : 1000 * 60 * 60 * 24 * 30, // 30日
    }
}));

app.get('/', (req, res) => {

    // セッションから値を読み込みます.
    // ここではJavaScriptのオブジェクトをセッションに入れています.
    let user = req.session.user || { prevAccess : null, pv : 1 };

    // 前回のアクセス日時
    let prevAccess = user.prevAccess;

    // ユーザーごとのPageView
    let pv = user.pv;

    // 今回アクセス分を更新してセッションに保存します.
    user.pv += 1;
    user.prevAccess = new Date();
    req.session.user = user;

    // レスポンス返却
    console.log(`Hello from express4! pv=${pv}, prevAccess=${prevAccess}`);
});


// ユーザ管理ハッシュ
var userHash = {};

// 2.イベントの定義
io.sockets.on("connection", function (socket) {

  // 接続開始カスタムイベント(接続元ユーザを保存し他ユーザへ通知)
  socket.on("connected", function (name) {
    var msg = name + "が入室しました";
    userHash[socket.id] = name;
    console.log(msg);
  });

  // メッセージ送信カスタムイベント
  socket.on("publish", function (data) {
    io.sockets.emit("publish", {value:data.value});
  });

  // スタンプ送信カスタムイベント
  socket.on("publish2", function (data) {
    io.sockets.emit("publish2", {value:data.value});
  });

  // ログ表示カスタムイベント
  socket.on("publish3", function (data) {
    io.sockets.emit("publish3", {value:data.value});
    console.log(data.value);
  });

  // 接続終了組み込みイベント(接続元ユーザを削除し他ユーザへ通知)
  socket.on("disconnect", function () {
    if (userHash[socket.id]) {
      var msg = userHash[socket.id] + "が退出しました";
      delete userHash[socket.id];
    console.log(msg);
    }
  });
});