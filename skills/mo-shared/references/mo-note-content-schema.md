# mo-note-content - 墨问笔记正文语法树

墨问笔记正文采用 JSON 格式进行组织，在笔记创建、编辑、正文渲染时，可能都会用到该语法树。

在墨问 API 的笔记创建/编辑接口中，请求体 `body` 字段就是笔记正文语法树。`body` 的类型为 `NoteAtom`，它是一个递归节点：每个节点都可以通过 `content` 包含子节点，也可以通过 `marks` 描述文本样式。

## 顶层结构

`body` 的顶层节点必须是根节点 `doc`。根节点通常不直接包含 `text`，而是通过 `content` 放置段落、引用、图片、音频、PDF、代码块等 block 节点。空段落可以写成只有 `type` 的 `paragraph`，常用于表示段落间的空行。

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "这是一段墨问笔记正文"
        }
      ]
    }
  ]
}
```

## 段落间距

构建 `doc.content` 时，相邻两个正文块之间默认插入一个空段落 `{ "type": "paragraph" }`，用于表达段间距。

- 不要在 `doc.content` 开头或结尾额外插入空段落，除非原文明确包含开头或结尾空行。
- 连续多个空行通常压缩为一个空段落，避免生成过多空白。
- 图片、音频、PDF、代码块、引用块等 block 节点与普通段落之间也适用该规则。

## NoteAtom 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 节点类型。顶层必须是 `doc`，其它节点按 block、inline、marks 分类使用。 |
| `text` | string | 否 | 节点文本。通常只用于 `text` 类型节点。 |
| `content` | array[NoteAtom] | 否 | 子节点列表。通常用于 `doc`、`paragraph`、`quote`、`codeblock` 等可承载内容的节点。 |
| `marks` | array[NoteAtom] | 否 | 文本标记列表。通常用于 `text` 节点，用来描述样式或链接。 |
| `attrs` | object<string,string> | 否 | 节点属性。不同节点使用不同属性，属性值按字符串传递。 |

## 节点类型

| 类型 | 分类 | 说明 |
|------|------|------|
| `doc` | 根节点 | 笔记正文的顶层节点，顶层节点必须使用该类型。 |
| `paragraph` | block | 段落节点，通常通过 `content` 包含一个或多个 `text` inline 节点。 |
| `text` | inline | 文本节点，正文文字写在 `text` 字段中。 |
| `quote` | block | 引用块，通常通过 `content` 直接包含一个或多个 `text` 节点。 |
| `note` | block | 内链笔记，通过 `attrs.uuid` 指定被引用的笔记 ID。 |
| `image` | block | 图片，通过 `attrs.uuid` 指定图片文件 ID，可配合 `attrs.align`、`attrs.alt`。 |
| `audio` | block | 音频，通过 `attrs.audio-uuid` 指定音频文件 ID，可通过 `attrs.audio-duration` 写入音频时长，通过 `attrs.show-note` 写入音频 ShowNote。 |
| `pdf` | block | PDF，通过 `attrs.uuid` 指定 PDF 文件 ID，可通过 `attrs.name`、`attrs.size` 写入展示名和文件大小。 |
| `codeblock` | block | 代码块，通过 `content` 放置代码文本，可通过 `attrs.language` 指定语言。 |
| `highlight` | marks | 高亮标记，用在 `text.marks` 中。 |
| `link` | marks | 链接标记，用在 `text.marks` 中，通过 `attrs.href` 指定链接地址。 |
| `bold` | marks | 加粗标记，用在 `text.marks` 中。 |
| `code` | marks | 行内代码标记，用在 `text.marks` 中。 |

## 属性约定

| 属性 | 适用节点 | 说明 |
|------|----------|------|
| `href` | `marks.link` | 链接地址。 |
| `align` | `image` | 图片对齐方式，可选值：`left`、`center`、`right`。 |
| `uuid` | `note` / `image` / `pdf` | 在 `note` 中表示内链笔记 ID；在 `image` 中表示图片文件 ID；在 `pdf` 中表示 PDF 文件 ID。 |
| `audio-uuid` | `audio` | 音频文件 ID。 |
| `audio-duration` | `audio` | 音频时长，通常从上传返回的 `file_meta.duration` 获取，属性值使用字符串。 |
| `alt` | `image` | 图片描述。 |
| `show-note` | `audio` | 音频 ShowNote。 |
| `name` | `pdf` | PDF 展示名，通常使用上传返回的 `file_name`。 |
| `size` | `pdf` | PDF 文件大小，单位字节，通常使用上传返回的 `file_size` 字符串形式。 |
| `language` | `codeblock` | 代码块语言，支持的语言列表参见 Shiki languages: https://shiki.style/languages |

## 文本与 marks

`marks` 用于描述 inline 文本节点的样式。一个 `text` 节点可以同时携带多个标记，例如加粗链接文本：

```json
{
  "type": "text",
  "text": "墨问官网",
  "marks": [
    {
      "type": "bold"
    },
    {
      "type": "link",
      "attrs": {
        "href": "https://mowen.cn"
      }
    }
  ]
}
```

## 常见节点示例

### 段落

```json
{
  "type": "paragraph",
  "content": [
    {
      "type": "text",
      "text": "普通段落文本"
    }
  ]
}
```

### 引用

```json
{
  "type": "quote",
  "content": [
    {
      "type": "text",
      "text": "这里是一段引用内容"
    }
  ]
}
```

### 图片

```json
{
  "type": "image",
  "attrs": {
    "uuid": "image-file-id",
    "align": "center",
    "alt": "图片描述"
  }
}
```

### 音频

```json
{
  "type": "audio",
  "attrs": {
    "audio-uuid": "audio-file-id",
    "audio-duration": "236.878367",
    "show-note": "00:00 这里是音频 ShowNote\n02:00 开头\n04:00 结尾"
  }
}
```

### PDF

```json
{
  "type": "pdf",
  "attrs": {
    "uuid": "pdf-file-id",
    "name": "产品报告.pdf",
    "size": "6816989"
  }
}
```

### 内链笔记

```json
{
  "type": "note",
  "attrs": {
    "uuid": "note-id"
  }
}
```

### 代码块

```json
{
  "type": "codeblock",
  "attrs": {
    "language": "javascript"
  },
  "content": [
    {
      "type": "text",
      "text": "console.log('hello mowen')"
    }
  ]
}
```

## 完整示例

下面示例可作为 `NoteCreateRequest.body` 使用：

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "今天记录一个墨问 OpenAPI 示例，"
        },
        {
          "type": "text",
          "text": "这段文字被加粗并带链接",
          "marks": [
            {
              "type": "bold"
            },
            {
              "type": "link",
              "attrs": {
                "href": "https://mowen.cn"
              }
            }
          ]
        },
        {
          "type": "text",
          "text": "。"
        }
      ]
    },
    {
      "type": "paragraph"
    },
    {
      "type": "quote",
      "content": [
        {
          "type": "text",
          "text": "引用块可以承载文本内容。"
        }
      ]
    },
    {
      "type": "paragraph"
    },
    {
      "type": "image",
      "attrs": {
        "uuid": "image-file-id",
        "align": "center",
        "alt": "示例图片"
      }
    },
    {
      "type": "paragraph"
    },
    {
      "type": "audio",
      "attrs": {
        "audio-uuid": "audio-file-id",
        "show-note": "00:00 这里是音频 ShowNote\n02:00 开头\n04:00 结尾",
        "audio-duration": "5.148"
      }
    },
    {
      "type": "paragraph"
    },
    {
      "type": "pdf",
      "attrs": {
        "uuid": "pdf-file-id",
        "name": "pdf-file-name",
        "size": "7669043"
      }
    },
    {
      "type": "paragraph"
    },
    {
      "type": "codeblock",
      "attrs": {
        "language": "json"
      },
      "content": [
        {
          "type": "text",
          "text": "{\"hello\":\"mowen\"}"
        }
      ]
    }
  ]
}
```

## 使用注意

- `type` 是唯一必填字段；但实际使用时，`doc`、`paragraph`、`text` 等节点通常需要搭配 `content` 或 `text` 才能形成有效正文。
- 空段落可写成 `{ "type": "paragraph" }`，可用于表达段落间空行。
- `attrs` 是字符串键值对象。文件 ID、笔记 ID、链接地址、语言名等都放在对应属性中。
- marks 节点本身也是 `NoteAtom`，但通常只需要 `type` 和必要的 `attrs`，不要再放 `content`。
- `audio`、`image`、`pdf` 等资源节点依赖已有资源 ID；文档只描述正文树结构，不描述资源上传流程。
