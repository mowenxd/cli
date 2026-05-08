---
name: mo-note
version: 0.1.0
description: "墨问笔记。当查看某人的主页笔记列表、我的笔记列表、搜索笔记时触发。"
metadata:
  requires:
    bins: ["mocli"]
  cliHelp: "mocli note --help"
---

# 前置约束

**CRITICAL — 先阅读 [`共享规则`](../mo-shared/SKILL.md)，其中包含 `mocli` 初始化、认证、输出解析以及安全规则**

# mocli note - 墨问笔记

## 命令选择规则

* 用户要“搜索某关键词相关笔记”时，使用 `mocli note search`。
* 用户要“看某人的主页/公开笔记/热门笔记/付费笔记/合集”时，使用 `mocli note homepage`。
* 用户要“看我自己的笔记/私有笔记/未公开笔记/我写过的笔记”时，使用 `mocli note mine`。
* 用户提到人名、昵称、备注名但没有给 UID 时，优先用 [`mo-remark`](../mo-remark/SKILL.md) 查 UID；未命中再考虑 `mocli user search` 或询问用户补充 UID。
* 展示笔记列表时，优先按 `reply.note_ids` 的顺序遍历，再到 `reply.notes[note_id]` 获取笔记详情，并用 `reply.notes[note_id].uid` 到 `reply.users` 获取作者信息。

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
