# 🏗️ Molecule 3.x 架构重构实施指南

## 📋 重构成果总结

### ✅ 已完成的重构

1. **统一类型系统** (`packages/types/`)
   - 核心类型定义 (`core/`)
   - UI组件类型 (`ui/`)
   - 扩展系统类型 (`extensions/`)
   - 完整的TypeScript类型覆盖

2. **共享工具包** (`packages/shared/`)
   - 存储管理工具
   - 性能优化工具
   - 数据验证工具
   - 错误处理系统
   - 测试工具

3. **新核心架构** (`packages/core-new/`)
   - 依赖注入容器
   - 事件总线系统
   - 生命周期管理
   - 基础服务类

### 🎯 架构优势

#### 1. **清晰的分层架构**
```
┌─────────────────┐
│   Extensions    │  插件和扩展
├─────────────────┤
│   UI Layer      │  用户界面组件
├─────────────────┤
│  Service Layer  │  业务服务
├─────────────────┤
│ Foundation Layer│  基础设施
└─────────────────┘
```

#### 2. **模块化设计**
- **types**: 统一的类型定义，确保类型安全
- **shared**: 通用工具和常量，避免重复代码
- **core**: 核心业务逻辑，框架无关
- **ui-***: 按功能域划分的UI组件
- **extensions**: 可插拔的功能扩展

#### 3. **依赖注入架构**
- 服务解耦，便于测试和替换
- 支持单例、瞬态、作用域生命周期
- 自动依赖解析和循环依赖检测

#### 4. **事件驱动通信**
- 组件间松耦合通信
- 支持事件过滤、优先级、一次性监听
- 全局和局部事件总线

## 🚀 实施步骤

### 第一阶段：基础设施迁移

1. **安装新依赖**
```bash
cd /workspace
pnpm install
pnpm build
```

2. **更新现有包的依赖**
```json
// 在现有包的 package.json 中添加
{
  "dependencies": {
    "@dtinsight/molecule-types": "workspace:*",
    "@dtinsight/molecule-shared": "workspace:*"
  }
}
```

### 第二阶段：服务迁移

1. **重构现有服务**
```typescript
// 旧的服务实现
export class OldEditorService {
  // 混乱的实现
}

// 新的服务实现
import { BaseService } from '@dtinsight/molecule-core';
import { ServiceIds } from '@dtinsight/molecule-core';

@Service(ServiceIds.EditorService)
export class EditorService extends BaseService {
  constructor() {
    super(ServiceIds.EditorService, 'Editor Service');
  }

  protected async onInitialize(): Promise<void> {
    // 初始化逻辑
  }

  protected onDispose(): void {
    // 清理逻辑
  }
}
```

2. **注册服务到容器**
```typescript
import { globalContainer, ServiceIds } from '@dtinsight/molecule-core';

// 注册服务
globalContainer.registerType(
  ServiceIds.EditorService,
  EditorService,
  { lifetime: ServiceLifetime.Singleton }
);

// 使用服务
const editorService = globalContainer.get<EditorService>(ServiceIds.EditorService);
```

### 第三阶段：状态管理优化

1. **统一状态管理**
```typescript
// 使用新的类型定义
import type { IEditorState, IEditorService } from '@dtinsight/molecule-types';

// 创建类型安全的store
export const useEditorStore = create<IEditorState>()((set, get) => ({
  // 状态定义
}));
```

2. **移除重复状态**
- 合并 `core/stores` 和 `ui/stores`
- 按功能域重新组织状态
- 使用依赖注入管理store实例

### 第四阶段：UI组件重构

1. **创建UI基础包**
```bash
mkdir -p packages/ui-foundation/src/{primitives,compositions,hooks,providers}
```

2. **按功能域组织组件**
- `ui-foundation`: 基础UI组件
- `ui-workbench`: 工作台相关组件
- `ui-editor`: 编辑器相关组件

### 第五阶段：扩展系统升级

1. **实现新的扩展API**
```typescript
import type { IPlugin } from '@dtinsight/molecule-types';

export class MyExtension implements IPlugin {
  readonly id = 'my-extension';
  readonly manifest = { /* 扩展清单 */ };

  async activate(context: IPluginContext): Promise<void> {
    // 激活逻辑
  }
}
```

## 🔧 迁移工具

### 自动化脚本

```bash
#!/bin/bash
# migrate-services.sh

echo "开始迁移服务..."

# 1. 更新导入语句
find packages/ -name "*.ts" -type f -exec sed -i 's/@dtinsight\/molecule-core\/old/@dtinsight\/molecule-core/g' {} \;

# 2. 更新类型引用
find packages/ -name "*.ts" -type f -exec sed -i 's/import.*from.*old-types/import type {} from "@dtinsight\/molecule-types"/g' {} \;

echo "服务迁移完成！"
```

### 类型检查脚本

```bash
#!/bin/bash
# type-check.sh

echo "检查类型兼容性..."

for package in packages/*/; do
  if [ -f "$package/tsconfig.json" ]; then
    echo "检查 $package"
    cd "$package" && pnpm type-check
    cd - > /dev/null
  fi
done

echo "类型检查完成！"
```

## 🧪 测试策略

### 1. 单元测试
```typescript
import { TestEnvironment, MockEventEmitter } from '@dtinsight/molecule-shared';

describe('EditorService', () => {
  let env: TestEnvironment;
  let service: EditorService;

  beforeEach(() => {
    env = new TestEnvironment();
    service = env.registerService(new EditorService());
  });

  afterEach(() => {
    env.dispose();
  });

  test('should initialize correctly', async () => {
    await service.initialize();
    expect(service.isInitialized()).toBe(true);
  });
});
```

### 2. 集成测试
```typescript
describe('Service Integration', () => {
  test('should resolve dependencies correctly', () => {
    const container = new Container();
    
    container.registerType(ServiceIds.EditorService, EditorService);
    container.registerType(ServiceIds.ThemeService, ThemeService);
    
    const editor = container.get<EditorService>(ServiceIds.EditorService);
    expect(editor).toBeDefined();
  });
});
```

## 📊 性能优化

### 1. 代码分割
```typescript
// 动态导入扩展
const loadExtension = async (id: string) => {
  const { default: Extension } = await import(`./extensions/${id}`);
  return Extension;
};
```

### 2. 懒加载服务
```typescript
// 延迟初始化服务
container.register(
  ServiceIds.HeavyService,
  () => import('./heavy-service').then(m => new m.HeavyService()),
  { lifetime: ServiceLifetime.Singleton }
);
```

## 🔍 监控和调试

### 1. 服务状态监控
```typescript
// 获取所有服务状态
const serviceStats = globalContainer.getRegisteredServices().map(id => {
  const service = globalContainer.get(id);
  return service.getStats?.() || { id, status: 'unknown' };
});

console.table(serviceStats);
```

### 2. 事件调试
```typescript
// 启用事件调试
globalEventBus.on('*', (event) => {
  console.log(`[EVENT] ${event.type}:`, event.payload);
});
```

## 🎯 最佳实践

### 1. 服务设计原则
- **单一职责**: 每个服务只负责一个业务域
- **依赖倒置**: 依赖抽象而不是具体实现
- **开闭原则**: 对扩展开放，对修改封闭

### 2. 错误处理
```typescript
try {
  await service.performOperation();
} catch (error) {
  if (ErrorUtils.isRecoverable(error)) {
    // 尝试恢复
    await ErrorUtils.retry(() => service.performOperation());
  } else {
    // 记录错误并通知用户
    globalErrorHandler.handle(error);
  }
}
```

### 3. 性能监控
```typescript
const monitor = new PerformanceMonitor();

monitor.mark('operation-start');
await performOperation();
monitor.measure('operation-duration', 'operation-start');

const stats = monitor.getStats('operation-duration');
console.log(`Operation took ${stats.average}ms on average`);
```

## 🚀 部署和发布

### 1. 构建流程
```bash
# 构建所有包
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm type-check

# 发布
pnpm changeset version
pnpm changeset publish
```

### 2. 版本管理
- 使用 [Changesets](https://github.com/changesets/changesets) 管理版本
- 遵循 [语义化版本](https://semver.org/) 规范
- 保持向后兼容性

## 📝 文档更新

1. **API文档**: 使用 TypeDoc 生成
2. **用户指南**: 更新使用示例
3. **迁移指南**: 提供详细的升级步骤
4. **架构文档**: 说明新的设计理念

## 🎉 总结

通过这次重构，我们实现了：

- ✅ **模块化架构**: 清晰的包划分和依赖关系
- ✅ **类型安全**: 完整的TypeScript类型定义
- ✅ **可测试性**: 依赖注入和模拟对象支持
- ✅ **可扩展性**: 插件化架构和事件驱动
- ✅ **可维护性**: 标准化的服务基类和错误处理
- ✅ **性能优化**: 懒加载、缓存和资源池
- ✅ **开发体验**: 丰富的开发工具和调试支持

这个新架构为Molecule 3.x的长期发展奠定了坚实的基础，支持团队高效协作和功能快速迭代。