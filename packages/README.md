# Portal `packages/` — 消费方缓存

本目录下的 `@acongm/*` 包 **不由 portal 仓维护**，仅从 canonical 源同步：

| 包 | 唯一源仓库 | 同步命令 |
|----|------------|----------|
| `@acongm/auth-client` | [Acongm/auth](https://github.com/Acongm/auth) | `auth/scripts/sync-auth-client-to-consumers.sh` |
| `@acongm/chat-ui` 等 chat 包 | [Acongm/chat](https://github.com/Acongm/chat) | `chat/scripts/sync-chat-packages-to-portal.sh` |

接入文档：

- Auth：`auth/docs/module-integration.md`
- Chat：`chat/docs/module-integration.md`

**不要** 在本目录直接改业务逻辑；在源仓改完后执行同步脚本，再提交 portal。
