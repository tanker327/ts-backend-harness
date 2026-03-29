# Progress Tracking 完全指南：progress.json 与 feature_list.json

---

## 目录

1. [为什么需要 Progress Tracking](#1-为什么需要-progress-tracking)
2. [两种追踪模式对比](#2-两种追踪模式对比)
3. [progress.json 详解](#3-progressjson-详解)
4. [feature_list.json 详解](#4-feature_listjson-详解)
5. [如何添加新任务](#5-如何添加新任务)
6. [Agent 工作流程：从启动到完成](#6-agent-工作流程从启动到完成)
7. [项目增长后的扩展策略](#7-项目增长后的扩展策略)
8. [Claude Code 原生 Task 系统的关系](#8-与-claude-code-原生-task-系统的关系)
9. [常见问题与反模式](#9-常见问题与反模式)
10. [参考资源](#10-参考资源)

---

## 1. 为什么需要 Progress Tracking

### 1.1 核心问题：Agent 没有记忆

> Agent 的每次会话都从零开始。它不记得上次完成了哪些功能、哪些文件被修改过、遇到过什么 bug。
> — Harness Engineering 实操手册

每次新会话启动时，Agent 面对一片空白。如果没有结构化的状态恢复机制，每次会话它都像一个新入职的员工重新摸索。

### 1.2 解决方案：文件系统即记忆

Anthropic 在 [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 中提出的核心洞察：

> "The key insight here was finding a way for agents to quickly understand the state of work when starting with a fresh context window, which is accomplished with the progress file alongside the git history."

结构化恢复的三根支柱：

| 支柱 | 作用 | 特点 |
|------|------|------|
| **Git 历史** | "发生了什么"的最可信记录 | 不可篡改，但需要解读 |
| **进度文件 (JSON)** | 结构化的任务状态追踪 | 机器可读，Agent 可直接解析 |
| **标准化启动流程** | 确保每次会话快速恢复上下文 | 写在 CLAUDE.md 中，每次自动执行 |

### 1.3 为什么用 JSON 而不是 Markdown

来自 Anthropic 和实操手册的实践经验：

- Agent 编辑 Markdown 时容易**破坏格式、丢失信息、改变结构**
- JSON 有严格语法规则，Agent **不当编辑的概率更低**
- JSON **可被程序解析和验证**，Markdown 不行
- Anthropic 发现 **"the model is less likely to inappropriately change or overwrite JSON files compared to Markdown"**

---

## 2. 两种追踪模式对比

实操手册和 Anthropic 官方提供了两种互补的追踪模式：

| 维度 | progress.json | feature_list.json |
|------|---------------|-------------------|
| **定位** | 通用任务追踪 | 功能清单 + 验收测试 |
| **谁创建** | 人类手动编写 | Initializer Agent 自动生成 |
| **粒度** | 任务级（可含子任务） | 功能级（含测试步骤） |
| **适用场景** | 持续开发、bug 修复、迭代 | 新项目启动、大规模并行开发 |
| **可修改性** | 状态可改，内容可改 | 仅 `passes` 字段可改，其余不可变 |
| **来源** | Harness Engineering 实操手册 | Anthropic autonomous-coding 项目 |

**何时用哪个**：

- **已有项目持续开发** → `progress.json`（灵活，适合日常迭代）
- **新项目从零开始** → `feature_list.json`（Initializer Agent 生成完整功能清单）
- **两者结合** → `feature_list.json` 做功能追踪，`progress.json` 做冲刺/日常任务管理

---

## 3. progress.json 详解

### 3.1 完整模板

```json
{
  "project": "my-app",
  "last_updated": "2026-03-22T10:30:00Z",
  "current_sprint": "v0.3.0",
  "tasks": [
    {
      "id": "TASK-001",
      "title": "User login page",
      "status": "completed",
      "priority": 1,
      "completed_at": "2026-03-20T15:00:00Z",
      "commit": "a1b2c3d",
      "notes": "NextAuth.js with Google OAuth"
    },
    {
      "id": "TASK-002",
      "title": "User dashboard API",
      "status": "in_progress",
      "priority": 1,
      "started_at": "2026-03-21T09:00:00Z",
      "subtasks": [
        { "name": "GET /api/dashboard/stats", "done": true },
        { "name": "GET /api/dashboard/recent", "done": false },
        { "name": "WebSocket real-time updates", "done": false }
      ],
      "blockers": [],
      "notes": "stats endpoint done, recent needs pagination"
    },
    {
      "id": "TASK-003",
      "title": "Email notification service",
      "status": "pending",
      "priority": 2,
      "depends_on": ["TASK-002"],
      "notes": "Use Resend API, depends on dashboard API"
    },
    {
      "id": "TASK-004",
      "title": "Fix: mobile navbar overlapping",
      "status": "pending",
      "priority": 3,
      "type": "bugfix",
      "notes": "Only on iPhone SE screen size"
    }
  ],
  "known_issues": [
    "Docker build occasionally times out on arm64"
  ],
  "tech_debt": [
    "TASK-001 session handling needs Redis migration"
  ]
}
```

### 3.2 字段说明

#### 顶层字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `project` | string | Yes | 项目名称 |
| `last_updated` | ISO 8601 | Yes | 最后更新时间（Agent 每次更新时自动修改） |
| `current_sprint` | string | No | 当前冲刺/版本标识 |
| `tasks` | array | Yes | 任务列表 |
| `known_issues` | array | No | 已知问题（不是任务，是注意事项） |
| `tech_debt` | array | No | 技术债务记录 |

#### 任务字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | Yes | 唯一标识（如 `TASK-001`） |
| `title` | string | Yes | 简短的任务描述 |
| `status` | enum | Yes | `pending` / `in_progress` / `completed` / `blocked` |
| `priority` | number | Yes | 数字越小优先级越高（1 = 最高） |
| `type` | string | No | `feature` / `bugfix` / `refactor` / `chore`（默认 feature） |
| `depends_on` | array | No | 依赖的前置任务 ID 列表 |
| `subtasks` | array | No | 子任务列表（含 `name` 和 `done`） |
| `blockers` | array | No | 阻塞项描述 |
| `notes` | string | No | 补充说明、技术细节 |
| `started_at` | ISO 8601 | No | 开始时间 |
| `completed_at` | ISO 8601 | No | 完成时间 |
| `commit` | string | No | 关联的 git commit hash |

### 3.3 状态流转

```
pending ──> in_progress ──> completed
               │
               └──> blocked ──> in_progress ──> completed
```

**Agent 的行为规则**：
- 启动会话时读取 `progress.json`
- 选择 `priority` 最高（数值最小）的 `pending` 任务
- 跳过 `completed` 和 `blocked` 的任务
- 检查 `depends_on`，如果前置任务未完成则跳过
- 开始工作时将状态改为 `in_progress`
- 完成后改为 `completed`，填入 `completed_at` 和 `commit`

---

## 4. feature_list.json 详解

### 4.1 来源与设计哲学

来自 Anthropic 的 [autonomous-coding](https://github.com/anthropics/claude-quickstarts/tree/main/autonomous-coding) 项目。核心设计原则：

> **"IT IS CATASTROPHIC TO REMOVE OR EDIT FEATURES. Features can ONLY be marked as passing."**

feature_list.json 是**不可变的功能清单** — 功能描述和测试步骤一旦创建就不再修改，只有 `passes` 字段可以从 `false` 改为 `true`。这与 ADR 的不可变原则一脉相承。

### 4.2 完整模板

```json
[
  {
    "category": "functional",
    "description": "User can create a new account with email and password",
    "steps": [
      "Navigate to /register",
      "Fill in email, password, and confirm password fields",
      "Click 'Create Account' button",
      "Verify redirect to dashboard",
      "Verify welcome email is sent"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "User can log in with existing credentials",
    "steps": [
      "Navigate to /login",
      "Enter valid email and password",
      "Click 'Sign In' button",
      "Verify redirect to dashboard",
      "Verify session token is set in cookies"
    ],
    "passes": false
  },
  {
    "category": "style",
    "description": "Login page is responsive on mobile devices",
    "steps": [
      "Navigate to /login on 375px viewport",
      "Verify form is full-width with proper padding",
      "Verify buttons are tappable (min 44px height)",
      "Take screenshot and compare with design spec"
    ],
    "passes": false
  }
]
```

### 4.3 字段说明

| 字段 | 类型 | 说明 | 可修改？ |
|------|------|------|---------|
| `category` | string | `functional` 或 `style` | **No** |
| `description` | string | 功能描述 + 测试验证点 | **No** |
| `steps` | array | 端到端测试步骤（不是代码级步骤） | **No** |
| `passes` | boolean | 是否已通过验证 | **Yes**（仅 false → true） |

### 4.4 Initializer Agent 如何生成

Anthropic 的模式使用两种 Agent 角色：

**Initializer Agent（只运行一次）**：
1. 读取 `app_spec.txt`（项目规格说明）
2. 将高级描述展开为 200+ 具体的、可测试的功能点
3. 按优先级排序（基础功能在前）
4. 混合粒度：简单功能 2-5 步，复杂功能 10+ 步
5. 创建 `feature_list.json`、`init.sh`、`claude-progress.txt`
6. 初始化 git 仓库，提交所有文件

**Coding Agent（每次后续会话）**：
1. 读取 `feature_list.json` 和 `claude-progress.txt`
2. 找到第一个 `passes: false` 的功能
3. 实现该功能
4. 运行测试验证
5. 通过后将 `passes` 改为 `true`
6. 更新 `claude-progress.txt`
7. Git commit

### 4.5 与 progress.json 的配合使用

在实际项目中，两者可以配合使用：

```
feature_list.json  →  功能需求清单（不可变的 "什么要做"）
progress.json      →  当前冲刺任务（可变的 "现在在做什么"）
```

例如：feature_list.json 中有 200 个功能，当前冲刺只做其中 10 个。这 10 个会出现在 progress.json 的 tasks 中，带有更具体的实现细节。

---

## 5. 如何添加新任务

### 5.1 手动添加（适合日常开发）

直接编辑 `progress.json`，在 `tasks` 数组末尾添加：

**添加新 Feature**：
```json
{
  "id": "TASK-005",
  "title": "Add user profile page",
  "status": "pending",
  "priority": 2,
  "notes": "Display avatar, email, and settings link. See design in Figma."
}
```

**添加 Bug Fix**：
```json
{
  "id": "TASK-006",
  "title": "Fix: login form not validating email format",
  "status": "pending",
  "priority": 1,
  "type": "bugfix",
  "notes": "Users can submit 'abc' as email. Add client-side + server-side validation."
}
```

**添加有依赖的任务**：
```json
{
  "id": "TASK-007",
  "title": "Email notification for new comments",
  "status": "pending",
  "priority": 2,
  "depends_on": ["TASK-005"],
  "notes": "Requires profile page (TASK-005) for email settings"
}
```

### 5.2 通过 Agent Plan Mode 生成

让 Agent 在 Plan Mode 下分析需求，生成任务列表，人类审核后写入：

```
你：请分析这个需求，拆分成 progress.json 格式的任务：
    "我们需要添加用户评论功能，支持 Markdown、@提及、图片上传"

Agent：（Plan Mode 输出任务列表）

你：审核通过，写入 progress.json
```

这符合 Harness Engineering 原则 7：**计划与执行分离**。

### 5.3 从外部工具同步

如果团队使用 Linear/Jira/GitHub Issues，可以编写简单的同步脚本：

```bash
# 示例：从 GitHub Issues 同步到 progress.json
gh issue list --state open --json number,title,labels \
  | jq '[.[] | {
      id: ("TASK-" + (.number | tostring)),
      title: .title,
      status: "pending",
      priority: (if (.labels | any(.name == "P0")) then 1
                 elif (.labels | any(.name == "P1")) then 2
                 else 3 end),
      type: (if (.labels | any(.name == "bug")) then "bugfix" else "feature" end)
    }]'
```

### 5.4 任务粒度建议

| 粒度 | 示例 | 推荐？ |
|------|------|--------|
| 太粗 | "Build user management system" | No — Agent 在一个会话中无法完成 |
| 合适 | "Add user registration endpoint with validation" | Yes — 一个会话可完成，可验证 |
| 太细 | "Add email field to User model" | No — 太琐碎，缺乏独立价值 |

**经验法则**：一个任务应该能在 **一个 Agent 会话** 中完成，并且有明确的 **验证方式**（测试通过、API 可调用等）。

---

## 6. Agent 工作流程：从启动到完成

### 6.1 标准启动流程（写在 CLAUDE.md 中）

```markdown
# Session Startup (execute every new session)
1. Run `git log --oneline -20` to review recent changes
2. Read `progress.json` to check task status
3. Pick the highest priority "pending" task (lowest priority number)
4. Skip tasks with unmet depends_on
5. Verify dev server health: `npm run dev` or `uv run uvicorn src.main:app --reload`
6. Start working on selected task
```

### 6.2 完整工作循环

```
┌──────────────────────────────────────────────────────┐
│  SESSION START                                        │
│                                                       │
│  1. git log --oneline -20                             │
│  2. cat progress.json                                 │
│  3. Pick highest priority pending task                │
│  4. Update status: "pending" → "in_progress"          │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  PLAN → BUILD → VERIFY → FIX (loop)             │  │
│  │                                                  │  │
│  │  - Read task spec, scan codebase                 │  │
│  │  - Implement + write tests                       │  │
│  │  - Run tests, verify against task spec           │  │
│  │  - Fix failures, loop back to VERIFY             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  SESSION END                                          │
│                                                       │
│  1. Run all tests + linter                            │
│  2. Update progress.json:                             │
│     - status: "completed"                             │
│     - completed_at: timestamp                         │
│     - commit: hash                                    │
│  3. Git commit with descriptive message               │
│  4. Commit message last line: "Next: [next task]"     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### 6.3 Commit Message 规范

来自实操手册的建议——commit message 应面向 **下一个 Agent 会话**：

```
feat(dashboard): implement GET /api/dashboard/stats

- Added stats endpoint with user count, revenue, and active sessions
- Created DashboardRepo with aggregation queries
- Added integration tests (3 test cases, all passing)
- Known issue: response time >200ms with large datasets (see TASK-008)

Next: implement GET /api/dashboard/recent (TASK-002 subtask 2)
```

最后一行 `Next:` 是给下一个 Agent 会话看的。

---

## 7. 项目增长后的扩展策略

这是最关键的部分。随着项目增长，`progress.json` 可能膨胀到包含数百个任务，Agent 每次启动都要读取整个文件，浪费上下文窗口。

### 7.1 策略一：冲刺归档（推荐）

**核心思想**：按冲刺/版本归档已完成的任务，`progress.json` 只保留当前活跃任务。

**目录结构**：

```
progress/
├── current.json              # 当前冲刺的活跃任务（Agent 读这个）
├── archive/
│   ├── v0.1.0.json           # v0.1.0 冲刺的已完成任务
│   ├── v0.2.0.json           # v0.2.0 冲刺的已完成任务
│   └── v0.3.0.json           # v0.3.0 冲刺的已完成任务
└── README.md                 # 说明文件结构
```

**归档规则**：

- 当一个冲刺结束时，将所有 `completed` 任务移到 `archive/vX.X.X.json`
- `current.json` 只保留 `pending`、`in_progress`、`blocked` 的任务
- 新冲刺开始时更新 `current_sprint` 字段

**归档脚本**：

```bash
#!/bin/bash
# archive-sprint.sh — 归档当前冲刺的已完成任务

SPRINT=$(jq -r '.current_sprint' progress/current.json)
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 提取已完成任务到归档文件
jq '{
  sprint: .current_sprint,
  archived_at: "'"$DATE"'",
  tasks: [.tasks[] | select(.status == "completed")]
}' progress/current.json > "progress/archive/${SPRINT}.json"

# 从 current.json 中移除已完成任务
jq '.tasks = [.tasks[] | select(.status != "completed")]' \
  progress/current.json > progress/current.tmp.json \
  && mv progress/current.tmp.json progress/current.json

echo "Archived $(jq '.tasks | length' "progress/archive/${SPRINT}.json") tasks to ${SPRINT}.json"
```

**在 CLAUDE.md 中指向正确文件**：

```markdown
# Task Tracking
- Current tasks: progress/current.json
- Archived sprints: progress/archive/
- Only read archive files when investigating historical context
```

### 7.2 策略二：按域分割

**核心思想**：当项目足够大时，按功能域拆分任务文件。

```
progress/
├── current.json              # 全局元数据 + 跨域任务
├── domains/
│   ├── auth.json             # 认证相关任务
│   ├── dashboard.json        # 仪表盘相关任务
│   ├── payments.json         # 支付相关任务
│   └── notifications.json   # 通知相关任务
└── archive/
    └── ...
```

**current.json 只保留索引和跨域信息**：

```json
{
  "project": "my-app",
  "last_updated": "2026-03-22T10:30:00Z",
  "current_sprint": "v0.5.0",
  "domains": [
    { "name": "auth", "file": "progress/domains/auth.json", "active_tasks": 2 },
    { "name": "dashboard", "file": "progress/domains/dashboard.json", "active_tasks": 3 },
    { "name": "payments", "file": "progress/domains/payments.json", "active_tasks": 0 },
    { "name": "notifications", "file": "progress/domains/notifications.json", "active_tasks": 1 }
  ],
  "cross_domain_tasks": [
    {
      "id": "TASK-050",
      "title": "Unify error response format across all APIs",
      "status": "pending",
      "priority": 1
    }
  ]
}
```

**Agent 的行为**：先读 `current.json` 了解全局状态，再按需读取对应域的文件。

**适用场景**：多人/多 Agent 并行开发时，每个 Agent 只关注自己负责的域。

### 7.3 策略三：feature_list.json 的分页

对于 Anthropic 模式的 feature_list.json（可能有 200+ 条目），按类别拆分：

```
features/
├── index.json                # 总览：各类别进度统计
├── auth.json                 # 认证相关功能
├── dashboard.json            # 仪表盘功能
├── payments.json             # 支付功能
└── ui-style.json             # UI/样式验证
```

**index.json**：

```json
{
  "project": "my-app",
  "total_features": 215,
  "passed": 89,
  "remaining": 126,
  "categories": [
    { "file": "features/auth.json", "total": 35, "passed": 35 },
    { "file": "features/dashboard.json", "total": 50, "passed": 28 },
    { "file": "features/payments.json", "total": 60, "passed": 12 },
    { "file": "features/ui-style.json", "total": 70, "passed": 14 }
  ]
}
```

Agent 读 index.json 后直接跳到有未完成功能的类别文件。

### 7.4 策略四：时间窗口截断

**最简单的方法**：只在 `progress.json` 中保留最近 N 天的任务。

```json
{
  "retention_policy": "30_days",
  "tasks": []
}
```

设置一个定期任务（cron 或手动），将超过 30 天的 `completed` 任务移到归档文件。

### 7.5 策略选择指南

```
项目规模和阶段？
│
├── 新项目从零开始
│   └── 使用 feature_list.json (Anthropic 模式)
│       如果 200+ 功能，使用 策略三：分页
│
├── 小型（<50 个任务累计）
│   └── 单文件 progress.json 足够，不需要拆分
│
├── 中型（50-200 个任务累计）
│   └── 使用 策略一：冲刺归档
│       每个冲刺结束时归档 completed 任务
│
├── 大型（200+ 个任务，多人/多 Agent 协作）
│   └── 使用 策略二：按域分割 + 策略一：冲刺归档
│       每个域独立文件，定期归档
│
└── 成熟项目（3+ 个月，测试覆盖 >80%）
    └── 考虑 策略五：用测试套件替代功能列表
        + 策略六：LLM 压缩旧任务
```

### 7.6 策略五：用测试套件替代功能列表（长期项目终极方案）

来自 Harness Engineering 实操手册的进阶策略：

> 对于长期项目，考虑用测试套件本身替代功能列表——测试通过即功能完成，不需要额外维护一份功能追踪文件。

**核心思想**：`feature_list.json` 本质上是一份"哪些功能应该工作"的清单。但测试套件也是这个清单——而且它是**可执行的**。

```
# 用测试套件替代 feature_list.json
pytest tests/ --tb=short
# 42 passed, 8 failed, 3 skipped
# → 42 个功能已完成，8 个待实现，3 个暂时跳过
```

**何时适用**：
- 项目已运行 3+ 个月，测试覆盖率 > 80%
- feature_list.json 的维护成本超过了它的价值
- 团队已有成熟的测试文化

**何时不适用**：
- 项目早期，测试覆盖不全
- 需要追踪非代码任务（文档、部署、设计）

### 7.7 策略六：LLM 驱动的智能压缩

参考 [Beads](https://betterstack.com/community/guides/ai/beads-issue-tracker-ai-agents/) 项目的 "Agentic Memory Decay" 模式：对超过 30 天的已完成任务，使用 LLM 生成摘要替代完整内容。

**压缩前**：
```json
{
  "id": "TASK-012",
  "title": "Implement JWT authentication with refresh token rotation",
  "status": "completed",
  "completed_at": "2026-01-15T10:00:00Z",
  "notes": "Used RS256 algorithm. Access token 15min, refresh 7 days. Token blacklist in Redis for logout. Had to fix race condition in concurrent refresh requests - added mutex lock. See commit a1b2c3d.",
  "subtasks": [
    { "name": "JWT signing middleware", "done": true },
    { "name": "Refresh token endpoint", "done": true },
    { "name": "Token blacklist in Redis", "done": true },
    { "name": "Concurrent refresh race condition fix", "done": true }
  ]
}
```

**压缩后**：
```json
{
  "id": "TASK-012",
  "title": "Implement JWT authentication with refresh token rotation",
  "status": "completed",
  "completed_at": "2026-01-15T10:00:00Z",
  "summary": "JWT auth (RS256) with 15min access + 7d refresh tokens, Redis blacklist for logout. Key learning: concurrent refresh needs mutex. Commit: a1b2c3d"
}
```

保留了关键信息（技术选型、踩过的坑），丢弃了实现细节（子任务列表）。

### 7.8 四层上下文模型

来自 Google、Anthropic 和 Manus 团队的研究，为 Agent 的上下文管理提供了架构级指导：

```
┌─────────────────────────────────────────────┐
│  Layer 1: Working Context（工作上下文）       │
│  当前步骤需要的信息                            │
│  → 当前任务详情 + 相关代码文件                  │
│  目标：最小化，只放当前需要的                    │
├─────────────────────────────────────────────┤
│  Layer 2: Session（会话上下文）               │
│  当前任务的完整状态                             │
│  → progress/current.json 中的当前任务           │
│  目标：一个会话的范围                           │
├─────────────────────────────────────────────┤
│  Layer 3: Memory（持久记忆）                  │
│  跨会话的持久记录                              │
│  → progress/current.json 全文                  │
│  → claude-progress.txt                        │
│  目标：恢复上下文的最小信息                     │
├─────────────────────────────────────────────┤
│  Layer 4: Artifacts（外部存储）               │
│  大量数据的外部存储                             │
│  → progress/archive/                          │
│  → Git 历史                                   │
│  → 完整的 feature_list.json                    │
│  目标：按需检索，不主动加载                     │
└─────────────────────────────────────────────┘
```

**核心原则**：问 "当前步骤真正需要什么信息"，而不是 "上下文窗口还能塞多少"。**每多加一个 token 到上下文窗口，都在和其他信息争夺模型的注意力——即使窗口没有满，堆积也会降低推理质量。**

### 7.9 防止文件膨胀的通用原则

1. **`progress.json` 中的活跃任务不超过 20-30 个** — 超过说明任务粒度太粗或需要归档
2. **已完成任务最多保留一个冲刺** — 更早的归档到 `archive/`
3. **`notes` 字段保持简短** — 详细信息放在 commit message 或 PR 中
4. **`known_issues` 和 `tech_debt` 定期清理** — 已解决的移除，长期存在的转为正式任务
5. **Agent 只读当前文件** — 在 CLAUDE.md 中明确指示 Agent 只读 `progress/current.json`，不要读归档
6. **定期压缩** — 对超过 30 天的已完成任务使用摘要替代完整内容（策略六）
7. **终极方案** — 长期项目考虑用测试套件替代功能列表（策略五）

---

## 8. 与 Claude Code 原生 Task 系统的关系

Claude Code v2.1+ 引入了[原生 Task 系统](https://code.claude.com/docs/en/common-workflows)，使用 `TaskCreate`、`TaskUpdate`、`TaskList` 等工具。

### 8.1 两者的区别

| 维度 | progress.json (文件) | Claude Code Tasks (原生) |
|------|---------------------|------------------------|
| **存储位置** | 项目仓库中（版本控制） | `~/.claude/tasks/`（本地，不在仓库中） |
| **跨会话** | 通过文件系统持久化 | 原生持久化，跨 context compaction |
| **多 Agent** | 通过文件读写协调 | 通过 `CLAUDE_CODE_TASK_LIST_ID` 共享 |
| **可见性** | 人类和 Agent 都能直接查看 | 主要在 Claude Code UI 中查看 |
| **版本控制** | 随代码一起 commit | 不进入 git |
| **团队共享** | 通过 git 共享 | 仅本地 |

### 8.2 推荐用法

| 场景 | 推荐方案 |
|------|---------|
| 单人 + Claude Code | 原生 Task 系统即可 |
| 团队协作 + 多 Agent | progress.json（版本控制，团队可见） |
| 新项目启动 | feature_list.json（Anthropic 模式） |
| 与外部工具集成（Linear/Jira） | progress.json + 同步脚本 |

两者并不冲突。可以用 progress.json 做项目级的持久化追踪，用原生 Task 做会话内的临时任务分解。

### 8.3 与外部项目管理工具的集成

对于使用 Linear、Jira、GitHub Issues 的团队，新兴的模式是**分层管理**：

```
┌──────────────────────────────────────────────────────┐
│  外部 PM 工具 (Jira / Linear / GitHub Issues)         │
│  → 团队级真相来源：优先级、分配、里程碑、利益方可见     │
├──────────────────────────────────────────────────────┤
│  本地任务文件 (progress.json / feature_list.json)      │
│  → Agent 的工作记忆：快速读写，无需 API 调用            │
├──────────────────────────────────────────────────────┤
│  同步桥梁 (GitHub Actions / MCP / Webhook)             │
│  → 双向同步状态变更                                    │
└──────────────────────────────────────────────────────┘
```

**实际案例**：
- **OpenAI Codex + Jira**：Jira issue 加标签触发 GitHub Actions → Codex 自动实现 → 开 PR → 状态回写 Jira
- **GitHub Copilot + Jira/Linear**：直接将 issue 分配给 Copilot Agent，Agent 自动实现并开 PR
- **Claude Code + MCP**：通过 Model Context Protocol 连接 Linear/Jira，在编辑器内读写工单

**关键原则**：外部工具是团队的真相来源，`progress.json` 是 Agent 的本地工作记忆。两者通过自动化保持同步，而非手动维护。

### 8.4 社区中的替代方案

除了 `progress.json` 和 `feature_list.json`，社区还发展了其他模式：

| 方案 | 核心思路 | 优点 | 适用场景 |
|------|---------|------|---------|
| **Claude Task Master** | `tasks.json` + CLI 工具 | 丰富的 CLI，支持 tag 隔离 | 需要命令行工具管理的团队 |
| **MDTM** (一文件一任务) | 每个任务一个 `.md` 文件，TOML frontmatter | 不会有单文件膨胀问题 | 大型项目，多人协作 |
| **Beads** | `issues.jsonl` (JSON Lines) + SQLite | LLM 智能压缩，Git 友好 | 需要自动化归档的长期项目 |
| **TASKS.md** (Cursor) | Markdown 文件 + 分区 | 简单直观，人类友好 | Cursor 用户，小型项目 |

这些方案各有侧重，但核心原则一致：**给 Agent 一个结构化的、可快速解析的任务状态文件**。

---

## 9. 常见问题与反模式

### 反模式 1：任务描述不够具体

**差**：
```json
{ "title": "Fix the bug", "notes": "" }
```

**好**：
```json
{ "title": "Fix: login form accepts invalid email format", "type": "bugfix", "notes": "Users can submit 'abc' as email. Add validation in LoginForm.tsx and POST /api/auth/login" }
```

Agent 需要足够的上下文才能独立工作。

### 反模式 2：不更新 progress.json

写了 progress.json 但从不更新状态，变成了一个过时的文档。

**解决**：在 CLAUDE.md 中明确要求 Agent 在任务完成时更新 progress.json：

```markdown
# Task Completion Rules
- After completing a task, update progress.json: set status to "completed", add completed_at and commit hash
- Do NOT leave tasks in "in_progress" status when ending a session
```

### 反模式 3：在 progress.json 中写长篇笔记

```json
{ "notes": "这个功能需要先安装 xxx，然后配置 yyy，还要注意 zzz 的兼容性问题，另外 aaa 团队说过 bbb 的要求是 ccc..." }
```

**解决**：notes 保持简短（1-2 句），详细信息放在 commit message、ADR 或 docs/ 目录中。

### 反模式 4：Agent 自行创建顶层任务

Agent 在工作中发现新任务就自己往 progress.json 添加——导致任务列表失控。

**解决**：在 CLAUDE.md 中明确规定：

```markdown
# Task Management Rules
- You may update task status and add subtasks
- Do NOT create new top-level tasks without human approval
- If you discover work that needs a new task, note it in the current task's notes field
```

### 反模式 5：一个巨大的 progress.json 永不归档

文件增长到 500+ 行，Agent 每次启动都要读取，浪费上下文。

**解决**：使用第 7 节的扩展策略，定期归档已完成任务。

### FAQ

**Q：progress.json 应该放在仓库的哪里？**

A：推荐放在项目根目录或 `.claude/progress.json`。在 CLAUDE.md 中指明路径。

**Q：多人开发时 progress.json 会冲突吗？**

A：可能会。建议按域拆分（策略二），或使用外部工具（Linear/Jira）做主要任务管理，progress.json 只用于 Agent 的本地会话追踪。

**Q：feature_list.json 的 200 个功能太多了怎么办？**

A：Anthropic 的 200 是面向完整应用的基准。小项目可以调整为 20-50 个。关键是覆盖所有可测试的功能点。

**Q：可以用 YAML 代替 JSON 吗？**

A：不推荐。JSON 的严格语法对 Agent 更友好，减少格式损坏的风险。

---

## 10. 参考资源

### Anthropic 官方

- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — 进度追踪的核心思想来源
- [Anthropic autonomous-coding quickstart](https://github.com/anthropics/claude-quickstarts/tree/main/autonomous-coding) — Initializer Agent + Coding Agent 的完整实现
- [Initializer Prompt](https://github.com/anthropics/claude-quickstarts/blob/main/autonomous-coding/prompts/initializer_prompt.md) — feature_list.json 生成的完整指令
- [2026 Agentic Coding Trends Report](https://resources.anthropic.com/2026-agentic-coding-trends-report) — 行业趋势

### Claude Code

- [Claude Code Task Management](https://claudefa.st/blog/guide/development/task-management) — 原生 Task 系统详解
- [Claude Code Common Workflows](https://code.claude.com/docs/en/common-workflows) — 官方工作流文档
- [Agent SDK Todo Tracking](https://platform.claude.com/docs/en/agent-sdk/todo-tracking) — Agent SDK 中的 Todo 追踪

### 社区实践

- [Skill Issue: Harness Engineering for Coding Agents](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents) — 社区 Harness 实践
- [Writing a Good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md) — CLAUDE.md 编写指南
- [Beads: Git-Friendly Issue Tracker for AI Agents](https://betterstack.com/community/guides/ai/beads-issue-tracker-ai-agents/) — Agentic Memory Decay 模式
- [Claude Task Master](https://github.com/eyaltoledano/claude-task-master) — 社区 tasks.json CLI 工具
- [MDTM - Roo Commander](https://github.com/jezweb/roo-commander/wiki/02_Core_Concepts-03_MDTM_Explained) — 一文件一任务模式

### 外部工具集成

- [Automate Jira-GitHub with Codex](https://developers.openai.com/cookbook/examples/codex/jira-github) — OpenAI Codex + Jira 自动化
- [GitHub Copilot Coding Agent for Jira](https://github.blog/changelog/2026-03-05-github-copilot-coding-agent-for-jira-is-now-in-public-preview/) — Copilot + Jira 集成

### 本项目内部

- [Harness Engineering 实操手册](../Harness%20Engineering%20实操手册.md) — 第 7 章：会话与状态管理

---

> **文档版本**: v1.1 | **创建日期**: 2026-03-22 | **最后更新**: 2026-03-22 | **作者**: Generated with research
