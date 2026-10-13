# 美股期权模式

这是 DeepSeek Harness 的可选 Agent preset。用户可以在新会话的 Agent preset 选择器中切换：

- `标准模式`：原来的通用编码 Agent；
- `美股期权模式`：执行自定义的、按标的隔离的期权账本和 CSP / Covered Call 规则。

本 preset 配置策略提示词、通用文件/终端能力和专用账本工具，并由配套账本插件显示页面。模式引导模型分析以下事项；其中现金覆盖、拟议 CC 执行价检查是分析约束与旧版辅助函数，未接入当前页面成为自动交易风控：

- 记录和分析已提供的历史交易数据；
- 按标的累计已确认成交的期权净现金流；
- 计算名义成本和实际成本；
- 检查 CSP 全部行权的现金覆盖；
- 检查 Covered Call 执行价是否严格高于实际成本；
- 检查 Covered Call 股票覆盖数量；
- 通过旧版快照分析适配层输出 `ALLOW`、`BLOCK` 或 `MANUAL_REVIEW`；模型数据不足时提示复核。

相关本地资产：

- `wheel-strategy-spec-v2.md`：当前策略规范；v1 保留为历史原文；
- `option-ledger-core.js`：旧版独立计算与策略检查函数；当前账本不调用它；
- `option-ledger-workflow.js`：旧版快照分析适配层，未自动注册为当前聊天工具；
- `option-ledger.html`：保留的旧版 localStorage 界面，内嵌 CC 调整公式仍不符合 v2；仅作历史参考和旧数据导出，不用于当前成本计算。

当前页面和成本计算分别由 [ledger/client.js](../ledger/client.js) 与 [ledger/ledger.js](../ledger/ledger.js) 实现。参见项目总说明中的[模式定义](../../README.md#mode)与[全部文件职责](../../README.md#files)。

切换规则由 Harness 的 agent-preset-registry 机制负责：已经产生消息或工具调用的会话不能中途换 preset；请在新会话开始前选择模式。

## 0.2.1-alpha.2 安装配置

Web profile 需要 Harness 的 `@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`，以及本模式和 `@local/options-ledger-dashboard` 两个自定义组合包。当前安装入口是 [cordis.patch.yml](cordis.patch.yml)；保留的 `preset.yml` 和 `agent.cordis.yml` 不由统一安装脚本直接读取。详见[统一安装步骤](../../README.md#usage)。

1.0.1 使用 persona.prefix，显式设置待办工具的 allowParallelInProgress，并复用宿主 systemPrompt 服务。策略文字及账本计算文件保持原样。

1.0.2 将旧版 {{cwd}} 模板变量改为当前会话工作目录说明；目录上下文由新版 working-directory 服务提供。期权策略规则和账本计算文件保持不变。

1.2.2 修正部分 CC 行权名义成本公式，采用用户确认的亏损转移口径。模式内自动账本 UI 由配套 options-ledger-dashboard 1.2.2 提供；记录以共享 SQLite 账本为准，旧 HTML 仅作为历史工具保留。

模型工具由期权 preset 的插件组合直接注册，支持空会话从标准模式切换；不依赖创建会话时尚未更新的 header。
