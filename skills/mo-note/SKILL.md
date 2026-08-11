---
name: mo-note
version: 0.1.0
description: "墨问笔记。当创建笔记、编辑笔记、设置笔记、管理笔记标签、查看笔记详情及评论/引用摘要上下文、查看某人的主页笔记列表、我的笔记列表、搜索笔记时触发。"
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
* 用户要“编辑/修改/更新已有墨问笔记正文”时，使用 `mocli note edit`。这是写入操作，执行前必须确认目标笔记 ID、完整替换后的正文来源、已完成覆盖风险强制门禁，以及用户确实要覆盖原笔记正文。
* 用户要“设置/修改笔记隐私/公开或私有某篇笔记/设置部分公开规则”时，使用 `mocli note set`。这是写入操作，执行前必须确认目标笔记 ID 和隐私设置；当前 `note set` 只支持隐私设置，不用于修改正文、标签或发布内容。
* 用户要“设置/追加/移除/覆盖某篇笔记的标签”时，使用 `mocli note tag`。这是写入操作，执行前必须确认目标笔记 ID 和标签操作；`--reset` 是覆盖全量标签，会忽略同次命令里的 `--append` 和 `--remove`。
* 用户要“查看某篇笔记详情/笔记信息/引用笔记/评论”且已经有笔记 ID 时，使用 `mocli note info --show-comment --show-refer`。这是读取操作；只有在编辑笔记前需要获取当前 NoteAtom 时才额外添加 `--show-atom`，其它场景避免使用 `--show-atom`。
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
  * 如果用户选择了较多的文件进行上传，提醒用户文件上传是有配额的，“默认配额 20 次/天，Pro 会员用户 200 次/天”，避免超出限制。

## mocli note create [--file] [--publish] [--tags]

本命令用于创建墨问笔记。创建笔记属于写入操作，执行命令前必须向用户确认要创建的内容来源、是否自动发布、以及标签。

`mocli note create` 接收的是墨问笔记正文语法树，不要把 Markdown、HTML、纯文本或自然语言描述直接交给命令。无论用户提供的是文件还是一段自然语言，都应先参考 [`mo-note-content - 墨问笔记正文语法树`](../mo-shared/references/mo-note-content-schema.md) 格式化为正文树 JSON，再根据内容复杂度和后续编辑可能性，选择通过 `--file` 或 stdin 传入。

可选参数：

  * `--file string`：从文件读取笔记内容。建议使用绝对路径，文件内容必须是格式化后的墨问笔记正文语法树 JSON。
  * `--publish`：创建后自动发布笔记。只有用户明确要求“发布/公开/创建后发布”时才添加。
  * `--tags string`：逗号分隔的标签列表，最多 5 个标签；创建后的标签管理参考 `mocli note tag`。

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

## mocli note edit [--note-id] [--file]

本命令用于编辑已有墨问笔记的正文。编辑笔记属于写入操作，执行命令前必须向用户确认目标笔记 ID、完整替换后的正文来源，以及是否确认用新正文覆盖原正文。

`mocli note edit` 接收的是完整的新墨问笔记正文语法树，不是局部 diff，也不是 Markdown、HTML、纯文本或自然语言描述。无论用户提供的是文件、粘贴正文还是“把某段改成某段”的自然语言指令，都应先整理成完整的正文树 JSON，再通过 `--file` 或 stdin 传入。正文树格式仍参考 [`mo-note-content - 墨问笔记正文语法树`](../mo-shared/references/mo-note-content-schema.md)。

墨问笔记也可以在 Web 端、小程序端创建或编辑，这些编辑器可能产生当前 CLI 正文语法树尚未支持的节点，例如`视频`、`多图画廊`等。`mocli note edit` 通过 OpenAPI 覆盖提交时，不支持的节点可能被服务端过滤，导致原笔记中的对应内容丢失。

### 覆盖风险强制门禁

  * 执行任何 `mocli note edit` 前，必须先检查最终要提交的完整正文树；没有完成检查时，不要执行编辑命令。
  * 支持节点类型仅包括：`doc`、`paragraph`、`text`、`quote`、`note`、`image`、`audio`、`pdf`、`codeblock`；支持 marks 类型仅包括：`highlight`、`link`、`bold`、`code`。
  * 检查范围包括正文树里所有节点的 `type`，以及所有 `marks[].type`；从 `note info --show-atom` 获取 `reply.info.content.ast` 后，也必须先做这一步。
  * 如果发现不支持的 `type` 或 `marks[].type`，例如 `gallery`、`video`、`heading`、`h1`、`h2`、`h3`，立即停止，不要执行 `mocli note edit`。先列出不支持节点类型和可识别的节点信息，明确提示“覆盖提交后这些节点可能被过滤并造成数据丢失”，等待用户明确确认仍要继续覆盖后，才可以执行编辑命令。
  * 风险提示必须发生在首次执行 `mocli note edit` 之前；不要先覆盖提交，再事后解释或道歉。

可选参数：

  * `--note-id string`：要编辑的目标笔记 ID。必填。
  * `--file string`：从文件读取编辑后的完整笔记内容。文件内容必须是格式化后的墨问笔记正文语法树 JSON。

### 编辑前确认流程

  * 用户已经提供明确笔记 ID 和完整新正文时，复述目标笔记 ID 和正文来源，确认会覆盖原笔记正文后再执行。
  * 用户只提供笔记链接时，先从链接中提取笔记 ID；无法稳定提取时，请用户补充笔记 ID。
  * 用户只说“修改我最新的笔记/修改某篇笔记”但没有给笔记 ID 时，先用 `mocli note mine` 或用户指定的上下文帮助定位候选笔记，再让用户确认具体笔记 ID。
  * 用户提出局部修改要求时，先获得完整正文树 JSON，再基于完整正文树生成替换后的新正文；不要把局部修改片段直接传给 `mocli note edit`。
  * 编辑前必须完成“覆盖风险强制门禁”；发现不支持节点或 marks 时，必须先向用户做阻塞式风险确认，不能把该提示留到执行后。

### 内容格式化流程

  * 用户提供已经格式化好的正文树 JSON：先做 JSON 语法校验，并确认顶层是 `{ "type": "doc", "content": [...] }`。
  * 用户提供 Markdown、HTML、text 文件或粘贴正文：按 `mocli note create` 的内容格式化流程转换为完整正文树 JSON；其中 Markdown/HTML 资源引用同样按“正文资源引用处理流程”处理。
  * 用户要求基于某篇现有笔记做局部修改，且当前上下文没有原始完整正文树时，优先使用 `mocli note info --note-id <note-id> --show-atom` 获取当前 `reply.info.content.ast` 作为编辑基础；如果无法获取完整正文树，再让用户提供原文、导出的正文树 JSON，或补充足够内容来生成完整替换稿。
  * 从 `reply.info.content.ast` 或用户文件读取完整正文树后，要递归检查节点 `type` 和 `marks[].type`；支持范围以“覆盖风险强制门禁”中的列表和 [`mo-note-content - 节点类型`](../mo-shared/references/mo-note-content-schema.md#节点类型) 为准。
  * 临时 JSON 文件只用于命令输入，不要把 API Key 或其它敏感信息写入正文文件。

### 使用原则

  * `mocli note edit` 只编辑正文内容，不处理发布状态、标签或隐私设置；这些设置不要混入正文 JSON。
  * 编辑是完整正文覆盖，不是追加、补丁或局部更新；执行前必须让用户理解这一点。
  * `--show-atom` 只用于编辑前读取已有笔记的当前正文树；读取后仍要生成完整的新正文树，并用 `mocli note edit` 覆盖提交。
  * 内容复杂、较长、来自文件或可能需要反复调整时，应保存为文件并使用 `--file <path>`。
  * 内容简单、较短，且用户已经确认可以一次性覆盖时，可以通过 stdin 传入格式化后的正文树 JSON。
  * 执行后按共享规则解析顶层 `code`、`status`、`reason`；成功时展示返回的笔记 ID，失败时展示 `reason`、`msg`、`meta.hints` 等可执行信息。

### 使用示例

  * 从文件编辑已有笔记 `mocli note edit --note-id note-123 --file /path/to/note-body.json`
  * 通过 stdin 编辑已有笔记 `mocli note edit --note-id note-123 < /path/to/note-body.json`
  * 通过管道编辑一篇短文本笔记 `printf '%s' '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"更新后的完整正文"}]}]}' | mocli note edit --note-id note-123`

## mocli note set [--note-id] [--privacy] [--disable-share] [--expire-at]

本命令用于设置已有墨问笔记的隐私规则。设置笔记属于写入操作，执行命令前必须向用户确认目标笔记 ID、隐私类型，以及规则公开时的分享和过期设置。

当前 `mocli note set` 只承载 OpenAPI 已释放的笔记隐私设置能力；不要用它修改正文、标签、标题或其它元数据。

可选参数：

  * `--note-id string`：要设置的目标笔记 ID。必填。
  * `--privacy string`：隐私类型。必填，支持 `public`、`private`、`rule`。
  * `--disable-share`：仅在 `--privacy rule` 时生效，表示禁止分享和转发。默认不添加，即允许分享和转发。
  * `--expire-at int`：仅在 `--privacy rule` 时生效，秒级 Unix 时间戳。默认 `0` 表示永久可见；必须是非负整数。

### 隐私类型说明

  * `public`：完全公开。不要附加 `--disable-share` 或 `--expire-at`，即使传入也会被业务层忽略。
  * `private`：私有。不要附加 `--disable-share` 或 `--expire-at`，即使传入也会被业务层忽略。
  * `rule`：部分公开/规则公开。可以用 `--disable-share` 禁止分享转发，并用 `--expire-at` 设置公开截止时间；`--expire-at 0` 表示永久可见。

### 设置前确认流程

  * 用户已经提供明确笔记 ID 和隐私类型时，复述目标笔记 ID、隐私类型和规则项，确认后再执行。
  * 用户只提供笔记链接时，先从链接中提取笔记 ID；无法稳定提取时，请用户补充笔记 ID。
  * 用户只说“把我最新的笔记设为公开/私有/部分公开”但没有给笔记 ID 时，先用 `mocli note mine` 或用户指定的上下文帮助定位候选笔记，再让用户确认具体笔记 ID。
  * 用户要求“部分公开/规则公开”但没有说明是否禁止分享或过期时间时，默认允许分享且永久可见；如果语义可能影响用户预期，应简短确认。

### 使用原则

  * 用户只说“公开这篇笔记”，使用 `--privacy public`。
  * 用户只说“设为私有/仅自己可见”，使用 `--privacy private`。
  * 用户只说“部分公开/规则公开”，使用 `--privacy rule`，不自动添加 `--disable-share`，`--expire-at` 默认 0。
  * 用户给出自然语言过期时间时，应换算为秒级 Unix 时间戳后传入 `--expire-at`，并在执行前把换算后的具体时间复述给用户确认。
  * 执行后按共享规则解析顶层 `code`、`status`、`reason`；成功时展示返回的笔记 ID，失败时展示 `reason`、`msg`、`meta.hints` 等可执行信息。

### 使用示例

  * 将笔记设为完全公开 `mocli note set --note-id note-123 --privacy public`
  * 将笔记设为私有 `mocli note set --note-id note-123 --privacy private`
  * 将笔记设为部分公开且允许分享 `mocli note set --note-id note-123 --privacy rule`
  * 将笔记设为部分公开且禁止分享 `mocli note set --note-id note-123 --privacy rule --disable-share`
  * 将笔记设为部分公开并设置过期时间 `mocli note set --note-id note-123 --privacy rule --expire-at 1893456000`

## mocli note tag [--note-id] [--reset] [--append] [--remove]

本命令用于管理已有墨问笔记的标签。标签管理属于写入操作，执行命令前必须向用户确认目标笔记 ID、标签名称和操作类型。

可选参数：

  * `--note-id string`：要管理标签的目标笔记 ID。必填。
  * `--reset string`：逗号分隔的标签列表，覆盖该笔记的全部已有标签；如果同次命令设置了 `--append` 或 `--remove`，它们会被忽略。
  * `--append string`：逗号分隔的标签列表，追加到该笔记现有标签；使用 `--reset` 时会被忽略。
  * `--remove string`：逗号分隔的标签列表，从该笔记现有标签中移除；使用 `--reset` 时会被忽略。

### 标签操作说明

  * `--reset` 表示全量覆盖，适合用户说“把标签设为/改成/只保留这些标签”。
  * `--append` 表示增量追加，适合用户说“给这篇笔记加上/补充标签”。
  * `--remove` 表示增量移除，适合用户说“删除/去掉某个标签”。
  * `--append` 和 `--remove` 可以在同一次命令中组合使用；同一标签既追加又移除时，服务端会按自己的规整规则处理，执行前应尽量提醒用户避免这种歧义。
  * 标签用英文逗号拼接；空标签会被忽略，重复标签会被去重。单次 `--reset`、`--append`、`--remove` 各最多 20 个标签。

### 设置前确认流程

  * 用户已经提供明确笔记 ID 和标签操作时，复述目标笔记 ID、操作类型和标签列表，确认后再执行。
  * 用户只提供笔记链接时，先从链接中提取笔记 ID；无法稳定提取时，请用户补充笔记 ID。
  * 用户只说“给我最新的笔记加标签/改标签”但没有给笔记 ID 时，先用 `mocli note mine` 或用户指定的上下文帮助定位候选笔记，再让用户确认具体笔记 ID。
  * 用户要求“从已有标签里选出 X 个标签再给这篇笔记打标签”时，先使用 [`mo-tag`](../mo-tag/SKILL.md) 的 `mocli tag mine` 获取当前已有标签候选；用户确认具体标签后，再执行本命令。
  * 用户同时表达“覆盖标签”和“追加/移除标签”时，优先按覆盖语义使用 `--reset`；如果语义不明确，先向用户确认。

### 使用原则

  * 用户说“标签改成 A、B”或“只保留 A、B 标签”，使用 `--reset "A,B"`。
  * 用户说“加上 A 标签/补一个 A 标签”，使用 `--append "A"`。
  * 用户说“去掉 A 标签/删除 A 标签”，使用 `--remove "A"`。
  * `mocli note create --tags` 和 `mocli note tag` 不冲突：前者只在创建新笔记时设置初始标签，后者用于管理已有笔记的标签。
  * 不要用 `mocli note set` 修改标签；`note set` 只用于隐私设置。
  * 执行后按共享规则解析顶层 `code`、`status`、`reason`；成功时展示目标笔记 ID 和操作后的标签列表，失败时展示 `reason`、`msg`、`meta.hints` 等可执行信息。

### 使用示例

  * 覆盖笔记全部标签 `mocli note tag --note-id note-123 --reset "AI,产品思考"`
  * 给笔记追加标签 `mocli note tag --note-id note-123 --append "灵感"`
  * 从笔记移除标签 `mocli note tag --note-id note-123 --remove "旧标签"`
  * 同时追加和移除标签 `mocli note tag --note-id note-123 --append "新标签" --remove "旧标签"`

### 输出示例

```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "note_id": "note-123",
    "tags": [
      {
        "id": 11,
        "name": "AI"
      },
      {
        "id": 12,
        "name": "产品思考"
      }
    ]
  }
}
```

### reply 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `note_id` | string | 目标笔记 ID。 |
| `tags` | array | 操作后的标签列表。每个标签包含 `id` 和 `name`。 |

## mocli note info [--note-id] [--show-atom] [--show-comment] [--show-refer]

本命令用于查看已有墨问笔记的详情。`note info` 是读取操作，不修改笔记内容、隐私或标签；只要用户已经提供明确笔记 ID，就可以直接执行。评论、引用索引、引用笔记简要信息都是笔记详情基础上的附加展示信息，用来帮助 Agent 给用户提供更丰富的上下文。

可选参数：

  * `--note-id string`：要查看的目标笔记 ID。必填。
  * `--show-comment`：返回笔记评论信息。默认调用 `note info` 时应添加，便于展示评论、回复和评论用户上下文。
  * `--show-refer`：返回引用和被引用笔记信息。默认调用 `note info` 时应添加，便于展示关联笔记、引用关系和上下文笔记。
  * `--show-atom`：返回完整 NoteAtom JSON 正文，仅自己的笔记会生效。只有在编辑笔记前需要获取当前正文树时才添加；其它查看详情、评论、引用等场景避免使用。

### 使用原则

  * 默认使用 `mocli note info --note-id <note-id> --show-comment --show-refer`，用评论、引用索引和引用笔记简要信息丰富展示上下文；这些附加信息不是完整评论/引用详情列表。
  * 只有编辑已存在笔记且需要获取当前完整正文树作为编辑基础时，才添加 `--show-atom`。其它查看详情、摘要、评论、引用、作者或统计场景不要添加 `--show-atom`。
  * 用户只提供笔记链接时，先从链接中提取笔记 ID；无法稳定提取时，请用户补充笔记 ID。
  * 执行后按共享规则解析顶层 `code`、`status`、`reason`；成功时展示 `reply.info`，如请求了评论或引用，再结合 `reply.comments`、`reply.users`、`reply.info.embed`、`reply.notes` 展示上下文。

### 使用示例

  * 查看笔记 `mocli note info --note-id note-123 --show-comment --show-refer`
  * 查看"某某"笔记 `mocli note info --note-id note-123 --show-comment --show-refer`
  * 介绍笔记 `mocli note info --note-id note-123 --show-comment --show-refer`
  * 介绍"某某"笔记 `mocli note info --note-id note-123 --show-comment --show-refer`
  * 为编辑前准备当前 NoteAtom `mocli note info --note-id note-123 --show-atom`

### 输出示例

```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "info": {
      "note_id": "note-123",
      "uid": "u-author",
      "title": "一篇笔记",
      "brief": "笔记摘要",
      "url": "https://note.mowen.cn/detail/note-123?from=mocli",
      "created_at": 1710000000,
      "updated_at": 1710000300,
      "public_at": 1710000600,
      "content": {
        "word_count": 128
      },
      "embed": {
        "ref": {
          "all": ["ref-1"],
          "free": ["ref-1"]
        },
        "refed": {
          "all": ["back-1"],
          "free": ["back-1"]
        }
      }
    },
    "comments": {
      "comment_ids": ["comment-1"],
      "comments": {
        "comment-1": {
          "comment_id": "comment-1",
          "uid": "u-commenter",
          "created_at": 1710000900000,
          "content_html": "评论内容"
        }
      }
    },
    "users": {
      "u-author": {
        "uid": "u-author",
        "name": "作者"
      },
      "u-commenter": {
        "uid": "u-commenter",
        "name": "评论者"
      }
    },
    "notes": {
      "ref-1": {
        "note_id": "ref-1",
        "title": "被引用的笔记",
        "url": "https://note.mowen.cn/detail/ref-1?from=mocli"
      }
    }
  }
}
```

### reply 字段说明

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `info` | NoteInfo | 笔记详情主体。引用索引位于 `info.embed.ref/refed`；仅使用 `--show-atom` 时，完整正文位于 `info.content.ast`。 | [`NoteInfo - 笔记信息`](../mo-shared/references/mocli-output-schema.md#note-info) |
| `comments` | object | 笔记评论集合。默认使用 `--show-comment` 时返回；只包含前 10 条当前身份可见评论。展示评论时优先遍历 `comments.comment_ids`，再到 `comments.comments[comment_id]` 取详情。 | 本节 [`comments 字段结构`](#comments-字段结构) |
| `users` | map[string]UserInfo | 用户信息 `Map`，键为 UID。展示作者、评论作者和被回复用户时到该 Map 中查找。 | [`UserInfo - 用户信息`](../mo-shared/references/mocli-output-schema.md#user-info) |
| `notes` | map[string]NoteInfo | 引用和被引用笔记简要信息 `Map`，键为笔记 ID。`info.embed.ref/refed` 保留全部引用索引，但本字段只附带引用和被引用各 5 条笔记的简要信息。 | [`NoteInfo - 笔记信息`](../mo-shared/references/mocli-output-schema.md#note-info) |

### comments 字段结构

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `comment_ids` | array[string] | 评论 ID 有序列表。展示评论时优先按该字段遍历。 | - |
| `comments` | map[string]CommentInfo | 评论详情 `Map`，键为评论 ID。 | [`CommentInfo - 评论信息`](../mo-shared/references/mocli-output-schema.md#comment-info) |

### 展示建议

  * 标题：`info.title`
  * 作者：优先使用 `users[info.uid].name`；如果 `users` 中没有对应用户，只展示 `info.uid`，不要猜测昵称。
  * 介绍：`info.brief`
  * 全文字数：`info.content.word_count`
  * 阅读时长：根据 `info.content.word_count` 计算，建议 300～400 字/分钟。
  * 原文链接：`info.url`
  * 展示笔记时，尽量把标题做成链接，或在标题旁附带 `url`；引用笔记也优先使用 `notes[note_id].url`。
  * 创建时间：`info.created_at`
  * 发表时间：`info.public_at`；如果为空或为 `0`，表示当前输出中没有可展示的公开发表时间。
  * 最近更新时间：`info.updated_at`
  * 计数信息：阅读数、点赞数、收藏数、分享数、评论数参考 [`NoteStat - 笔记计数`](../mo-shared/references/mocli-output-schema.md#note-stat)；引用数量不要从 `stat` 猜测，应使用 `info.embed.ref/refed` 计算。
  * 含有引用笔记多少篇：使用 `len(info.embed.ref.all)`；可结合 `notes` 展示 3-5 条引用笔记简要信息（作者、标题、链接），但 `notes` 只附带最多 5 条引用笔记简要信息，未附带的 ID 不要补写标题。
  * 被多少篇笔记引用：使用 `len(info.embed.refed.all)`；可结合 `notes` 展示 3-5 条被引用笔记简要信息（作者、标题、链接），但 `notes` 只附带最多 5 条被引用笔记简要信息，未附带的 ID 不要补写标题。
  * 历史评论：按 `comments.comment_ids` 顺序取 3-10 条，再用 `comments.comments[comment_id]` 获取详情；`comments` 只包含前 10 条当前身份可见评论，不要表述为最新评论或全部评论。
  * 评论作者：优先使用 `users[comment.uid].name`；如果评论是回复，可用 `comment.reply_uid` 到 `users` 查找被回复用户。当前 `CommentInfo` 不直接包含被回复评论的时间和内容，不要展示不存在的字段。
  * 字段缺失处理：`embed`、`comments`、`notes`、`users` 都可能为空；展示时跳过缺失部分即可，不要为了补全展示而额外使用 `--show-atom`。

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
