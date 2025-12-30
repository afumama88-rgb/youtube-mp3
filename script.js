const urlInput = document.getElementById('url-input');
const convertBtn = document.getElementById('convert-btn');
const status = document.getElementById('status');
const result = document.getElementById('result');
const thumbnail = document.getElementById('thumbnail');
const videoTitle = document.getElementById('video-title');
const videoDuration = document.getElementById('video-duration');
const downloadBtn = document.getElementById('download-btn');

convertBtn.addEventListener('click', handleConvert);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleConvert();
});

async function handleConvert() {
    const url = urlInput.value.trim();

    if (!url) {
        showStatus('請輸入 YouTube 連結', 'error');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showStatus('請輸入有效的 YouTube 連結', 'error');
        return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        showStatus('無法解析影片 ID', 'error');
        return;
    }

    setLoading(true);
    showStatus('正在準備下載頁面...', '');

    // Show video thumbnail
    thumbnail.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    videoTitle.textContent = '點擊下方按鈕下載 MP3';
    videoDuration.textContent = '將開啟轉換服務頁面';

    // Use yt1s.com as the converter service
    const converterUrl = `https://www.yt1s.com/youtube-to-mp3?q=${encodeURIComponent(url)}`;
    downloadBtn.href = converterUrl;
    downloadBtn.target = '_blank';

    result.classList.remove('hidden');
    showStatus('準備完成！', 'success');
    setLoading(false);
}

function isValidYouTubeUrl(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
        /^(https?:\/\/)?youtu\.be\/[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
}

function extractVideoId(url) {
    const patterns = [
        /youtube\.com\/watch\?v=([\w-]+)/,
        /youtube\.com\/shorts\/([\w-]+)/,
        /youtu\.be\/([\w-]+)/,
        /youtube\.com\/embed\/([\w-]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status';
    if (type) status.classList.add(type);
}

function setLoading(loading) {
    convertBtn.disabled = loading;
    convertBtn.textContent = loading ? '處理中...' : '轉換';
}
