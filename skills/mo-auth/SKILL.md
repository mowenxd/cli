---
name: mo-auth
version: 0.1.0
description: "墨问 Auth 认证：墨问 API Key 的配置与更新、获取当前的配置信息、获取 API Key 对应的账户，在墨问平台上的 Profile(用户信息)。当用户操作 API Key 时触发。"
metadata:
  requires:
    bins: ["mocli"]
  cliHelp: "mocli auth --help"
---

# 前置约束

**CRITICAL — 先阅读 [`共享规则`](../mo-shared/SKILL.md)，其中包含 `mocli` 初始化、认证、输出解析以及安全规则**

# mocli auth - 墨问 Auth 认证

本技能提供墨问 Auth 认证的能力，指导你如何通过 `mocli auth` 完成 API Key 的配置与更新、获取当前的配置信息、获取 API Key 对应的账户，在墨问平台上的 Profile 信息。

## 使用原则

  * 用户提供新的 API Key 或要求初始化认证时，使用 `mocli auth init --apik <api-key>`。
  * 用户明确要求更换、覆盖、重新配置 API Key 时，使用 `mocli auth init --apik <api-key> --force`。
  * 用户要查看当前认证状态时，使用 `mocli auth info`；用户还要查看账号资料时，使用 `mocli auth info --profile`。
  * 所有响应展示都必须隐藏 API Key。即使 `mocli` 返回的是脱敏值，也不要额外复述完整密钥。
  * 其它命令返回 `reason=AUTH` 时，引导用户重新提供 API Key，并使用 `init --force` 更新。

## mocli auth init --apik <api-key> [--force]

初始化 API Key。可选参数 `--force` 用于更换（覆盖）已有 API Key。该命令会写入本地认证配置，执行前需要确认用户确实要初始化或覆盖。

### 使用示例

  * 我的墨问 apikey 是 <apikey>, 帮我完成认证/初始化 `mocli auth init --apik xxxxxx`
  * 我的墨问 apikey 换了，帮我更新一下 `mocli auth init --apik xxxxxx --force`

## mocli auth info [--profile]

获取当前认证配置。可选参数 `--profile` 用于额外获取当前 API Key 对应账户在墨问平台上的 Profile（用户信息）。

### 使用示例

  * 查看我的墨问认证信息 `mocli auth info`
  * 查看我的墨问认证信息并返回我的用户资料 `mocli auth info --profile`

### 输出示例
```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "auth": {
      "api_key": "hx3jrU31xxs**********0BVvUm4ytQK",
      "mo_uid": "KBqt7yiVrXBa9DJIJuUm3"
    },
    "profile": {
      "uid": "KBqt7yiVrXBa9DJIJuUm3",
      "name": "精卫鸟zzz🇨🇳",
      "intro": "in culpa nostrud",
      "regist_at": 1662465648,
      "member": {
        "is_member": true,
        "plans": {
          "pro": {
            "type": "pro",
            "status": 64,
            "expire_at": 1852446600011
          }
        }
      }
    }
  }
}
```

### reply 字段说明

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `auth` | object | 认证信息 | [`AuthInfo - 认证信息`](../mo-shared/references/mocli-output-schema.md#auth-info) |
| `profile` | object | 用户在墨问平台上的 Profile(用户信息) | [`UserInfo - 用户信息`](../mo-shared/references/mocli-output-schema.md#user-info) |

### 展示注意事项

  * `auth.api_key` 属于敏感信息。展示认证状态时只说明“已配置”或展示脱敏片段，不要输出完整密钥。
  * `auth.mo_uid` 可展示，用于帮助用户确认当前认证账号。
  * 如果 `profile` 存在，可展示 `profile.name`、`profile.uid`、`profile.intro`、会员状态等非敏感信息。
  * 如果命令失败且 `reason=AUTH`，不要继续调用需要认证的命令；先提示用户重新初始化 API Key。

# 展示规则

  ** 参考 ** [`公共展示规则`](../mo-shared/SKILL.md#reply-display-rules)
