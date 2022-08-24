# publer-gas

以下のコマンドでデプロイの一覧が表示されるので、最新のデプロイ ID をコピーする。

```sh
clasp deployments
```

確認したデプロイ ID を使って以下のコマンドを実行するとデプロイが更新される。

```sh
clasp push
clasp deploy -i <Deploy ID>
```

URL は更新してもhttps://script.google.com/macros/s/<Deploy ID>/exec のまま固定。
