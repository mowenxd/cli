---
name: mo-remark
version: 0.1.0
description: "为墨问 UID 设置备注名(remark -> uid)、移除备注名 以及 使用备注名来检索墨问 UID，一个墨问 UID 可以设置多个备注名。在一些自然语言场景里，如“获取'老池'最新的墨问笔记” “查看'二爷'在墨问上的简介”，如果已经识别出其中的'老池'、'二爷'是人名，可以先尝试使用 `remark` 指令检索出对应的 UID，再做后续操作。设置、移除、检索备注名时触发。"
metadata:
  requires:
    bins: ["mocli"]
  cliHelp: "mocli remark --help"
---

# 前置约束

**CRITICAL — 先阅读 [`共享规则`](../mo-shared/SKILL.md)，其中包含 `mocli` 初始化、认证、输出解析以及安全规则**

# mocli remark - 墨问备注(remark -> uid)

本技能用于为墨问 UID 设置备注名(remark -> uid)、移除备注名 以及 使用备注名来检索墨问 UID，一个墨问 UID 可以设置多个备注名。

## 使用原则

  * 当用户用人名、昵称、备注名指代某个墨问用户，且后续命令需要 UID 时，优先执行 `mocli remark list --keyword <name>` 查找 UID。
  * 如果备注命中唯一 UID，可直接把该 UID 用于后续命令。
  * 如果备注命中多个 UID，展示备注名与 UID，让用户确认目标。
  * 如果备注未命中，再使用 [`mo-user`](../mo-user/SKILL.md) 搜索用户，或询问用户提供 UID。
  * `set` 和 `remove` 会修改本地备注配置，执行前必须确认用户意图。

## mocli remark set <uid> <remark>

为一个墨问 UID 设置备注名，一个 UID 可以设置多个备注名。该命令会写入本地备注配置，执行前必须确认用户确实要新增备注。

### 使用示例

  * 把 <UID> 备注成老池 `mocli remark set xxxxxx 老池`
  * 把 <UID> 备注成池老师 `mocli remark set xxxxxx 池老师`

## mocli remark remove <keyword>

移除一个或多个备注条目。`墨问 UID` 或 `备注名` 只要有一项 **完全匹配** `keyword`，对应条目就会被移除。该命令会修改本地备注配置，执行前必须确认用户确实要删除。

### 使用示例

  * 删除老池的备注 `mocli remark remove 老池`
  * 删除 <UID> 的备注 `mocli remark remove KBqt7yiVrXBa9DJIJuUm3`

## mocli remark list [--keyword string]

列出所有备注条目。可选参数 `--keyword` 用于筛选出备注名或 UID 中**包含** `keyword` 的条目。

### 使用示例

  * 查看我的备注列表 `mocli remark list`
  * 查看老池相关的备注 `mocli remark list --keyword 老池`

### 输出示例
**without keyword**
```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "remarks": {
      "me": "KBqt7yiVrXBa9DJIJuUm3",
      "myself": "KBqt7yiVrXBa9DJIJuUm3",
      "我": "KBqt7yiVrXBa9DJIJuUm3",
      "池建强": "vtv_PV1fEMBb-8_BPlmDu",
      "池老师": "vtv_PV1fEMBb-8_BPlmDu",
      "精卫鸟zzz🇨🇳": "KBqt7yiVrXBa9DJIJuUm3",
      "老池": "vtv_PV1fEMBb-8_BPlmDu"
    }
  }
}
```
**with --keyword 池**
```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "remarks": {
      "池建强": "vtv_PV1fEMBb-8_BPlmDu",
      "池老师": "vtv_PV1fEMBb-8_BPlmDu",
      "老池": "vtv_PV1fEMBb-8_BPlmDu"
    }
  }
}
```

### reply 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| `remarks` | map[string]string | key 备注名，value 墨问 UID |

### 结果解析规则

  * `remarks` 的 key 是备注名，value 是墨问 UID。
  * 同一个 UID 可能对应多个备注名；展示时可按 UID 合并，减少重复。
  * 作为后续命令参数时，只使用 UID，不要把备注名传给需要 UID 的参数。
  * 如果 `remarks` 为空，说明没有匹配备注，不要猜测 UID。

# 展示规则

  ** 参考 ** [`公共展示规则`](../mo-shared/SKILL.md#reply-display-rules)
