---
name: mo-note
version: 0.1.0
description: "墨问笔记。当创建笔记、编辑笔记、设置笔记、查看某人的主页笔记列表、我的笔记列表、搜索笔记时触发。"
metadata:
  requires:
    bins: ["mocli"]
  cliHelp: "mocli note --help"
---

# 前置约束

**CRITICAL — 先阅读 [`共享规则`](../mo-shared/SKILL.md)，其中包含 `mocli` 初始化、认证、输出解析以及安全规则**

# mocli note - 墨问笔记

## 命令选择规则

* 用户要“创建/发布/写一篇墨问笔记”时，使用 `mocli note create`。这是写入操作，执行前必须确认用户确实要创建笔记，尤其是带 `--publish` 自动发布时。
* 用户要“编辑/修改/更新已有墨问笔记正文”时，使用 `mocli note edit`。这是写入操作，执行前必须确认目标笔记 ID、完整替换后的正文来源，以及用户确实要覆盖原笔记正文。
* 用户要“设置/修改笔记隐私/公开或私有某篇笔记/设置部分公开规则”时，使用 `mocli note set`。这是写入操作，执行前必须确认目标笔记 ID 和隐私设置；当前 `note set` 只支持隐私设置，不用于修改正文、标签或发布内容。
* 用户要“搜索某关键词相关笔记”时，使用 `mocli note search`。
* 用户要“看某人的主页/公开笔记/热门笔记/付费笔记/合集”时，使用 `mocli note homepage`。
* 用户要“看我自己的笔记/私有笔记/未公开笔记/我写过的笔记”时，使用 `mocli note mine`。
* 用户提到人名、昵称、备注名但没有给 UID 时，优先用 [`mo-remark`](../mo-remark/SKILL.md) 查 UID；未命中再考虑 `mocli user search` 或询问用户补充 UID。
* 创建/编辑笔记正文时，如果需要把本地文件或远端 URL 转成墨问文件 ID，先使用 [`mo-misc`](../mo-misc/SKILL.md) 的 `mocli misc upload` 获取 `reply.file_id`。
* 展示笔记列表时，优先按 `reply.note_ids` 的顺序遍历，再到 `reply.notes[note_id]` 获取笔记详情，并用 `reply.notes[note_id].uid` 到 `reply.users` 获取作者信息。

## 正文资源引用处理流程

创建和编辑笔记时，如果源内容里包含图片、音频或 PDF 资源引用，应先确认用户希望“上传到墨问并引用 file_id”，还是“保留原始 URL/路径文本”。不要在未确认时自动上传用户文件或远端 URL。

### 需要触发确认的场景

  * HTML 中出现 `<img src="...">` 时，且 `src` 明确指向图片文件或可判断为图片资源。
  * HTML 中出现 `<a href="...">` 时，且 `href` 明确指向图片、音频或 PDF 文件。
  * Markdown 中出现本地文件引用时，例如 `![](./image.png)`、`[报告](./report.pdf)`、`[音频](../audio.wav)`，且文件格式为图片、音频或 PDF。

### 上传与转换规则

  * 用户选择上传时，按 [`mo-misc`](../mo-misc/SKILL.md) 使用 `mocli misc upload` 获取上传结果。本地文件使用 `--file`，远端 URL 使用 `--url`；可用原始文件名、alt 文本或链接文本作为 `--filename`。
  * 上传结果至少读取 `reply.file_id`；如果存在，也读取 `reply.file_type`、`reply.file_name`、`reply.file_mime`、`reply.file_size`、`reply.file_meta`。`file_meta` 是 JSON 字符串，可能包含音频 `duration`、图片 `width/height`、PDF `format` 等元信息；解析失败时不要阻断正文转换，只跳过对应增强属性。
  * 上传成功后，将资源转换为正文语法树资源节点：图片使用 `{ "type": "image", "attrs": { "uuid": "<file_id>", "alt": "<可选描述>" } }`；音频使用 `{ "type": "audio", "attrs": { "audio-uuid": "<file_id>" } }`；PDF 使用 `{ "type": "pdf", "attrs": { "uuid": "<file_id>" } }`。
  * 生成音频节点时，尽量从 `reply.file_meta.duration` 读取音频时长；如果存在，写入 `attrs.audio-duration`，属性值使用字符串形式，例如 `{ "type": "audio", "attrs": { "audio-uuid": "<file_id>", "audio-duration": "236.878367" } }`。
  * 生成 PDF 节点时，尽量补充展示信息：`attrs.name` 优先使用 `reply.file_name`，`attrs.size` 优先使用 `reply.file_size` 的字符串形式；如果 `file_meta` 中有更明确的 PDF 元信息，可作为辅助参考，但不要覆盖用户明确指定的文件名。
  * 用户选择保留原始 URL 时，不要生成资源节点；将 URL 作为普通链接文本保留在段落中，例如 `text.marks` 里的 `link` mark。对于本地路径，提醒用户本地路径在墨问正文中通常无法被其他人访问；用户仍要求保留时，再按普通文本或链接文本保留。
  * 如果 HTML/Markdown 资源类型无法明确判断为图片、音频或 PDF，默认保留为普通链接，不调用上传。
  * 如果同一正文中有多个资源，先列出资源清单并一次性询问用户哪些需要上传、哪些保留原始 URL/路径；获得决定后再执行上传和正文树转换。
  * 如果用户选择了较多的文件进行上传，提醒用户文件上传是有配额的，默认配额 20 次/天，Pro 会员用户 200 次/天，避免超出限制。

## mocli note create [--file] [--publish] [--tags]

本命令用于创建墨问笔记。创建笔记属于写入操作，执行命令前必须向用户确认要创建的内容来源、是否自动发布、以及标签。

`mocli note create` 接收的是墨问笔记正文语法树，不要把 Markdown、HTML、纯文本或自然语言描述直接交给命令。无论用户提供的是文件还是一段自然语言，都应先参考 [`mo-note-content - 墨问笔记正文语法树`](../mo-shared/references/mo-note-content-schema.md) 格式化为正文树 JSON，再根据内容复杂度和后续编辑可能性，选择通过 `--file` 或 stdin 传入。

可选参数：

  * `--file string`：从文件读取笔记内容。建议使用绝对路径，文件内容必须是格式化后的墨问笔记正文语法树 JSON。
  * `--publish`：创建后自动发布笔记。只有用户明确要求“发布/公开/创建后发布”时才添加。
  * `--tags string`：逗号分隔的标签列表，最多 5 个标签。

### 内容格式化流程

  * 用户提供 Markdown 文件：读取 Markdown，转换为正文树 JSON。普通段落转 `paragraph`，空行可转空 `paragraph`；加粗、链接、高亮、行内代码等可表达样式转为 `marks`；遇到本地图片、音频或 PDF 文件引用时，按“正文资源引用处理流程”确认是否上传并转换为资源节点；不支持的 Markdown 结构保守转为纯文本段落。
  * 用户提供 HTML 文件：解析或提取正文内容，转换为正文树 JSON。支持的内联样式和链接转为 `marks`；遇到 `<img>` 或明确指向图片、音频、PDF 的 `<a href>` 时，按“正文资源引用处理流程”确认是否上传并转换为资源节点；不支持的标签应提取其中有用的可读文字并按原文语义转为文本节点，不要把 HTML 标签源码本身保存到笔记中。
  * 用户提供 text 文件或直接粘贴正文：按段落拆分为 `paragraph` 和 `text` 节点；空行可转为空 `paragraph`。
  * 用户只提供自然语言描述：先根据描述生成笔记正文，再转换为正文树 JSON；如果标题、标签、是否发布等关键信息不明确，先向用户确认。
  * 正文块之间的段落间距按 [`mo-note-content - 段落间距`](../mo-shared/references/mo-note-content-schema.md#段落间距) 处理，相邻正文块之间默认插入一个空段落。
  * 转换后的顶层必须是 `{ "type": "doc", "content": [...] }`。生成后应尽量做 JSON 语法校验，再执行创建命令。

### 使用原则

  * 用户只说“创建笔记/保存到墨问”，默认不加 `--publish`，避免意外公开。
  * 用户明确要求“发布笔记/公开发布/创建后自动发布”时，才使用 `--publish`。
  * 用户提供标签时，用英文逗号拼接到 `--tags`，并确保不超过 5 个。
  * 用户提供的源内容不是正文树 JSON 时，先格式化为正文树 JSON，再按“输入方式选择规则”决定保存为文件还是通过 stdin 传入。
  * 临时 JSON 文件只用于命令输入，不要把 API Key 或其它敏感信息写入正文文件。
  * 执行后按共享规则解析顶层 `code`、`status`、`reason`；成功时展示返回的笔记 ID 或链接，失败时展示 `reason`、`msg`、`meta.hints` 等可执行信息。

### 输入方式选择规则

  * 用户提供 Markdown、HTML、text 文件，且内容结构比较复杂、转换成正文树 JSON 后可能需要多次调用 `mocli note create` 调整时，应保存为文件并使用 `--file <path>`。这样可以保留转换结果，避免上下文压缩、会话中断或重复尝试时丢失要创建的内容。
  * 用户提供的内容比较长，且当前是创作、整理、润色类场景，判断创建前后还会持续打磨修改时，应保存为文件并使用 `--file <path>`。
  * 用户提供的内容比较简单、较短，例如随手记录一件事、纯文本自然语言短句时，可以通过 stdin 传入格式化后的正文树 JSON，避免产生较多零碎临时文件。
  * 如果无法判断用户更看重可追溯的文件还是一次性快速创建，应简短征询用户意见。

### 使用示例

  * 从文件(--file)创建一篇私有笔记 `mocli note create --file /path/to/note-body.json`
  * 从文件(stdin)创建一篇私有笔记 `mocli note create < /path/to/note-body.json`
  * 通过 stdin 创建一篇短文本笔记 `printf '%s' '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"今天随手记录一件事"}]}]}' | mocli note create`
  * 从文件创建并自动发布笔记 `mocli note create --file /path/to/note-body.json --publish`
  * 创建带标签的笔记 `mocli note create --file /path/to/note-body.json --tags "AI,产品思考"`
  * 创建带标签并自动发布的笔记 `mocli note create --file /path/to/note-body.json --publish --tags "AI,产品思考"`

## mocli note edit [--note_id] [--file]

本命令用于编辑已有墨问笔记的正文。编辑笔记属于写入操作，执行命令前必须向用户确认目标笔记 ID、完整替换后的正文来源，以及是否确认用新正文覆盖原正文。

`mocli note edit` 接收的是完整的新墨问笔记正文语法树，不是局部 diff，也不是 Markdown、HTML、纯文本或自然语言描述。无论用户提供的是文件、粘贴正文还是“把某段改成某段”的自然语言指令，都应先整理成完整的正文树 JSON，再通过 `--file` 或 stdin 传入。正文树格式仍参考 [`mo-note-content - 墨问笔记正文语法树`](../mo-shared/references/mo-note-content-schema.md)。

可选参数：

  * `--note_id string`：要编辑的目标笔记 ID。必填。
  * `--file string`：从文件读取编辑后的完整笔记内容。文件内容必须是格式化后的墨问笔记正文语法树 JSON。

### 编辑前确认流程

  * 用户已经提供明确笔记 ID 和完整新正文时，复述目标笔记 ID 和正文来源，确认会覆盖原笔记正文后再执行。
  * 用户只提供笔记链接时，先从链接中提取笔记 ID；无法稳定提取时，请用户补充 `note_id`。
  * 用户只说“修改我最新的笔记/修改某篇笔记”但没有给笔记 ID 时，先用 `mocli note mine` 或用户指定的上下文帮助定位候选笔记，再让用户确认具体 `note_id`。
  * 用户提出局部修改要求时，必须先获得或构造完整的新正文树 JSON；不要把局部修改片段直接传给 `mocli note edit`。

### 内容格式化流程

  * 用户提供已经格式化好的正文树 JSON：先做 JSON 语法校验，并确认顶层是 `{ "type": "doc", "content": [...] }`。
  * 用户提供 Markdown、HTML、text 文件或粘贴正文：按 `mocli note create` 的内容格式化流程转换为完整正文树 JSON；其中 Markdown/HTML 资源引用同样按“正文资源引用处理流程”处理。
  * 用户要求基于某篇现有笔记做局部修改，但当前上下文没有原始完整正文树时，不要猜测原文结构；先让用户提供原文、导出的正文树 JSON，或补充足够内容来生成完整替换稿。
  * 临时 JSON 文件只用于命令输入，不要把 API Key 或其它敏感信息写入正文文件。

### 使用原则

  * `mocli note edit` 只编辑正文内容，不处理发布状态、标签或隐私设置；这些设置不要混入正文 JSON。
  * 编辑是完整正文覆盖，不是追加、补丁或局部更新；执行前必须让用户理解这一点。
  * 内容复杂、较长、来自文件或可能需要反复调整时，应保存为文件并使用 `--file <path>`。
  * 内容简单、较短，且用户已经确认可以一次性覆盖时，可以通过 stdin 传入格式化后的正文树 JSON。
  * 执行后按共享规则解析顶层 `code`、`status`、`reason`；成功时展示返回的笔记 ID，失败时展示 `reason`、`msg`、`meta.hints` 等可执行信息。

### 使用示例

  * 从文件编辑已有笔记 `mocli note edit --note_id note-123 --file /path/to/note-body.json`
  * 通过 stdin 编辑已有笔记 `mocli note edit --note_id note-123 < /path/to/note-body.json`
  * 通过管道编辑一篇短文本笔记 `printf '%s' '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"更新后的完整正文"}]}]}' | mocli note edit --note_id note-123`

## mocli note set [--note_id] [--privacy] [--disable-share] [--expire-at]

本命令用于设置已有墨问笔记的隐私规则。设置笔记属于写入操作，执行命令前必须向用户确认目标笔记 ID、隐私类型，以及规则公开时的分享和过期设置。

当前 `mocli note set` 只承载 OpenAPI 已释放的笔记隐私设置能力；不要用它修改正文、标签、标题或其它元数据。修改正文使用 `mocli note edit`，创建后发布和标签设置使用 `mocli note create` 的相关参数。

可选参数：

  * `--note_id string`：要设置的目标笔记 ID。必填。
  * `--privacy string`：隐私类型。必填，支持 `public`、`private`、`rule`。
  * `--disable-share`：仅在 `--privacy rule` 时生效，表示禁止分享和转发。默认不添加，即允许分享和转发。
  * `--expire-at int`：仅在 `--privacy rule` 时生效，秒级 Unix 时间戳。默认 `0` 表示永久可见；必须是非负整数。

### 隐私类型说明

  * `public`：完全公开。不要附加 `--disable-share` 或 `--expire-at`，即使传入也会被业务层忽略。
  * `private`：私有。不要附加 `--disable-share` 或 `--expire-at`，即使传入也会被业务层忽略。
  * `rule`：部分公开/规则公开。可以用 `--disable-share` 禁止分享转发，并用 `--expire-at` 设置公开截止时间；`--expire-at 0` 表示永久可见。

### 设置前确认流程

  * 用户已经提供明确笔记 ID 和隐私类型时，复述目标笔记 ID、隐私类型和规则项，确认后再执行。
  * 用户只提供笔记链接时，先从链接中提取笔记 ID；无法稳定提取时，请用户补充 `note_id`。
  * 用户只说“把我最新的笔记设为公开/私有/部分公开”但没有给笔记 ID 时，先用 `mocli note mine` 或用户指定的上下文帮助定位候选笔记，再让用户确认具体 `note_id`。
  * 用户要求“部分公开/规则公开”但没有说明是否禁止分享或过期时间时，默认允许分享且永久可见；如果语义可能影响用户预期，应简短确认。

### 使用原则

  * 用户只说“公开这篇笔记”，使用 `--privacy public`。
  * 用户只说“设为私有/仅自己可见”，使用 `--privacy private`。
  * 用户只说“部分公开/规则公开”，使用 `--privacy rule`，不自动添加 `--disable-share`，`--expire-at` 默认 0。
  * 用户给出自然语言过期时间时，应换算为秒级 Unix 时间戳后传入 `--expire-at`，并在执行前把换算后的具体时间复述给用户确认。
  * 执行后按共享规则解析顶层 `code`、`status`、`reason`；成功时展示返回的笔记 ID，失败时展示 `reason`、`msg`、`meta.hints` 等可执行信息。

### 使用示例

  * 将笔记设为完全公开 `mocli note set --note_id note-123 --privacy public`
  * 将笔记设为私有 `mocli note set --note_id note-123 --privacy private`
  * 将笔记设为部分公开且允许分享 `mocli note set --note_id note-123 --privacy rule`
  * 将笔记设为部分公开且禁止分享 `mocli note set --note_id note-123 --privacy rule --disable-share`
  * 将笔记设为部分公开并设置过期时间 `mocli note set --note_id note-123 --privacy rule --expire-at 1893456000`

## mocli note search [--keyword] [--count] [--focus]

本命令用于按关键词搜索笔记。`--keyword` 是必填参数；如果用户明确要求只搜索指定用户的笔记，先解析该用户 UID，再通过 `--focus` 指定 UID。

可选参数：

  * `--keyword string`：搜索关键词（必填）。
  * `--count int`：返回笔记数量。范围：`1-100`。默认：`20`。
  * `--focus string`：只搜索指定用户（UID）的笔记。

### 使用示例

  * 在墨问中搜索包含「AI Agent」关键词的笔记 `mocli note search --keyword "AI Agent"`
  * 在墨问中搜索 10 篇包含「产品思考」的笔记 `mocli note search --keyword "产品思考" --count 10`
  * 在墨问中搜索老池（指定 UID）写的「Prompt」相关笔记 `mocli note search --keyword "Prompt" --focus xxxxxxxx --count 20`

### 输出示例

```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "note_ids": [
      "3jv1AiAjXJ4aBC83LqdMC",
      "ZVDGaChlin5voLpIp_9TM"
    ],
    "notes": {
      "3jv1AiAjXJ4aBC83LqdMC": {
        "note_id": "3jv1AiAjXJ4aBC83LqdMC",
        "uid": "Qiz5hxiY5wr5L76fyd8Kv",
        "title": "最近心情",
        "brief": "笔记摘要",
        "url": "https://note.mowen.cn/detail/3jv1AiAjXJ4aBC83LqdMC?from=mocli"
      },
      "ZVDGaChlin5voLpIp_9TM": {
        "note_id": "ZVDGaChlin5voLpIp_9TM",
        "uid": "Qiz5hxiY5wr5L76fyd8Kv",
        "title": "大家好呀，我是小白",
        "brief": "笔记摘要",
        "url": "https://note.mowen.cn/detail/ZVDGaChlin5voLpIp_9TM?from=mocli"
      }
    },
    "users": {
      "Qiz5hxiY5wr5L76fyd8Kv": {
        "uid": "xxxxxxxxxxxxxx",
        "name": "精卫鸟.",
        "intro": "一只小小鸟，订阅我的没几个人，所以你们都是特殊的。。"
      }
    }
  }
}
```

### reply 字段说明

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `note_ids` | array | 笔记 ID 列表（有序）。展示列表时优先遍历该字段。 | - |
| `notes` | map[string]NoteInfo | 笔记信息 `Map`，键为笔记 ID，值为笔记信息。 | [`NoteInfo - 笔记信息`](../mo-shared/references/mocli-output-schema.md#note-info) |
| `users` | map[string]UserInfo | 用户信息 `Map`，键为用户 UID，值为用户信息。展示作者时用 `notes[note_id].uid` 到该 Map 中查找。 | [`UserInfo - 用户信息`](../mo-shared/references/mocli-output-schema.md#user-info) |

## mocli note homepage [--uid] [--filter] [--count] [--recent]

本命令用于查看某个用户个人主页上的笔记列表，即对外展示的笔记；它不同于 `mocli note mine`，不会返回当前认证用户的私有笔记。用户未提供 `--uid` 时，默认查看当前认证用户的主页。

可选参数：

  * `--uid string`：要查看主页笔记的墨问 UID。默认使用当前认证用户的 UID。
  * `--filter string`：筛选类型。支持：`all(全部笔记)`、`album(合集)`、`fee(付费笔记)`、`popular(热门笔记，即最多阅读)`。默认：`all`。
  * `--count int`：返回笔记数量。范围：`1-100`。默认：`20`。
  * `--recent string`：最近时间筛选，目前支持到天(d)和小时(h)，如：`2h`、`1d`，范围：`1h-15d`。当 `--filter=popular` 时忽略本参数。

### 使用示例

  * 看看我最近发表了哪些笔记 `mocli note homepage --recent 3d`
  * 给我 10 篇二爷发表过的付费笔记 `mocli note homepage --uid xxxxxxxx --filter fee --count 10`
  * 给我 10 篇老池最近 3 天发表过的笔记合集 `mocli note homepage --uid xxxxxxxx --filter album --count 10 --recent 3d`
  * 给我 30 篇池老师最热门的笔记 `mocli note homepage --uid xxxxxx --filter popular --count 30`

### 输出示例

```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "note_ids": [
      "3jv1AiAjXJ4aBC83LqdMC",
      "ZVDGaChlin5voLpIp_9TM"
    ],
    "notes": {
      "3jv1AiAjXJ4aBC83LqdMC": {
        "note_id": "3jv1AiAjXJ4aBC83LqdMC",
        "uid": "Qiz5hxiY5wr5L76fyd8Kv",
        "title": "最近心情",
        "brief": "笔记摘要",
        "url": "https://note.mowen.cn/detail/3jv1AiAjXJ4aBC83LqdMC?from=mocli"
      },
      "ZVDGaChlin5voLpIp_9TM": {
        "note_id": "ZVDGaChlin5voLpIp_9TM",
        "uid": "Qiz5hxiY5wr5L76fyd8Kv",
        "title": "大家好呀，我是小白",
        "brief": "笔记摘要",
        "url": "https://note.mowen.cn/detail/ZVDGaChlin5voLpIp_9TM?from=mocli"
      }
    },
    "users": {
      "Qiz5hxiY5wr5L76fyd8Kv": {
        "uid": "xxxxxxxxxxxxxx",
        "name": "精卫鸟.",
        "intro": "一只小小鸟，订阅我的没几个人，所以你们都是特殊的。。"
      }
    }
  }
}
```

### reply 字段说明

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `note_ids` | array | 笔记 ID 列表（有序）。展示列表时优先遍历该字段。 | - |
| `notes` | map[string]NoteInfo | 笔记信息 `Map`，键为笔记 ID，值为笔记信息。 | [`NoteInfo - 笔记信息`](../mo-shared/references/mocli-output-schema.md#note-info) |
| `users` | map[string]UserInfo | 用户信息 `Map`，键为用户 UID，值为用户信息。展示作者时用 `notes[note_id].uid` 到该 Map 中查找。 | [`UserInfo - 用户信息`](../mo-shared/references/mocli-output-schema.md#user-info) |

## mocli note mine [--filter] [--count] [--recent]

本命令用于查看当前认证用户创作的笔记列表，可能包含私有、部分公开、完全公开和付费笔记。它不同于 `mocli note homepage`：`mine` 面向当前认证用户的创作管理视角，`homepage` 面向主页公开展示视角。用户只说“我的笔记”时优先使用本命令；如果用户明确说“我的主页笔记/公开主页”，使用 `homepage`。

可选参数：

  * `--filter string`：筛选类型。支持：`all(全部笔记)`、`fee(付费笔记)`、`pub(完全公开)`、`cond-pub(部分公开)`、`priv(私有)`。默认：`all`。
  * `--count int`：返回笔记数量。范围：`1-100`。默认：`20`。
  * `--recent string`：最近时间筛选，支持天(d)和小时(h)，如：`2h`、`1d`，范围：`1h-15d`。

### 使用示例

  * 看看我最近 3 天写的笔记 `mocli note mine --recent 3d`
  * 给我 10 篇我自己的付费笔记 `mocli note mine --filter fee --count 10`
  * 给我 20 篇我自己的私有笔记（近 3 天） `mocli note mine --filter priv --count 20 --recent 3d`

### 输出示例

```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "note_ids": [
      "3jv1AiAjXJ4aBC83LqdMC",
      "ZVDGaChlin5voLpIp_9TM"
    ],
    "notes": {
      "3jv1AiAjXJ4aBC83LqdMC": {
        "note_id": "3jv1AiAjXJ4aBC83LqdMC",
        "uid": "Qiz5hxiY5wr5L76fyd8Kv",
        "title": "最近心情",
        "brief": "笔记摘要",
        "url": "https://note.mowen.cn/detail/3jv1AiAjXJ4aBC83LqdMC?from=mocli"
      },
      "ZVDGaChlin5voLpIp_9TM": {
        "note_id": "ZVDGaChlin5voLpIp_9TM",
        "uid": "Qiz5hxiY5wr5L76fyd8Kv",
        "title": "大家好呀，我是小白",
        "brief": "笔记摘要",
        "url": "https://note.mowen.cn/detail/ZVDGaChlin5voLpIp_9TM?from=mocli"
      }
    },
    "users": {
      "Qiz5hxiY5wr5L76fyd8Kv": {
        "uid": "xxxxxxxxxxxxxx",
        "name": "精卫鸟.",
        "intro": "一只小小鸟，订阅我的没几个人，所以你们都是特殊的。。"
      }
    }
  }
}
```

### reply 字段说明

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `note_ids` | array | 笔记 ID 列表（有序）。展示列表时优先遍历该字段。 | - |
| `notes` | map[string]NoteInfo | 笔记信息 `Map`，键为笔记 ID，值为笔记信息。 | [`NoteInfo - 笔记信息`](../mo-shared/references/mocli-output-schema.md#note-info) |
| `users` | map[string]UserInfo | 用户信息 `Map`，键为用户 UID，值为用户信息。展示作者时用 `notes[note_id].uid` 到该 Map 中查找。 | [`UserInfo - 用户信息`](../mo-shared/references/mocli-output-schema.md#user-info) |


# 展示规则

  ** 参考 ** [`公共展示规则`](../mo-shared/SKILL.md#reply-display-rules)
