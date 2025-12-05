# ========== 构建dist.zip并上传到服务器中 ================
# 该脚本主要完成`scripts/deploy-externel.sh`脚本前置工作打包工作，解决内存不够的问题
# =======================================================

# 构建 VitePress
Write-Host "Building VitePress..."
pnpm vitepress build docs

# 创建 zip 文件
Write-Host "Creating zip archive..."
Push-Location docs/.vitepress
Compress-Archive -Path ./dist/* -DestinationPath ./dist.zip -Force
Pop-Location

# 上传到服务器
Write-Host "Uploading to server..."
$TIMESTAMP = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
scp ./docs/.vitepress/dist.zip root@139.199.156.219:/home/Turw-docs/docs/.vitepress/.build-temp/$TIMESTAMP.zip

Write-Host "Done!"
