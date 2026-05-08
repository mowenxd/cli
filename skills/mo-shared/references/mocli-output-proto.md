# mocli - 输出协议
 默认输出格式为 JSON 格式，分为`成功响应` 和 `失败响应` 两种情况。

## 字段说明

### 关键字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | integer | 返回码，`0` 表示成功，非 `0` 表示失败。 |
| `status` | string | 状态码，成功时为 `"OK"`，失败时为 `"FAIL"` 等错误码。 |
| `meta` | object | 元数据，包含一些额外信息，如 `hints`、`alerts` 等。 `成功` `失败`时都可能会有。 |
| `reply` | object | 响应数据，包含实际的业务数据。 `成功`时，且有业务信息返回时会有。|
| `reason` | string | 错误原因，`失败`时会有。 |
| `msg` | string | 错误信息，`失败`时会有。 |  
| `api_error` | object | API 错误信息，`API 请求失败`时会有。 |

### code / status / reason 枚举

| code | status | reason | 说明 |
|------|------|------|------|
| `0` | `OK` | `-` | 成功 |
| `1` | `FAIL` | `AUTH` | 认证失败 |
| `2` | `FAIL` | `VALIDATE` | 参数校验失败 |
| `3` | `FAIL` | `NETWORK` | 网络错误 |
| `4` | `FAIL` | `API` | API 错败 |
| `5` | `FAIL` | `LOGIN` | 身份验证失败 |
| `6` | `FAIL` | `PERM` | 权限不足 |
| `7` | `FAIL` | `NOT_FOUND` | 资源未找到 |
| `8` | `FAIL` | `RATELIMIT` | 请求速率限制 |
| `9` | `FAIL` | `RISKY` | 风险操作 |
| `10` | `FAIL` | `BLOCKED` | 被封禁 |
| `11` | `FAIL` | `QUOTA` | 超出配额 |
| `12` | `FAIL` | `MAINTENANCE` | 服务维护中 |
| `13` | `FAIL` | `MUTE` | 禁言 |
| `255` | `FAIL` | `INTERNAL` | 内部错误 |

### api_error 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | integer | API 错误码 |
| `reason` | string | API 错误原因 |
| `message` | string | API 错误信息 |
| `trace_id` | string |Request ID，用于反馈问题与跟踪调试 |

### meta 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `hints` | []string | 提示信息列表，一些场景下会返回下一步的操作建议与指引。 |
| `alerts` | []string | 重要提示信息列表，需要引起用户关注的信息。成功或失败响应中都可能返回，例如 CLI 有新版本可用、服务维护提醒等。 |

`hints` 偏向可选的下一步建议；`alerts` 偏向重要状态或风险提醒。展示响应时，应优先保留并展示 `alerts`，不要因为 `code=0` 或业务请求成功而忽略。

## 响应示例

### 成功响应-无数据返回（操作类型）

```
{
  "code": 0, 
  "status": "OK",
}
```

### 成功响应-有数据返回（操作类型）
```
{
  "code": 0,
  "status": "OK",
  "reply": {
    "profile": {
      "UID": "KBqt7yiVrXBa9DJIJuUm3",
      "Name": "精卫鸟",
      "Member": {
        "IsMember": true,
        "Plans": {
          "pro": {
            "Type": "pro",
            "Status": 64,
          }
        }
      }
    }
  }
}
```

### 成功响应-带重要提示
```
{
  "code": 0,
  "status": "OK",
  "meta": {
    "alerts": [
      "UPDATE: new version available! current=v0.1.5 (build: 2026-04-30T14:53:45), latest=v0.1.6 (build: 2026-04-28T18:22:18). you can run `npm install -g @mowenxd/cli && npx skills add mowenxd/cli -y -g` to update."
    ]
  },
  "reply": {
    "profile": {
      "UID": "KBqt7yiVrXBa9DJIJuUm3",
      "Name": "精卫鸟",
      "Member": {
        "IsMember": true,
        "Plans": {
          "pro": {
            "Type": "pro",
            "Status": 64,
          }
        }
      }
    }
  }
}
```

### 失败响应-认证失败
```
{
  "code": 1,
  "status": "FAIL",
  "reason": "AUTH"
  "meta": {
    "hints": [
      "re-confirm, if need change api key, use --force to overwrite"
    ]
  }
}
```

### 失败响应-网络错误
```
{
  "code": 3,
  "status": "FAIL",
  "reason": "NETWORK",
  "msg": "data [AuthRepo.Ping]: auth ping fail."
}
```

### 失败响应-API 错误
```
{
  "code": 1,
  "status": "FAIL",
  "reason": "AUTH",
  "msg": "data [AuthRepo.Ping]: auth ping fail.",
  "api_error": {
    "code": 400,
    "reason": "LOGIN",
    "message": "service.v1 [login]: invalid api key.",
    "trace_id": "11bd5ca54ba723435ed671a7b8f66d7a"
  },
  "meta": {
    "hints": [
      "invalid api key, maybe it's changed in another thread.",
      "checkout latest api key and use 'mocli auth init' to change."
    ]
  },
}
```
