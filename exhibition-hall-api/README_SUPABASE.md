# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com/) 并登录
2. 点击 "New Project" 创建一个新项目
3. 填写项目名称和密码，选择合适的地区
4. 等待项目创建完成

## 2. 获取 Supabase 配置信息

项目创建完成后，进入项目设置页面：

1. 点击左侧导航栏中的 "Settings"
2. 点击 "API" 选项卡
3. 复制以下信息：
   - `Project URL`：用于 `supabaseUrl`
   - `anon` 密钥：用于 `supabaseKey`

## 3. 配置 Supabase 客户端

编辑 `config/supabase.js` 文件，填入获取到的配置信息：

```javascript
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = '你的Project URL';
const supabaseKey = '你的anon密钥';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
```

## 4. 创建数据库表

在 Supabase 控制台中创建以下表：

### 4.1 `users` 表

| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `text` | `PRIMARY KEY` | 用户ID |
| `name` | `text` | `NOT NULL` | 用户名 |
| `email` | `text` | `UNIQUE NOT NULL` | 邮箱 |
| `password` | `text` | `NOT NULL` | 密码（加密存储） |
| `role` | `text` | `NOT NULL` | 角色 |
| `createdAt` | `timestamp with time zone` | `DEFAULT now()` | 创建时间 |

### 4.2 `roles` 表

| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `text` | `PRIMARY KEY` | 角色ID |
| `name` | `text` | `UNIQUE NOT NULL` | 角色名称 |
| `permissions` | `jsonb` | `NOT NULL` | 权限列表 |

### 4.3 `projects` 表

| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `text` | `PRIMARY KEY` | 项目ID |
| `name` | `text` | `NOT NULL` | 项目名称 |
| `description` | `text` | | 项目描述 |
| `creator` | `text` | `NOT NULL` | 创建者ID |
| `members` | `jsonb` | `NOT NULL` | 项目成员列表 |
| `createdAt` | `timestamp with time zone` | `DEFAULT now()` | 创建时间 |
| `updatedAt` | `timestamp with time zone` | `DEFAULT now()` | 更新时间 |

## 5. 初始化默认数据

### 5.1 初始化默认角色

在 `roles` 表中插入默认角色：

```sql
INSERT INTO roles (id, name, permissions) VALUES
('1', 'user', '["read"]'),
('2', 'admin', '["read", "write", "delete"]');
```

### 5.2 初始化默认管理员用户

在 `users` 表中插入默认管理员用户（密码为 `admin123`，已加密）：

```sql
INSERT INTO users (id, name, email, password, role) VALUES
('1', 'Admin', 'admin@example.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin');
```

## 6. 运行服务

1. 确保已安装依赖：
   ```bash
   npm install
   ```

2. 启动后端服务：
   ```bash
   npm run dev
   ```

服务将运行在 `http://localhost:5001`（或配置的其他端口）。

## 7. 测试 API

可以使用 Postman 或其他 API 测试工具测试以下端点：

### 7.1 认证
- `POST /api/auth/register`：注册新用户
- `POST /api/auth/login`：用户登录

### 7.2 项目管理
- `POST /api/projects`：创建新项目
- `GET /api/projects`：获取用户的所有项目
- `GET /api/projects/:id`：获取单个项目详情
- `PUT /api/projects/:id`：更新项目信息
- `DELETE /api/projects/:id`：删除项目

### 7.3 项目成员管理
- `POST /api/projects/:projectId/members`：添加项目成员
- `DELETE /api/projects/:projectId/members/:userId`：移除项目成员
- `PUT /api/projects/:projectId/members/:userId`：更新项目成员角色

## 8. 注意事项

- 确保 Supabase 项目的数据库设置正确
- 确保环境变量配置正确
- 生产环境中应使用 HTTPS
- 定期备份数据库

## 9. 故障排除

如果遇到问题，可以：

1. 检查 Supabase 控制台中的错误日志
2. 检查后端服务的运行日志
3. 确保数据库表结构正确
4. 确保 Supabase 配置信息正确