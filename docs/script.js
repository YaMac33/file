    const FUNCTION_URL = 'https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/upload'; // <-- Netlify の関数URLに置き換える

    function fileToDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = document.getElementById('fileInput').files[0];
      if (!file) return alert('ファイルを選んでください');
      // サイズチェック（クライアント側で制限）
      const MAX_BYTES = 4 * 1024 * 1024; // 例: 4MB（Netlify のペイロード制限を考慮）
      if (file.size > MAX_BYTES) {
        return alert('ファイルが大きすぎます（最大 4MB）');
      }
      try {
        const dataUrl = await fileToDataURL(file);
        const base64 = dataUrl.split(',')[1]; // "data:<mime>;base64,<data>" の後半
        const payload = {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          contentBase64: base64,
          caption: document.getElementById('caption').value || ''
        };
        const res = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text || 'Upload failed');
        document.getElementById('result').textContent = 'アップロード成功: ' + text;
      } catch (err) {
        document.getElementById('result').textContent = 'エラー: ' + err.message;
      }
    });
