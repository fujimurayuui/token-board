# Token Board PWA

MTGなどのTCG向けに使える、iPhone対応のPWAトークン管理アプリです。

## 主な機能

- トークンの追加、編集、削除
- トークン数の増減
- パワー/タフネス管理
- 色とメモの設定
- 同じ種類のトークンごとに「アンタップ数」と「タップ数」を分けて管理
- 「1体タップ」「1体戻す」「全タップ」「全アンタップ」
- ローカル保存
- PWA/オフライン対応

## iPhoneで使う方法

1. このフォルダをGitHub Pages、Netlify、Vercelなどにアップロードします。
2. 公開されたURLをiPhoneのSafariで開きます。
3. Safariの共有ボタンから「ホーム画面に追加」を選びます。
4. ホーム画面のアイコンから起動します。

## GitHub Pagesで更新する場合

既存リポジトリにある以下のファイルを、このフォルダの内容で上書きアップロードしてください。

- `index.html`
- `style.css`
- `app.js`
- `manifest.webmanifest`
- `service-worker.js`
- `icons`フォルダ
- `README.md`

更新後、iPhoneで古い画面が残る場合は、URLの末尾に `?v=2` を付けて開き直してください。
ホーム画面に追加済みの場合は、一度ホーム画面のアイコンを削除してから再追加すると確実です。

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
