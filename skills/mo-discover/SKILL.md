---
name: mo-discover
version: 0.1.0
description: "墨问发现与动态。当查看自己的墨问动态（被关注、点赞、评论、收藏、关注的人有新的笔记发布）时触发。"
metadata:
  requires:
    bins: ["mocli"]
  cliHelp: "mocli disco --help"
---

# 前置约束

**CRITICAL — 先阅读 [`共享规则`](../mo-shared/SKILL.md)，其中包含 `mocli` 初始化、认证、输出解析以及安全规则**

# mocli discover - 墨问发现与动态

## mocli disco activity [--recent]

本技能用于查看 `当前认证用户` 的墨问动态，包括被点赞、被评论（或被回复）、被关注、被收藏、关注的人发布新笔记、关注的人发布付费笔记/合集等活动。该命令只读取动态，不会产生写入或删除操作。

### 使用原则

  * 用户要查看“我的动态/最近谁点赞评论关注我/关注的人发了什么”时，使用本命令。
  * 展示时必须以 `reply.events` 为主序列；每个事件用 `eid` 到 `favors`、`comments`、`follow_notes`、`follow_fee_notes` 等详情 Map 中查找补充信息。
  * 不要直接遍历详情 Map 展示动态，否则会丢失原始排序。
  * 动态详情里的笔记 ID（如 `target_id`、`note_id`、`joins`）都应到 `reply.notes` 中补齐标题、摘要和链接。
  * 动态详情里的用户 UID（如 `favor_uid`、`cmt_uid`、`note_uid`）都应到 `reply.users` 中补齐昵称。

可选参数：

  * `--recent string`：时间范围。支持：`today`、`yesterday`、`1h-24h`。不指定时，默认 `1h`。

### 使用示例

  * 查看我的最新墨问动态 `mocli disco activity`
  * 查看今天的墨问动态 `mocli disco activity --recent today`
  * 查看昨天的墨问动态 `mocli disco activity --recent yesterday`
  * 查看最近 3 小时的墨问动态 `mocli disco activity --recent 3h`
  * 查看最近 24 小时的墨问动态 `mocli disco activity --recent 24h`

### 参数选择规则

  * 用户说“今天”“今日”时，使用 `--recent today`。
  * 用户说“昨天”“昨日”时，使用 `--recent yesterday`。
  * 用户说“最近 N 小时”且 `N` 在 `1-24` 范围内时，使用 `--recent Nh`，例如 `--recent 6h`。
  * 用户给出的小时数超过 `24h`，或要求按天数筛选但不是 `today/yesterday` 时，说明当前命令只支持 `today`、`yesterday`、`1h-24h`，并询问用户是否改用受支持范围。

### 输出示例

```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "events": [
      {
        "eid": 2049020870318682148,
        "uid": "gMiYUcJU0GjBfKIMTmzeN",
        "type": 6,
        "sub_type": 1,
        "happened_at": 1777305989850
      }
    ],
    "follows": {},
    "favors": {
      "2048799112739434497": {
        "favor_uid": "2dsiQjSN3hrWhQu3W8nEx",
        "target_uid": "vtv_PV1fEMBb-8_BPlmDu",
        "target_id": "rdIP8aEyBDz_c38q3h0TC"
      }
    },
    "collects": {},
    "comments": {
      "2048795933738192897": {
        "cmt_uid": "0W1rAu9TJPU9ZFy_eOgqv",
        "cmt_id": "td2dQ5WXhKKD-h4PeN-Ks",
        "cmt_p_uid": "",
        "cmt_p_id": "",
        "target_uid": "vtv_PV1fEMBb-8_BPlmDu",
        "target_id": "rdIP8aEyBDz_c38q3h0TC"
      },
      "2048797711351394305": {
        "cmt_uid": "ua2x-_O32fcaYuURPi1Eo",
        "cmt_id": "eITFJYXSaElv_vIrVIeYs",
        "cmt_p_uid": "vtv_PV1fEMBb-8_BPlmDu",
        "cmt_p_id": "Eh8fTXFO-442JBUEmWCk4",
        "target_uid": "vtv_PV1fEMBb-8_BPlmDu",
        "target_id": "45JqKC3Y5PvSCj0htokSW"
      }
    },
    "trades": {},
    "follow_notes": {
      "2049020870318682148": {
        "note_id": "KS1x1z500bkEZa-PhsfQG",
        "note_uid": "0PoXMWF-V43tuXOOu-7Yw",
        "joins": []
      },
      "2048900500857122935": {
        "note_id": "iHQFI49mKnP8RclPopQSK",
        "note_uid": "_hA8gaYCCpwPkfpPhA4cA",
        "joins": [
          "GCwHPvJkl5Ox4lVB7fUWH"
        ]
      }
    },
    "follow_fee_notes": {
      "2049020870318682148": {
        "note_id": "KS1x1z500bkEZa-PhsfQG",
        "note_uid": "0PoXMWF-V43tuXOOu-7Yw",
        "joins": []
      },
      "2048900500857122935": {
        "note_id": "iHQFI49mKnP8RclPopQSK",
        "note_uid": "_hA8gaYCCpwPkfpPhA4cA",
        "joins": [
          "GCwHPvJkl5Ox4lVB7fUWH"
        ]
      }
    },
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
| `events` | array | 动态事件列表（有序）。展示动态时应优先遍历该字段，再根据每条事件的 `eid` 到对应详情 Map 中取数据。 | [`ActivityEvent - 动态事件`](#activity-event) |
| `follows` | map[string]object | 关注类事件详情 `Map`，键通常为事件 `eid`。用于展示谁关注了`当前用户`。 | - |
| `favors` | map[string]ActivityEventFavor | 点赞类事件详情 `Map`，键通常为事件 `eid`。用于展示谁点赞了哪篇笔记。 | [`ActivityEventFavor - 点赞动态`](#activity-event-favor) |
| `collects` | map[string]object | 收藏类事件详情 `Map`，键通常为事件 `eid`。用于展示谁收藏了哪篇笔记。 | - |
| `comments` | map[string]ActivityEventComment | 评论类事件详情 `Map`，键通常为事件 `eid`。用于展示谁评论\回复了哪篇笔记。 | [`ActivityEventComment - 评论动态`](#activity-event-comment) |
| `trades` | map[string]object | 交易/付费相关事件详情 `Map`，键通常为事件 `eid`。用于展示谁购买了当前用户笔记或专栏 | - |
| `follow_notes` | map[string]ActivityEventFollowNote | `当前用户`关注的人发布普通笔记（joins 无数据）、更新合集（joins 有数据）事件详情 `Map`， 键为事件 `eid`。 | [`ActivityEventFollowNote - 关注笔记动态`](#activity-event-follow-note) |
| `follow_fee_notes` | map[string]ActivityEventFollowFeeNote | `当前用户`关注的人发布**付费**笔记（joins 无数据）、更新**付费**合集（joins 有数据）事件详情 `Map`，键为事件 `eid`。 | [`ActivityEventFollowFeeNote - 关注付费笔记动态`](#activity-event-follow-fee-note) |
| `notes` | map[string]NoteInfo | 笔记信息 `Map`，键为笔记 ID。动态详情中出现 `note_id`、`target_id`、`joins` 等代表笔记 id 的字段时，可用该字段补齐笔记标题、摘要、链接等信息。 | [`NoteInfo - 笔记信息`](../mo-shared/references/mocli-output-schema.md#note-info) |
| `users` | map[string]UserInfo | 用户信息 `Map`，键为用户 UID。可用于补齐事件发起人、笔记作者等用户信息。 | [`UserInfo - 用户信息`](../mo-shared/references/mocli-output-schema.md#user-info) |

<a id="activity-event"></a>
### ActivityEvent - 动态事件

| 字段 | 类型 | 说明 |
|------|------|------|
| `eid` | integer/string | 事件 ID。用于到 `follows`、`favors`、`collects`、`comments`、`trades`、`follow_notes`、`follow_fee_notes` 等详情 Map 中查找事件详情。注意 JSON 解析时可能以数字或字符串出现，做关联时统一转成字符串更稳妥。 |
| `uid` | string | 与事件相关的用户 UID。可到 `users[uid]` 获取昵称、简介等信息。 |
| `type` | integer | 事件类型。`1` 点赞事件 `2` 评论\回复事件 `3` 收藏事件 `4` 关注事件 `5` 交易事件 `6` 表示关注的人发布笔记、更新合集事件 `7` 表示关注的人发布**付费**笔记、更新**付费**合集事件 |
| `happened_at` | integer | 事件发生时间。通常为毫秒级时间戳，展示前需格式化为可读时间。 |

<a id="activity-event-favor"></a>
### ActivityEventFavor - 点赞动态

| 字段 | 类型 | 说明 |
|------|------|------|
| `favor_uid` | string | 点赞用户 UID。到 `users[favor_uid]` 获取点赞用户昵称、简介等信息。 |
| `target_uid` | string | 被点赞笔记的作者 UID。通常是当前认证用户，也可到 `users[target_uid]` 获取作者信息。 |
| `target_id` | string | 被点赞笔记 ID。到 `notes[target_id]` 获取笔记标题、摘要、链接等信息。 |

### 点赞展示规则

  * 展示文案优先使用：`users[favor_uid].name` 点赞了 `notes[target_id].title`。
  * 如果 `notes[target_id]` 不存在，仍展示 `target_id`，不要丢弃该事件。
  * 如果 `users[favor_uid]` 不存在，展示 UID。

<a id="activity-event-comment"></a>
### ActivityEventComment - 评论动态

| 字段 | 类型 | 说明 |
|------|------|------|
| `cmt_uid` | string | 评论发起者 UID。到 `users[cmt_uid]` 获取评论用户昵称、简介等信息。 |
| `cmt_id` | string | 评论 ID。当前动态列表通常只给出评论 ID，不一定包含评论正文。 |
| `cmt_p_uid` | string | 被回复评论的作者 UID。为空时表示这是对笔记的直接评论；非空时表示回复某人的评论。 |
| `cmt_p_id` | string | 被回复评论 ID。为空时表示这是对笔记的直接评论；非空时表示回复某条评论。 |
| `target_uid` | string | 被评论笔记的作者 UID。通常是当前认证用户，也可到 `users[target_uid]` 获取作者信息。 |
| `target_id` | string | 被评论笔记 ID。到 `notes[target_id]` 获取笔记标题、摘要、链接等信息。 |

### 评论展示规则

  * 当 `cmt_p_id` 为空时，展示为：`users[cmt_uid].name` 评论了 `notes[target_id].title`。
  * 当 `cmt_p_id` 非空时，展示为：`users[cmt_uid].name` 回复了 `users[cmt_p_uid].name` 在 `notes[target_id].title` 下的评论。
  * 如果评论正文不在 `comments[eid]` 中，不要编造正文；只展示评论 ID `cmt_id` 和关联笔记信息。
  * 如果 `notes[target_id]` 或相关用户信息缺失，保留 ID 展示。

<a id="activity-event-follow-note"></a>
### ActivityEventFollowNote - 关注笔记动态

| 字段 | 类型 | 说明 |
|------|------|------|
| `note_id` | string | 主笔记 ID。到 `notes[note_id]` 获取标题、摘要、链接等信息。 |
| `note_uid` | string | 主笔记作者 UID。到 `users[note_uid]` 获取作者信息。 |
| `joins` | array[string] | 关联笔记 ID 列表，通常用于合集更新的场景，表示被加入到主笔记中的笔记 ID。可逐个到 `notes[join_note_id]` 获取标题。 |

<a id="activity-event-follow-fee-note"></a>
### ActivityEventFollowFeeNote - 关注付费笔记动态

当前字段与 [`ActivityEventFollowNote`](#activity-event-follow-note) 一致，但语义独立：该结构只用于 `follow_fee_notes`，表示关注的人发布付费笔记或更新付费合集。后续如果付费动态增加价格、订单、权限等字段，应扩展本结构，而不是合并到 `ActivityEventFollowNote`。

| 字段 | 类型 | 说明 |
|------|------|------|
| `note_id` | string | 主付费笔记或付费合集 ID。到 `notes[note_id]` 获取标题、摘要、链接等信息。 |
| `note_uid` | string | 主付费笔记作者 UID。到 `users[note_uid]` 获取作者信息。 |
| `joins` | array[string] | 关联笔记 ID 列表，通常用于付费合集更新的场景，表示被加入到主付费合集中的笔记 ID。可逐个到 `notes[join_note_id]` 获取标题。 |

### 动态解析规则

  * 以 `reply.events` 的顺序作为展示顺序，不要直接遍历各类详情 Map。
  * 对每个事件，将 `eid` 转为字符串后，依次在 `follows`、`favors`、`collects`、`comments`、`trades`、`follow_notes`、`follow_fee_notes` 中查找对应详情。
  * 若命中 `favors[eid]`，展示为某用户点赞了某篇笔记；使用 `favor_uid` 找点赞用户，使用 `target_id` 找笔记，使用 `target_uid` 找笔记作者。
  * 若命中 `comments[eid]`，展示为某用户评论或回复了某篇笔记；使用 `cmt_uid` 找评论用户，使用 `target_id` 找笔记；当 `cmt_p_id` 非空时，再使用 `cmt_p_uid` 找被回复用户。
  * 若命中 `follow_notes[eid]`，展示为`当前用户`关注的人发布了新笔记或者更新了合集；使用 `note_uid` 找作者，使用 `note_id` 找笔记标题、摘要和链接；如果 `joins` 不为空，使用 `joins` 中的笔记 ID 找子笔记的标题、摘要和链接。
  * 若命中 `follow_fee_notes[eid]`，展示为`当前用户`关注的人发布了付费笔记或更新付费合集；使用 `note_uid` 找作者，使用 `note_id` 找笔记标题、摘要和链接；如果 `joins` 不为空，使用 `joins` 中的笔记 ID 找子笔记的标题、摘要和链接。
  * 若命中收藏、关注、交易等 Map，应优先使用详情对象里的 UID、note_id、target_id、comment/content 等字段，并通过 `users`、`notes` 补齐昵称和笔记标题。
  * 若某个事件没有命中任何详情 Map，不要丢弃；展示事件 ID、用户、类型、发生时间，并说明该事件类型暂未识别。
  * 时间戳 `happened_at` 可能是微秒级；格式化时需要按长度/数值判断，避免误当秒级时间戳。

### 展示建议

  * 数据较少时，按时间倒序逐条展示：时间、动态类型、用户、笔记标题、摘要、链接。
  * 数据较多时，可先按类型汇总数量，再列出最近若干条重点动态。
  * 笔记标题优先使用 `notes[note_id].title` 如果标题本身不包含「」或『』，就用『』包裹，作者优先使用 `users[note_uid].name`。
  * 对付费笔记/合集，如果 `flag.with_fee` 为 true，可明确标注“付费”。

# 展示规则

  ** 参考 ** [`公共展示规则`](../mo-shared/SKILL.md#reply-display-rules)
