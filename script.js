const urlInput = document.getElementById('url-input');
const convertBtn = document.getElementById('convert-btn');
const status = document.getElementById('status');
const result = document.getElementById('result');
const thumbnail = document.getElementById('thumbnail');
const videoTitle = document.getElementById('video-title');
const videoDuration = document.getElementById('video-duration');

// Download buttons
const btnY2mate = document.getElementById('btn-y2mate');
const btnSsyoutube = document.getElementById('btn-ssyoutube');
const btnLoader = document.getElementById('btn-loader');

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
    showStatus('正在準備...', '');

    // Show video thumbnail
    thumbnail.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    videoTitle.textContent = '選擇下方任一服務下載';
    videoDuration.textContent = '如果一個不行，試試其他的';

    // Set up converter URLs
    btnY2mate.href = `https://www.y2mate.com/youtube-mp3/${videoId}`;
    btnSsyoutube.href = `https://ssyoutube.com/watch?v=${videoId}`;
    btnLoader.href = `https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=mp3`;

    result.classList.remove('hidden');
    showStatus('準備完成！點擊任一按鈕下載', 'success');
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
