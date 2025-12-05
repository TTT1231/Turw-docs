#!/bin/bash
# ================== 服务器 ===================
# !@deprecated
# !由于服务器运行内存低，实测会遇到build过程被kill的情况（因此通过git自动部署被弃用）
# !因此采用先在本地build好后，上传zip包到服务器，再由该脚本解压更新的方式进行部署
# 项目目录: /home/Turw-docs/
# 服务器定期执行（用户级cron-每天凌晨执行一次）
# crontab -e
# 0 0 * * * /home/Turw-docs/deploy-cloud.sh > /dev/null 2>&1
# ============================================

cd /home/Turw-docs/

git pull --rebase

# 检查代码更新...
if [ $? -eq 0 ] && git status | grep -q "up to date"; then
   # 没有更新
   exit 0
fi

pnpm i

pnpm run docs:build

/www/server/nginx/sbin/nginx -s reload

