# 就活ボード

就活のタスク（ES、面接、結果待ち、説明会）を管理するWebアプリです。スマホのホーム画面に追加すると、アプリのように使えます。

いまは「選考ボード」画面だけが動きます。追加、編集、削除、種類ごとの絞り込みができます。

## 2つの使い方

| モード | 保存先 | 設定 |
| --- | --- | --- |
| お試し | この端末のブラウザ内だけ | 不要（そのまま動く） |
| 本番 | Supabase（クラウド） | 下の手順1〜4 |

本番にすると、スマホとPCで同じデータが見られます。ログインは、メールに届くリンクを開くだけです。

---

## 手順1：Supabaseのプロジェクトを作る

1. https://supabase.com でアカウントを作ります（無料）。
2. 「New project」を押します。名前は何でも構いません。Database Password を決めて保存します。Region は Tokyo が近くて速いです。
3. 作成が終わるまで1〜2分待ちます。

## 手順2：データを入れる表を作る

1. 左のメニューから「SQL Editor」を開きます。
2. このフォルダの `supabase/schema.sql` の中身を、すべてコピーして貼り付けます。
3. 「Run」を押します。「Success」と出れば完了です。

この設定で、**自分のデータは自分だけが見られる**ようになります。

## 手順3：接続情報をアプリに入れる

1. Supabaseで「Project Settings」→「API」（または「Connect」）を開きます。
2. 次の2つをコピーします。
   - Project URL
   - anon key（「publishable key」と表示される場合もあります）
3. `public/config.js` を開き、2つの値を貼り付けます。

```js
window.__CONFIG__ = {
  SUPABASE_URL: 'https://xxxx.supabase.co',
  SUPABASE_ANON_KEY: 'ここにキー',
}
```

`service_role` と書かれたキーは、**絶対に入れないでください**。

## 手順4：GitHubで公開してスマホで使う

このフォルダには、GitHub Pagesへ自動で公開する設定（`.github/workflows/deploy.yml`）が入っています。

1. https://github.com でリポジトリを作ります（「New repository」）。
   - 名前は何でも構いません。例：`shukatsu-app`
   - 無料プランでGitHub Pagesを使うので、**Public** を選びます。
2. 作ったリポジトリのページで「uploading an existing file」を押し、このフォルダの中身をすべてドラッグします。
   - `.github` フォルダ（ドットで始まるフォルダ）も入っているか、アップロード後に確認します。
   - 入っていない場合は、「Add file」→「Create new file」で、名前に `.github/workflows/deploy.yml` と入力し、zip内の同名ファイルの中身を貼り付けます。
3. 「Commit changes」を押します。
4. 「Settings」→「Pages」を開き、「Source」を **GitHub Actions** にします。
5. 「Actions」タブで、緑のチェックが付くまで1〜2分待ちます。
6. 「Settings」→「Pages」に、公開URL（`https://ユーザー名.github.io/リポジトリ名/`）が出ます。
7. Supabaseの「Authentication」→「URL Configuration」を開き、Site URL と Redirect URLs に、そのURLを入れます。ログインのメールリンクが正しく動くようになります。
8. スマホでURLを開き、共有ボタンから「ホーム画面に追加」します。

これ以降は、ファイルを変更してCommitするたびに、自動で公開が更新されます。

> `public/config.js` に入れるanon keyは、公開されても問題ないキーです。データは手順2の設定で、本人だけが読めます。ただし `service_role` のキーは絶対に入れないでください。

---

## 自分のPCで動かす

```bash
npm install
npm run dev
```

表示されたURL（通常は http://localhost:5173）をブラウザで開きます。

## これから足す予定の画面

- フロー（スワイプで仕分け）
- ホロ（ホーム画面）
- 締切
- ESストック
