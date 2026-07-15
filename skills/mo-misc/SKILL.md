---
name: mo-misc
version: 0.1.0
description: "墨问 Misc 通用工具。当上传本地文件或远端 URL 到墨问、获取 file_id、为笔记/评论/其它内容准备图片/音频/PDF 附件引用时触发。"
metadata:
  requires:
    bins: ["mocli"]
  cliHelp: "mocli misc --help"
---

# 前置约束

**CRITICAL — 先阅读 [`共享规则`](../mo-shared/SKILL.md)，其中包含 `mocli` 初始化、认证、输出解析以及安全规则**

# mocli misc - 墨问通用工具

本技能指导你使用 `mocli misc` 完成通用辅助操作。当前主要能力是上传本地或远端文件，并获取后续可被笔记、评论或其它墨问接口引用的 `file_id`。

## mocli misc upload [--file] [--url] [--filename]

本命令用于将本地文件或远端文件 URL 上传到墨问。上传成功后返回 `reply.file_id`，并尽量返回文件名、MIME、大小和 `file_meta` 等元信息。

### 使用时机

  * 用户明确要求“上传文件到墨问”“上传图片/音频/PDF”“把这个 URL 上传成墨问文件”时使用本命令。
  * 用户要创建或编辑笔记，并需要先获得图片、音频或 PDF 的 `file_id` 时，先使用本命令上传文件，再把返回的 `file_id` 用到后续内容构造中。
  * 用户只想引用一个已有公网 URL，且目标接口明确支持 URL 直链时，不要自动上传；只有需要墨问 `file_id` 时才上传。

### 可选参数

  * `--file string`：本地文件路径。与 `--url` 二选一，不能同时传。
  * `--url string`：远端文件 URL。与 `--file` 二选一，不能同时传。
  * `--filename string`：可选的上传文件名。用于服务端展示名和上传表单文件名；不传时，本地文件默认使用路径 basename，远端 URL 默认不强行推导。

### 使用原则

  * `--file` 和 `--url` 必须且只能提供一个；如果用户同时给了本地路径和 URL，先询问要上传哪一个。
  * 本地文件路径建议使用绝对路径，避免工作目录不一致导致找不到文件。
  * 不要添加 `--filetype`；CLI 会读取文件内容或远端响应前 512 字节，根据 MIME 自动识别类型。
  * 当前支持上传图片、音频和 PDF；HTML、纯文本、压缩包、视频或未知 MIME 会被拒绝。
  * 大小限制：图片小于 50MB，音频小于 200MB，PDF 小于 100MB。用户给出的文件明显超限时，先说明限制，不要盲目尝试。
  * 上传本地文件或远端 URL 都会向墨问服务端提交文件内容；如果文件可能包含隐私或敏感信息，执行前先确认用户确实要上传。
  * 对远端 URL，上传过程会由 CLI 下载该 URL 内容；如果 URL 需要登录态、临时签名或内网访问，可能失败，应提示用户提供可公开访问或当前环境可访问的链接。
  * 执行后按共享规则解析顶层 `code`、`status`、`reason`；成功时展示 `reply.file_id`，并根据任务需要使用 `reply.file_type`、`reply.file_name`、`reply.file_mime`、`reply.file_size`、`reply.file_meta`；失败时展示 `reason`、`msg`、`meta.hints` 等可执行信息。

### 使用示例

  * 上传本地图片 `mocli misc upload --file /path/to/avatar.png`
  * 上传本地 PDF 并指定展示名 `mocli misc upload --file /path/to/report.pdf --filename "产品报告.pdf"`
  * 上传远端图片 URL `mocli misc upload --url "https://example.com/image.png" --filename "image.png"`
  * 上传本地音频 `mocli misc upload --file /path/to/audio.wav`

### 输出示例

```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "file_id": "F_uploaded",
    "file_type": "AUDIO",
    "file_name": "audio.mp3",
    "file_mime": "audio/mpeg",
    "file_size": 3790598,
    "file_meta": "{\"duration\":236.878367,\"format\":\"mp3\",\"format_name\":\"mp3\"}"
  }
}
```

### reply 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `file_id` | string | 上传成功后的墨问文件 ID，可用于后续笔记、评论或其它支持文件引用的接口。 |
| `file_type` | string | 文件类型，通常为 `IMAGE`、`AUDIO` 或 `PDF`。 |
| `file_name` | string | 上传时使用或服务端记录的文件名。 |
| `file_mime` | string | 文件 MIME，例如 `image/jpeg`、`audio/mpeg`、`application/pdf`。 |
| `file_size` | number | 文件大小，单位字节。 |
| `file_meta` | string | 文件元信息 JSON 字符串；不同文件类型字段不同，例如音频可能包含 `duration`，图片可能包含 `width/height`。 |

# 展示规则

  ** 参考 ** [`公共展示规则`](../mo-shared/SKILL.md#reply-display-rules)
