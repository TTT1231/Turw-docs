import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { loadEnv, validateEnv, uploadToServer } from './upload-zip.mjs';

// ========== 构建dist.zip并上传到服务器中,解决内存不够的问题 ================

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// 执行命令并实时输出
function spawnAsync(command, args, options) {
   return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { ...options, stdio: 'inherit', shell: true });
      proc.on('close', (code) => {
         if (code !== 0) {
            reject(new Error(`Command exited with code ${code}`));
         } else {
            console.log('\n✅ Build completed\n');
            resolve();
         }
      });
      proc.on('error', reject);
   });
}

// 创建 ZIP 文件
function createZipArchive(sourceDir, outputPath) {
   return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
         console.log(`✅ Archive created: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
         resolve();
      });

      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
   });
}

// 主函数
async function main() {
   try {
      // 加载环境变量
      const env = loadEnv();
      validateEnv(env);

      //环境变量验证完后，这里做类型安全
      const envConfig = {
         SERVER_USER: env.SERVER_USER,
         SERVER_HOST: env.SERVER_HOST,
         // SERVER_PASSWORD: env.SERVER_PASSWORD,
         SERVER_PRIVATE_KEY_PATH: env.SERVER_PRIVATE_KEY_PATH,
         SERVER_PATH: env.SERVER_PATH,
         SERVER_TEMP_ZIP_PATH: env.SERVER_TEMP_ZIP_PATH,
         GIT_PUSH_BUILD_ZIP_REQUIRE: env.GIT_PUSH_BUILD_ZIP_REQUIRE
      };

      if (envConfig.GIT_PUSH_BUILD_ZIP_REQUIRE.toLowerCase().trim() === 'false') {
         //不要构建和上传
         return;
      }
      // 1. 构建 VitePress
      await spawnAsync('pnpm', ['run', 'docs:build'], { cwd: rootDir });

      // 2. 创建 ZIP 文件
      const distPath = join(rootDir, 'docs', '.vitepress', 'dist');
      const zipPath = join(rootDir, 'docs', '.vitepress', 'dist.zip');
      await createZipArchive(distPath, zipPath);

      // 3. 上传到服务器
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const tempPath = envConfig.SERVER_TEMP_ZIP_PATH || 'temp';
      const remotePath = `${envConfig.SERVER_PATH}/${tempPath}/${timestamp}.zip`;
      await uploadToServer(zipPath, remotePath, envConfig);

      console.log('🎉 Done!');
   } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
   }
}

main();
