---
outline: deep
---

# 常见问题及其解决方案

主要讲解项目中遇到的问题及其解决方案。

## 大文件分片上传
**思路**：获取文件信息，然后进行分片，分片使用form表单上传（前端）  
后端接受分片存储在一个临时目录中（可以按文件id进行临时存储）  
最后存储完毕，对所有分片结果进行合并
```js
//===========================前端================================
const handleUpLoadFiles = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files![0];
  const fileName = file.name;

  const chunkSize = 1024 * 1024; // 1MB
  const chunkSizeTotal = Math.ceil(file.size / chunkSize); //分片总数

  const fileId = generateUUID(); //文件id可以随意生成，唯一就可以以便临时存储

  for (let i = 0; i < chunkSizeTotal; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);

    const chunk = file.slice(start, end);    //获取当前分片

    //创建FormData对象
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("fileId", fileId);
    formData.append("chunkIndex", i.toString());

    $fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  }
  //合并
  await $fetch("/api/merage", {
    method: "POST",
    body: { fileId, fileName },
  });
};
//===========================后端================================
//前端传递过来的分片数据进行临时目录存储
export default defineEventHandler(async (event)=> {
    //这里不考虑上传分片过来数据错误
    const formData = await readMultipartFormData(event)
    const file =  formData?.find(item=>item.name === 'file')
    const fileID =  formData?.find(item=>item.name === 'fileId')?.data.toString()
    const chunkIndex = formData?.find(item=>item.name === 'chunkIndex')?.data.toString()
    //分片要存放目录
    const chunkDir = path.join(process.cwd(), 'uploads', fileID) 
    //分片目标存放位置
    const chunkPath = path.join(chunkDir, chunkIndex)
    fs.ensureDirSync(chunkDir)
    fs.writeFileSync(chunkPath, file.data)

    return 'success'
})
//合并分片就简单多了，主要逻辑是获取分片的目标位置，然后读取所有分片数据(注意排序)，最后写入
```

