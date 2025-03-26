export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/favicon.ico') return new Response(null, { status: 404 });

      // 获取毒鸡汤文本
      const { text, originalData } = await getDujiTang();
      
      // 构建HTML基础结构
      let html = buildHtmlBase(text);

      // 尝试生成AI图片（带重试机制）
      let imageSuccess = false;
      let imageAttempts = 0;
      const maxAttempts = 2;
      let generatedImageUrl = null;
      
      while (!imageSuccess && imageAttempts < maxAttempts) {
        try {
          generatedImageUrl = await generateAIImage(text);
          if (generatedImageUrl) {
            html += buildImageSection(generatedImageUrl);
            imageSuccess = true;
          }
        } catch (error) {
          imageAttempts++;
          console.error(`图片生成失败 (尝试 ${imageAttempts}/${maxAttempts}):`, error);
          if (imageAttempts >= maxAttempts) {
            html += buildFallbackImage(error);
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // 完成HTML并返回
      html += buildFooter(originalData);
      return new Response(html, {
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        },
      });

    } catch (error) {
      return errorResponse(error);
    }
  }
};

// 获取毒鸡汤文本
async function getDujiTang() {
  try {
    const response = await fetch('https://v2.xxapi.cn/api/dujitang', {
      headers: {
        'User-Agent': 'Cloudflare-Workers-DujiTang/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`API请求失败: ${response.status}`);

    const data = await response.json();
    return {
      text: data.data || data.dujitang || "今天的毒鸡汤熬糊了...",
      originalData: data
    };
    
  } catch (error) {
    console.error('获取毒鸡汤失败:', error);
    const fallbackQuotes = [
      "你以为有钱人很快乐吗？他们的快乐你根本想象不到",
      "条条大路通罗马，而有些人就生在罗马",
      "你并不是一无所有，你还有病啊",
      "好好活下去，每天都有新打击"
    ];
    return {
      text: fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)],
      originalData: { error: error.message }
    };
  }
}

// 使用Kolors模型生成AI图片
async function generateAIImage(text) {
  try {
    // 构建适合图片生成的prompt
    const imagePrompt = `现代扁平插画风格，毒鸡汤主题: "${text}"，简洁明了，带有讽刺幽默感，明亮色彩，极简主义，干净背景`;
    
    const options = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sk-layzpntgtnqvjmoqhzbcmnlgbvzdwuotdiiufgejsaxycpqp',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "Kwai-Kolors/Kolors",
        prompt: imagePrompt,
        image_size: "512x512",
        batch_size: 1,
        num_inference_steps: 20,
        guidance_scale: 7.5
      })
    };

    const response = await fetch('https://api.siliconflow.cn/v1/images/generations', options);
    const data = await response.json();
    
    if (!response.ok || !data.data || !data.data[0]?.url) {
      throw new Error('AI图片生成失败: ' + (data.error?.message || '未知错误'));
    }
    
    return data.data[0].url;
  } catch (error) {
    throw new Error(`AI图片生成错误: ${error.message}`);
  }
}

// 构建HTML基础结构（美化版）
function buildHtmlBase(text) {
  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>毒鸡汤生成器</title>
    <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --primary-color: #FF6B81;
        --secondary-color: #FF8E9E;
        --dark-color: #333;
        --light-color: #FFF9FA;
        --shadow: 0 4px 20px rgba(255, 107, 129, 0.15);
        --border-radius: 16px;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Noto Sans SC', sans-serif;
        background-color: var(--light-color);
        color: var(--dark-color);
        line-height: 1.6;
        padding: 20px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-image: radial-gradient(circle at 10% 20%, rgba(255, 214, 221, 0.2) 0%, rgba(255, 255, 255, 1) 90%);
      }
      
      .container {
        width: 100%;
        max-width: 800px;
        background: white;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 40px;
        margin: 20px 0;
        position: relative;
        overflow: hidden;
      }
      
      .container::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 8px;
        background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
      }
      
      h1 {
        font-family: 'Ma Shan Zheng', cursive;
        color: var(--primary-color);
        text-align: center;
        margin-bottom: 30px;
        font-size: 2.5rem;
        position: relative;
        display: inline-block;
      }
      
      h1::after {
        content: "";
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 4px;
        background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
        border-radius: 2px;
      }
      
      .quote {
        font-size: 1.4rem;
        margin: 30px 0;
        padding: 25px;
        background-color: var(--light-color);
        border-radius: var(--border-radius);
        position: relative;
        font-weight: 500;
        box-shadow: var(--shadow);
        border-left: 6px solid var(--primary-color);
      }
      
      .quote::before {
        content: "“";
        font-size: 5rem;
        position: absolute;
        top: -20px;
        left: 10px;
        color: rgba(255, 107, 129, 0.1);
        font-family: serif;
      }
      
      .image-container {
        margin: 30px auto;
        width: 100%;
        max-width: 512px;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #FFF0F3, #FFF9FA);
        border-radius: var(--border-radius);
        overflow: hidden;
        position: relative;
        box-shadow: var(--shadow);
        border: 1px dashed rgba(255, 107, 129, 0.3);
      }
      
      .image-container img {
        max-width: 100%;
        max-height: 512px;
        object-fit: contain;
        border-radius: 12px;
        transition: all 0.5s ease;
      }
      
      .image-error {
        color: var(--primary-color);
        padding: 20px;
        text-align: center;
        width: 100%;
      }
      
      .refresh-btn {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 1.1rem;
        border-radius: 50px;
        cursor: pointer;
        margin: 30px auto;
        display: block;
        transition: all 0.3s;
        box-shadow: 0 4px 15px rgba(255, 107, 129, 0.3);
        font-weight: 500;
        letter-spacing: 1px;
      }
      
      .refresh-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(255, 107, 129, 0.4);
      }
      
      .refresh-btn:active {
        transform: translateY(1px);
      }
      
      .loading {
        color: var(--primary-color);
        font-size: 1.2rem;
        text-align: center;
        margin: 40px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 107, 129, 0.2);
        border-radius: 50%;
        border-top-color: var(--primary-color);
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 20px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .debug {
        margin-top: 40px;
        font-size: 0.9rem;
        color: #666;
        width: 100%;
      }
      
      .debug summary {
        cursor: pointer;
        padding: 10px;
        background: #f8f8f8;
        border-radius: 6px;
        outline: none;
      }
      
      .debug pre {
        background: #f8f8f8;
        padding: 15px;
        border-radius: 6px;
        overflow-x: auto;
        margin-top: 10px;
        font-size: 0.85rem;
      }
      
      footer {
        margin-top: auto;
        text-align: center;
        color: #999;
        font-size: 0.9rem;
        padding: 20px;
      }
      
      @media (max-width: 600px) {
        .container {
          padding: 30px 20px;
        }
        
        h1 {
          font-size: 2rem;
        }
        
        .quote {
          font-size: 1.2rem;
          padding: 20px 15px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>毒鸡汤生成器</h1>
      <div class="quote">${text}</div>
      <div id="image-loading" class="loading">
        <div class="loading-spinner"></div>
        <div>AI正在创作毒鸡汤插画...</div>
      </div>`;
}

// 构建图片显示部分（美化版）
function buildImageSection(imageUrl) {
  return `
    <script>
      document.getElementById('image-loading').style.display = 'none';
    </script>
    <div class="image-container">
      <img src="${imageUrl}" 
           alt="AI生成的毒鸡汤插画" 
           onload="this.style.opacity = 1; this.style.transform = 'scale(1)';"
           onerror="handleImageError(this)"
           style="opacity: 0; transform: scale(0.95); transition: all 0.5s ease;">
     
    </div>`;
}

// 构建备用图片（美化版）
function buildFallbackImage(error) {
  return `
    <script>
      document.getElementById('image-loading').style.display = 'none';
    </script>
    <div class="image-container">
      <div class="image-error">
        <p>AI图片生成失败: ${error.message.replace('AI图片生成错误: ', '')}</p>
        <img src="https://placeholder.pics/svg/512x512/FFF0F3/FF6B81/生成失败" 
             alt="备用毒鸡汤图片"
             style="max-width: 80%; margin-top: 20px; border-radius: 8px;">
      </div>
    </div>`;
}

// 构建页脚（美化版）
function buildFooter(originalData) {
  return `
    <button class="refresh-btn" onclick="window.location.reload()">
      <span>换一碗毒鸡汤</span>
      <svg style="margin-left: 8px; width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
    </button>
    <div class="debug">
      <details>
        <summary>调试信息</summary>
        <pre>${JSON.stringify(originalData, null, 2)}</pre>
      </details>
    </div>
    <footer>
      <p>© ${new Date().getFullYear()} AI毒鸡汤生成器 | 每天一碗，神清气爽</p>
    </footer>
    </div>
    <script>
      // 添加点击动画效果
      document.querySelector('.refresh-btn').addEventListener('click', function() {
        this.querySelector('span').textContent = '熬汤中...';
        this.querySelector('svg').style.animation = 'spin 0.7s linear infinite';
      });
    </script>
  </body>
  </html>`;
}

// 错误响应（美化版）完整代码
function errorResponse(error) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>错误</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary-color: #FF6B81;
          --light-color: #FFF9FA;
        }
        
        body { 
          font-family: 'Noto Sans SC', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background-color: var(--light-color);
          text-align: center;
        }
        
        .error-container {
          max-width: 600px;
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 30px rgba(255, 107, 129, 0.15);
          position: relative;
          overflow: hidden;
        }
        
        .error-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, var(--primary-color), #FF8E9E);
        }
        
        h1 { 
          color: var(--primary-color);
          margin-bottom: 20px;
          font-size: 2rem;
        }
        
        .error-details {
          background: #f8f8f8;
          padding: 15px;
          border-radius: 8px;
          margin: 25px 0;
          text-align: left;
          font-family: monospace;
          font-size: 0.9rem;
          max-height: 200px;
          overflow-y: auto;
        }
        
        button { 
          background: linear-gradient(135deg, var(--primary-color), #FF8E9E);
          color: white;
          border: none;
          padding: 14px 28px;
          font-size: 1rem;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 20px;
          font-weight: 500;
          box-shadow: 0 4px 15px rgba(255, 107, 129, 0.3);
        }
        
        button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(255, 107, 129, 0.4);
        }
        
        .error-icon {
          font-size: 4rem;
          color: var(--primary-color);
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <div class="error-icon">🍜</div>
        <h1>毒鸡汤熬糊了</h1>
        <p>服务器在处理您的请求时遇到了问题</p>
        
        <div class="error-details">
          ${error.stack || error.message || '未知错误'}
        </div>
        
        <button onclick="window.location.href='/'">再试一次</button>
      </div>
    </body>
    </html>`,
    {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    }
  );
}

