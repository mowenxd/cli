---
name: mo-user
version: 0.1.0
description: "墨问用户。当搜索用户时触发。"
metadata:
  requires:
    bins: ["mocli"]
  cliHelp: "mocli user --help"
---

# 前置约束

**CRITICAL — 先阅读 [`共享规则`](../mo-shared/SKILL.md)，其中包含 `mocli` 初始化、认证、输出解析以及安全规则**

# mocli user - 墨问用户

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
  * 如果没有结果，说明未找到匹配用户，并建议用户提供更准确的昵称、UID 或搜索范围。

# 展示规则

  ** 参考 ** [`公共展示规则`](../mo-shared/SKILL.md#reply-display-rules)
