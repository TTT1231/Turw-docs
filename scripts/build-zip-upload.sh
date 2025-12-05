#!/bin/bash
# ========== 构建dist.zip并上传到服务器中 ================
# 该脚本主要完成`scripts/deploy-externel.sh`脚本前置工作打包工作，解决内存不够的问题
# =======================================================

# 构建 VitePress
echo "Building VitePress..."
pnpm vitepress build docs

# 创建 zip 文件
echo "Creating zip archive..."
cd docs/.vitepress
powershell.exe -Command "Compress-Archive -Path ./dist/* -DestinationPath ./dist.zip -Force"
cd ../..

# 上传到服务器
echo "Uploading to server..."
TIMESTAMP=$(powershell.exe -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'" | tr -d '\r')
scp ./docs/.vitepress/dist.zip root@139.199.156.219:/home/Turw-docs/docs/.vitepress/.build-temp/$TIMESTAMP.zip

echo "Done!"
