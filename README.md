# Token Board PWA

MTGなどのTCG向けに使える、iPhone対応のPWAトークン管理アプリです。

## 主な機能

- トークンの追加、編集、削除
- トークン数の増減
- パワー/タフネス管理
- 色とメモの設定
- タップ/アンタップ管理
- 全アンタップ
- 自分/相手ライフ管理
- エネルギーカウンター
- ローカル保存
- PWA/オフライン対応

## iPhoneで使う方法

1. このフォルダをGitHub Pages、Netlify、Vercelなどにアップロードします。
2. 公開されたURLをiPhoneのSafariで開きます。
3. Safariの共有ボタンから「ホーム画面に追加」を選びます。
4. ホーム画面のアイコンから起動します。

## ローカルで確認する方法

PC上で動作確認する場合は、このフォルダで簡易サーバーを起動してください。

```bash
python3 -m http.server 8000
```

その後、ブラウザで次を開きます。

```text
http://localhost:8000
```

※ Service Workerは `file://` では動きません。HTTP/HTTPSで開いてください。
