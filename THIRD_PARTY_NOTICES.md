# 第三方来源

- Suzu Lives：仅复用 `companion-web/web/vendor/suzu/conversation-reply-segmentation.mjs` 分句模块，Apache-2.0 许可及上游 NOTICE 原样保留在同目录。原模块 SHA-256 和来源说明在该目录 README。没有迁移整个 Suzu runtime 或记忆服务。
- React、Vite、Three.js、lucide-react 及传递依赖：版本锁定在前端 `package-lock.json`；各依赖使用自己的许可证。
- CSS 中的 Google Fonts 引用是可选在线字体请求，离线时使用回退字体。字体文件没有打包进仓库。

未将本仓库整体指定为开源许可；第三方代码原有许可与署名继续适用。