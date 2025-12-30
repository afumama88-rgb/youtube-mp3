const urlInput = document.getElementById('url-input');
const convertBtn = document.getElementById('convert-btn');
const status = document.getElementById('status');
const result = document.getElementById('result');
const thumbnail = document.getElementById('thumbnail');
const videoTitle = document.getElementById('video-title');
const videoDuration = document.getElementById('video-duration');
const downloadBtn = document.getElementById('download-btn');

// Cobalt API endpoint
const COBALT_API = 'https://api.cobalt.tools/api/json';

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

    setLoading(true);
    showStatus('正在處理中...', '');
    result.classList.add('hidden');

    try {
        // Get video info
        const videoId = extractVideoId(url);
        if (videoId) {
            thumbnail.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }

        // Call Cobalt API
        const response = await fetch(COBALT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                vCodec: 'h264',
                vQuality: '720',
                aFormat: 'mp3',
                isAudioOnly: true,
                isNoTTWatermark: true,
                isTTFullAudio: true
            })
        });

        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.text || '轉換失敗');
        }

        if (data.status === 'redirect' || data.status === 'stream') {
            const downloadUrl = data.url;

            videoTitle.textContent = '音訊已準備就緒';
            videoDuration.textContent = '點擊下方按鈕下載';
            downloadBtn.href = downloadUrl;
            downloadBtn.target = '_blank';

            result.classList.remove('hidden');
            showStatus('轉換成功！', 'success');
        } else if (data.status === 'picker') {
            // Multiple options available
            const audioOption = data.picker.find(p => p.type === 'audio') || data.picker[0];
            if (audioOption) {
                videoTitle.textContent = '音訊已準備就緒';
                videoDuration.textContent = '點擊下方按鈕下載';
                downloadBtn.href = audioOption.url;
                downloadBtn.target = '_blank';

                result.classList.remove('hidden');
                showStatus('轉換成功！', 'success');
            } else {
                throw new Error('找不到音訊選項');
            }
        } else {
            throw new Error('未知的回應格式');
        }

    } catch (error) {
        console.error('Error:', error);

        // Fallback: open external converter
        showStatus('API 暫時無法使用，正在開啟備用服務...', 'error');
        setTimeout(() => {
            const videoId = extractVideoId(url);
            if (videoId) {
                window.open(`https://www.y2mate.com/youtube-mp3/${videoId}`, '_blank');
            } else {
                window.open(`https://www.y2mate.com/youtube-mp3`, '_blank');
            }
        }, 1500);
    } finally {
        setLoading(false);
    }
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
