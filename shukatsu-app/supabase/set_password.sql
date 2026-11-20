-- すでにあるアカウントに、メールを使わずにパスワードを設定します（データはそのまま残ります）。
--
-- 使い方：
--   1. Supabase の SQL Editor に、下の update 文を貼り付けます。
--   2. SQL Editor の中で、2か所を自分のものに書きかえます。
--        ・'ここに新しいパスワード'   → 決めたパスワード（6文字以上）
--        ・'ここにメールアドレス'     → ログインに使うメールアドレス
--   3. Run を押します。結果に「1 row」と出れば成功です。
--
-- ※ このファイル自体には、本物のパスワードやメールアドレスを書き込まないでください。
--    GitHub（公開リポジトリ）にアップロードすると、誰でも見られてしまいます。

update auth.users
set
  encrypted_password = extensions.crypt('ここに新しいパスワード', extensions.gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'ここにメールアドレス';
