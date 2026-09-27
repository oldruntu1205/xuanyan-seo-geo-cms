// SUNS 生产进程定义（PM2）
//
// 部署目标：prod 43.132.209.126 / www.opctools.cloud
// 运行用户：www（与 nginx worker 一致，媒体与静态产物可写）
//
// 启动/重载（以 www 身份）：
//   su -s /bin/bash www -c "export HOME=/home/www PATH=/usr/local/bin:/usr/bin:/bin; \
//     pm2 start /www/wwwroot/opctools/ecosystem.config.cjs"
//
// 设计要点：
//   1. 直接托管 node 可执行入口，**不套 pnpm**。曾用 `pnpm --filter ... start`，
//      实测 PM2 只追踪到 pnpm 包装进程（~85MB），真正的 next-server 是子进程：
//      max_memory_restart 形同虚设，重启还会留下占住 3001 的孤儿进程。
//   2. 公开页面由 nginx 直出 static-site，不进这两个进程；它们只服务
//      /admin /manage /api /media 与发布队列。
//   3. --max-old-space-size 与该机 1.9G 内存（与 myworkbuddy 等站点共存）匹配，
//      宁可让单进程 OOM 重启，也不要拖垮整机。
module.exports = {
  apps: [
    {
      name: 'suns-cms',
      cwd: '/www/wwwroot/opctools/apps/cms',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      interpreter: '/usr/local/bin/node',
      node_args: '--max-old-space-size=480',
      // NODE_PATH 兜底：Next 的 .next/node_modules/<pkg>-<hash> 是构建机 trace 出来的副本，
      // 在 pnpm 隔离结构下解析不到自身的传递依赖（实测 sharp 缺 detect-libc）。
      // 该目录是 pnpm 的提升目录，含全部依赖与 Linux 平台二进制。
      env: {
        NODE_ENV: 'production',
        HOME: '/home/www',
        NODE_PATH: '/www/wwwroot/opctools/node_modules/.pnpm/node_modules',
      },
      max_memory_restart: '700M',
      kill_timeout: 8000,
      autorestart: true,
      time: true,
      merge_logs: true,
      out_file: '/www/wwwlogs/opctools/cms.out.log',
      error_file: '/www/wwwlogs/opctools/cms.err.log',
    },
    {
      name: 'suns-worker',
      cwd: '/www/wwwroot/opctools/apps/worker',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/index.ts',
      interpreter: '/usr/local/bin/node',
      node_args: '--max-old-space-size=256',
      env: {
        NODE_ENV: 'production',
        HOME: '/home/www',
        NODE_PATH: '/www/wwwroot/opctools/node_modules/.pnpm/node_modules',
      },
      max_memory_restart: '350M',
      kill_timeout: 8000,
      autorestart: true,
      time: true,
      merge_logs: true,
      out_file: '/www/wwwlogs/opctools/worker.out.log',
      error_file: '/www/wwwlogs/opctools/worker.err.log',
    },
  ],
};
