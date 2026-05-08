# mocli - 共用的输出字段

<a id="auth-info"></a>
## AuthInfo - 认证信息

| 字段 | 类型 | 说明 | 引用字段 |
| --- | --- | --- | --- |
| `api_key` | string | API Key | - |
| `mo_uid` | string | 墨问 UID | - |

---

<a id="user-info"></a>
## UserInfo - 用户信息

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `uid` | string | 墨问 UID | - |
| `name` | string | 墨问昵称 | - |
| `intro` | string | 墨问个人介绍 | - |
| `regist_at` | integer | 注册墨问时间，时间戳(s) | - |
| `member` | object | 墨会员信息 | [`UserMemberInfo - 用户会员信息`](#user-member-info) |

--- 

<a id="user-member-info"></a>
### UserMemberInfo - 用户会员信息

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `is_member` | boolean | 是否为会员 | - |
| `plans` | object | 墨问会员计划信息 | - |
| `plans.pro` | object | 墨问 Pro 会员信息 | - |
| `plans.pro.type` | string | 墨问 Pro 会员类型 | - |
| `plans.pro.status` | integer | 墨问 Pro 会员状态 | - |
| `plans.pro.expire_at` | integer | 墨问 Pro 会员过期时间，时间戳(ms) | - |

---

<a id="note-info"></a>
## NoteInfo - 笔记信息

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `note_id` | string | 笔记 ID | - |
| `uid` | string | 作者 UID | - |
| `title` | string | 标题 | - |
| `brief` | string | 简介 | - |
| `url` | string | 链接 | - |
| `created_at` | integer | 创建时间，时间戳(s) | - |
| `public_at` | integer | 公开时间，时间戳(s) | - |
| `flag` | object | 笔记标记信息 | [`NoteFlag - 笔记标记`](#note-flag) |
| `content` | object | 笔记正文信息 | [`NoteContent - 笔记正文`](#note-content) |
| `status` | object | 笔记状态信息 | [`NoteStatus - 笔记状态`](#note-status) |
| `stat` | object | 笔记计数信息 | [`NoteStat - 笔记计数`](#note-stat) |

---

<a id="note-content"></a>
### NoteContent - 笔记正文

注：列表场景，只返回字数信息

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `word_count` | integer | 字数计数 | - |

---

<a id="note-status"></a>
### NoteStatus - 笔记状态

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `public_status` | integer | 公开状态：`0` 私有 / `1` 完全公开 / `2` 规则公开 | - |
| `audit_status` | integer | 审核状态：`32` 审核中 / `64` 审核通过 / `>=96` 已拒绝 | - |

---

<a id="note-flag"></a>
### NoteFlag - 笔记标记

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `with_text` | boolean | 是否含有文本 | - |
| `with_image` | boolean | 是否含有图片 | - |
| `with_audio` | boolean | 是否含有音频 | - |
| `with_ref` | boolean | 是否含有子笔记 | - |
| `with_fee` | boolean | 是否需要付费 | - |
| `with_gallery` | boolean | 是否有画廊 | - |
| `with_video` | boolean | 是否含有视频 | - |
| `with_pdf` | boolean | 是否含有 PDF | - |

---

<a id="note-stat"></a>
### NoteStat - 笔记计数

| 字段 | 类型 | 说明 | 引用字段 |
|------|------|------|------|
| `view` | integer | 阅读数 | - |
| `favor` | integer | 点赞数 | - |
| `collect` | integer | 收藏数 | - |
| `share` | integer | 分享数 | - |
| `comment` | integer | 评论数 | - |
