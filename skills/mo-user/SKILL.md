---
name: mo-user
version: 0.1.0
description: "墨问用户。当搜索用户、查找 UID、获取用户信息、用户简介、描绘用户画像时触发。"
metadata:
  requires:
    bins: ["mocli"]
  cliHelp: "mocli user --help"
---

# 前置约束

**CRITICAL — 先阅读 [`共享规则`](../mo-shared/SKILL.md)，其中包含 `mocli` 初始化、认证、输出解析以及安全规则**

# mocli user - 墨问用户

## mocli user info --uid [--note]

本命令用于获取指定墨问用户的信息。`--uid` 是必填参数；`--note` 通过额外返回用户主页上的少量笔记样本，帮助 Agent 总结用户画像。

### 使用时机

  * 当用户明确要“查看用户信息/获取用户资料/查某个 UID 的用户详情”时使用本命令。
  * 当用户已经提供 UID，并希望查看该用户的基础资料、关注数、粉丝数或笔记数量时使用本命令。
  * 当用户希望了解该用户的创作领域、创作方向、热门作品、推出过哪些专栏/合集、是否有付费内容等画像信息时，加上 `--note` 获取样本后再总结。
  * 当用户明确查询某一个用户的资料或信息时，默认使用 `--note`；这样除基础资料外，还能更完整地描绘这个用户“是个什么样的创作者”。
  * 如果用户只提供昵称、姓名或备注名，先按 [`mo-shared`](../mo-shared/SKILL.md) 的通用流程解析 UID：优先使用 [`mo-remark`](../mo-remark/SKILL.md)，未命中时再使用 `mocli user search` 或询问用户补充 UID。

可选参数：

  * `--uid string`：目标用户 UID（必填）。
  * `--note`：包含用户主页少量笔记样本，用于辅助总结用户画像。CLI 默认不包含；Agent 在明确查询单个用户资料时默认带上。

### 使用示例

  * 获取 UID 为 `Qiz5hxiY5wr5L76fyd8Kv` 的用户信息/简介 `mocli user info --uid "Qiz5hxiY5wr5L76fyd8Kv" --note`
  * 介绍下墨问「二爷」`mocli user info --uid "Qiz5hxiY5wr5L76fyd8Kv" --note`
  * 看看墨问「老池」是个怎样的创作者 `mocli user info --uid "Qiz5hxiY5wr5L76fyd8Kv" --note`

### 输出示例

```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "info": {
      "uid": "Qiz5hxiY5wr5L76fyd8Kv",
      "name": "精卫鸟.",
      "intro": "一只小小鸟，订阅我的没几个人，所以你们都是特殊的。。",
      "regist_at": 1700000000
    },
    "counter": {
      "user_follow": 12,
      "user_follower": 345,
      "note_pub": 28,
      "note_fee": 3,
      "note_album": 2
    },
    "note_idx": {
      "note_top": ["note-top-1"],
      "note_pub": ["note-pub-1", "note-pub-2"],
      "note_fee": ["note-fee-1"],
      "note_album": ["note-album-1"],
      "note_popular": ["note-popular-1"]
    },
    "notes": {
      "note-top-1": {
        "note_id": "note-top-1",
        "uid": "Qiz5hxiY5wr5L76fyd8Kv",
        "title": "置顶笔记",
        "brief": "这是一条置顶笔记摘要",
        "url": "https://note.mowen.cn/detail/note-top-1?from=mocli"
      }
    }
  }
}
```

### reply 字段说明

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `info` | UserInfo | 目标用户基础信息。 | [`UserInfo - 用户信息`](../mo-shared/references/mocli-output-schema.md#user-info) |
| `counter` | object | 用户计数信息，包含关注数、粉丝数、公开笔记数、付费笔记数和合集数。 | - |
| `note_idx` | object | 用户主页少量笔记样本的分类索引。仅使用 `--note` 时返回；每个分类通常只返回前若干条，不代表完整列表。 | - |
| `notes` | map[string]NoteInfo | 笔记样本信息 `Map`，键为笔记 ID，值为笔记信息。仅使用 `--note` 时返回，用于辅助判断创作方向。 | [`NoteInfo - 笔记信息`](../mo-shared/references/mocli-output-schema.md#note-info) |

#### counter 子字段

| 字段 | 说明 |
|------|------|
| `user_follow` | 目标用户关注的人数，可辅助判断其信息来源和社交活跃度。 |
| `user_follower` | 关注目标用户的人数，可辅助判断其受众规模和影响力。 |
| `note_pub` | 公开笔记数量，表示用户公开创作的规模。 |
| `note_fee` | 付费笔记数量，表示用户是否有付费内容供给以及付费内容规模。 |
| `note_album` | 合集/专栏数量，表示用户是否围绕主题做系列化内容沉淀。 |

#### note_idx 子字段

| 字段 | 说明 |
|------|------|
| `note_top` | 置顶笔记样本，通常代表用户主动突出展示的内容，可优先用于判断创作者自我定位。 |
| `note_pub` | 公开笔记样本，反映用户近期或主页常规公开创作内容。 |
| `note_fee` | 付费笔记样本，反映用户的付费栏目、付费主题或商业化内容方向。 |
| `note_album` | 合集/专栏笔记样本，反映用户做过哪些系列化主题、课程、专栏或内容集合。 |
| `note_popular` | 热门笔记样本，反映较受读者关注的内容方向，可辅助判断受众偏好。 |

### 结果解析规则

  * 展示用户资料时，优先展示 `reply.info.name`、`reply.info.uid`、`reply.info.intro`。
  * 展示计数时，从 `reply.counter` 读取关注数、粉丝数、公开笔记数、付费笔记数和合集数；字段缺失时不要编造。
  * 明确查询单个用户资料时，默认执行 `mocli user info --uid <uid> --note`，除非用户要求只看基础信息或要节省请求成本。
  * 使用 `--note` 后，不要把 `note_idx` / `notes` 当作完整首页笔记列表；它们只是画像采样数据，每个分类下通常只覆盖前若干条。
  * 画像总结应综合 `reply.info`、`reply.counter`、`reply.note_idx` 和 `reply.notes`：从标题、摘要、合集/付费分类和热门/置顶样本中概括创作领域、内容方向、专栏/合集和付费内容特征。
  * 向用户输出时，优先给出总结性画像；可少量引用代表性笔记标题作为依据，但不要逐条罗列为“首页笔记列表”。
  * 如果 `--note` 后 `note_idx` 或 `notes` 为空，明确说明“没有返回可用于画像的笔记样本”，不要用搜索或主页列表结果补写。

### 展示建议

  * 基础资料：展示 `info.name`、`info.uid`、`info.intro`；简介为空时说明用户未填写简介，不要自行补写。
  * 注册时间：展示 `info.regist_at`；如果为空或为 `0`，跳过即可。
  * 会员信息：如果 `info.member.is_member` 为真，可简要展示会员状态；不要展示或推断会员权益、付费金额等未返回信息。
  * 计数信息：关注数、粉丝数、公开笔记数、付费笔记数、合集数从 `counter` 读取；字段缺失时不要编造。
  * 创作画像：使用 `--note` 返回的 `note_idx` 和 `notes` 做采样总结，优先参考置顶、热门、合集/专栏、付费笔记样本的标题和摘要。
  * 代表性内容：可按 `note_idx.note_top`、`note_idx.note_popular`、`note_idx.note_album`、`note_idx.note_fee`、`note_idx.note_pub` 的顺序挑选少量笔记标题和链接作为依据；同一笔记 ID 重复出现时只展示一次。
  * 展示笔记时，尽量把标题做成链接，或在标题旁附带 `notes[note_id].url`；缺少链接时再只展示标题和笔记 ID。
  * 样本边界：`note_idx` / `notes` 只是主页少量样本，不代表完整主页、全部作品或完整付费内容列表；不要用样本数量替代 `counter` 中的计数。
  * 字段缺失处理：`counter`、`note_idx`、`notes`、`info.member` 都可能为空；展示时跳过缺失部分，并避免为了补全画像而对多个样本循环调用 `mocli user info --uid ... --note`。

## mocli user search [--keyword] [--count] [--filter]

本命令用于按关键词搜索墨问用户。`--keyword` 是必填参数；`--filter` 用于限定搜索范围（全部、我关注的人、关注我的人、互相关注的人）。

### 使用时机

  * 当用户明确要“搜索用户/找人/查某个墨问用户”时使用本命令。
  * 当其它技能需要 UID，而 [`mo-remark`](../mo-remark/SKILL.md) 未命中备注时，可用本命令辅助查找候选用户。
  * 如果搜索结果有多个相似用户，不要擅自选择；展示候选用户的 `name`、`uid`、`intro`，请用户确认。

可选参数：

  * `--keyword string`：搜索关键词（必填）。
  * `--count int`：返回用户数量。范围：`1-100`。默认：`20`。
  * `--filter string`：搜索范围。支持：`all(全部)`、`following(我关注的人)`、`follower(关注我的人)`、`friend(好友，即相互关注的人)`。默认：`all`。

### 使用示例

  * 在墨问中搜索叫「老池」的用户 `mocli user search --keyword "老池"`
  * 在墨问中搜索 10 个名字里包含「AI」的用户 `mocli user search --keyword "AI" --count 10`
  * 在我的墨问关注列表中搜索叫「二爷」的用户 `mocli user search --keyword "二爷" --filter following`
  * 在我的墨问好友中搜索叫「设计」的用户 `mocli user search --keyword "设计" --filter friend`

### 输出示例

```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "uids": [
      "Qiz5hxiY5wr5L76fyd8Kv",
      "9z8YxxxxxxXx9xXxXxXxX"
    ],
    "users": {
      "Qiz5hxiY5wr5L76fyd8Kv": {
        "uid": "Qiz5hxiY5wr5L76fyd8Kv",
        "name": "精卫鸟.",
        "intro": "一只小小鸟，订阅我的没几个人，所以你们都是特殊的。。"
      },
      "9z8YxxxxxxXx9xXxXxXxX": {
        "uid": "9z8YxxxxxxXx9xXxXxXxX",
        "name": "池老师",
        "intro": "AI 产品实践者"
      }
    }
  }
}
```

### reply 字段说明

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `uids` | array | 用户 UID 列表（有序）。在需要按搜索顺序展示用户时，优先遍历该字段。 | - |
| `users` | map[string]UserInfo | 用户信息 `Map`，键为用户 UID，值为用户信息。可基于 `uids` 做有序展示，或用于快速按 UID 查询用户详情。 | [`UserInfo - 用户信息`](../mo-shared/references/mocli-output-schema.md#user-info) |

### 结果解析规则

  * 展示搜索结果时，优先按 `reply.uids` 的顺序遍历，再到 `reply.users[uid]` 获取详情。
  * 如果只有一个高置信结果，且用户后续任务需要 UID，可以直接使用该 UID 继续执行。
  * 如果有多个候选或名称相近，先展示候选并让用户确认，不要根据名称自行猜测。
  * 用户搜索、关注列表等列表场景中，不要为了充实每个条目的信息而循环调用 `mocli user info --uid ... --note`；这会触发限频并消耗 quota。只有用户明确要求分析某一个候选用户时，再对该单个 UID 调用 `user info`。
  * 如果没有结果，说明未找到匹配用户，并建议用户提供更准确的昵称、UID 或搜索范围。

# 展示规则

  ** 参考 ** [`公共展示规则`](../mo-shared/SKILL.md#reply-display-rules)
