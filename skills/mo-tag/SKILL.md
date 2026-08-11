---
name: mo-tag
version: 0.1.0
description: "墨问标签。当查看、获取、列出当前认证用户的标签、我的标签、我的笔记标签，或需要先从已有标签中挑选标签再给笔记打标签时触发。不负责修改某篇笔记标签；笔记标签管理走 mo-note。"
metadata:
  requires:
    bins: ["mocli"]
  cliHelp: "mocli tag --help"
---

# 前置约束

**CRITICAL — 先阅读 [`共享规则`](../mo-shared/SKILL.md)，其中包含 `mocli` 初始化、认证、输出解析以及安全规则**

# mocli tag - 墨问标签

本技能用于读取 `当前认证用户` 的标签列表。当前只支持获取我的笔记标签，不会创建、删除、重命名或绑定标签。

## 命令选择规则

* 用户要“查看我的标签/获取我的标签/列出我的笔记标签/我有哪些标签”时，使用 `mocli tag mine`。
* 用户要“从已有标签里选出 X 个标签，再给某篇笔记打标签/改标签”时，先使用 `mocli tag mine` 获取候选标签，再结合 [`mo-note`](../mo-note/SKILL.md) 的 `mocli note tag` 完成写入。
* 用户没有说明标签类型时，默认按笔记标签处理，即使用 `--filter note` 或省略 `--filter`。
* 用户要“给某篇笔记加标签/删除某篇笔记标签/覆盖某篇笔记标签”时，不使用本技能，改用 [`mo-note`](../mo-note/SKILL.md) 的 `mocli note tag`。
* 用户要“创建一个空标签/重命名标签/删除标签本身”时，说明当前 CLI 暂不支持该能力，不要用 `mocli tag mine` 假装执行写入。

## mocli tag mine [--filter]

本命令用于获取当前认证用户的标签列表。它是读取操作，不会修改任何笔记或标签。

可选参数：

  * `--filter string`：标签类型。当前只支持 `note`，表示我的笔记标签；不传时默认也是 `note`。

### 使用原则

  * 默认执行 `mocli tag mine` 即可；只有需要显式表达过滤条件时才加 `--filter note`。
  * 如果用户传入或要求非 `note` 的过滤条件，说明当前只支持 `note`，不要尝试其它值。
  * 执行后按共享规则解析顶层 `code`、`status`、`reason`；成功时展示 `reply.tags`，失败时展示 `reason`、`msg`、`meta.hints` 等可执行信息。
  * 如果 `reply.tags` 为空，明确说明当前没有返回标签，不要编造标签名。

### 使用示例

  * 查看我的标签 `mocli tag mine`
  * 查看我的笔记标签 `mocli tag mine --filter note`

### 从已有标签中选择后给笔记打标签

当用户希望“从已有标签中选 X 个标签给某篇笔记打标签”时，按以下流程处理：

  * 先执行 `mocli tag mine` 获取已有标签候选。
  * 按用户要求筛选或展示候选标签；如果用户只说“选 X 个”，但没有给筛选规则，先展示候选并请用户确认具体标签，不要擅自挑选。
  * 用户确认标签后，切换到 [`mo-note`](../mo-note/SKILL.md) 执行 `mocli note tag`。用户说“打上/追加这些标签”时用 `--append`；用户说“标签就设为这些/只保留这些”时用 `--reset`。
  * 写入前仍需按 `mo-note` 规则确认目标笔记 ID、操作类型和最终标签列表。

示例流程：

```bash
mocli tag mine
mocli note tag --note-id note-123 --append "AI,产品思考"
```

### 输出示例

```json
{
  "code": 0,
  "status": "OK",
  "reply": {
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
| `tags` | array | 当前认证用户的标签列表。当前只返回笔记标签。 |
| `tags[].id` | integer | 标签 ID，可用于精确识别同名或后续接口扩展。 |
| `tags[].name` | string | 标签名称，通常是展示给用户的主要字段。 |

### 展示建议

  * 标签较少时，逐条展示 `name`，可在括号中附带 `id`。
  * 标签较多时，用简洁列表或表格展示 `name` 和 `id`。
  * 用户只是想知道“有哪些标签”时，优先展示标签名；除非用户需要脚本化处理，否则不要让 ID 抢占主要展示空间。

# 展示规则

  ** 参考 ** [`公共展示规则`](../mo-shared/SKILL.md#reply-display-rules)
