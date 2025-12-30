from flask import Flask, request, jsonify, send_file, render_template, redirect
import requests
import re
import os

app = Flask(__name__)

# Cobalt API endpoint
COBALT_API = 'https://api.cobalt.tools'

@app.route('/')
def index():
    return render_template('index.html')

def extract_video_id(url):
    """Extract YouTube video ID from URL"""
    patterns = [
        r'youtube\.com\/watch\?v=([\w-]+)',
        r'youtube\.com\/shorts\/([\w-]+)',
        r'youtu\.be\/([\w-]+)',
        r'youtube\.com\/embed\/([\w-]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

@app.route('/api/info', methods=['POST'])
def get_info():
    """Get video information"""
    data = request.get_json()
    url = data.get('url', '')

    if not url:
        return jsonify({'error': '請輸入 YouTube 連結'}), 400

    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({'error': '無效的 YouTube 連結'}), 400

    # Return basic info with thumbnail
    return jsonify({
        'success': True,
        'title': '準備下載中...',
        'thumbnail': f'https://img.youtube.com/vi/{video_id}/mqdefault.jpg',
        'video_id': video_id
    })

@app.route('/api/convert', methods=['POST'])
def convert():
    """Convert YouTube video to MP3 using Cobalt API"""
    data = request.get_json()
    url = data.get('url', '')

    if not url:
        return jsonify({'error': '請輸入 YouTube 連結'}), 400

    try:
        # Call Cobalt API
        response = requests.post(
            f'{COBALT_API}/api/json',
            json={
                'url': url,
                'vCodec': 'h264',
                'vQuality': '720',
                'aFormat': 'mp3',
                'isAudioOnly': True,
                'disableMetadata': False
            },
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout=30
        )

        result = response.json()

        if result.get('status') == 'error':
            return jsonify({'error': result.get('text', '轉換失敗')}), 400

        if result.get('status') in ['redirect', 'stream']:
            return jsonify({
                'success': True,
                'download_url': result.get('url'),
                'title': 'audio'
            })

        if result.get('status') == 'picker':
            # Multiple options, get the first audio one
            picker = result.get('picker', [])
            for item in picker:
                if item.get('type') == 'audio':
                    return jsonify({
                        'success': True,
                        'download_url': item.get('url'),
                        'title': 'audio'
                    })
            # Fallback to first item
            if picker:
                return jsonify({
                    'success': True,
                    'download_url': picker[0].get('url'),
                    'title': 'audio'
                })

        return jsonify({'error': '無法取得下載連結'}), 400

    except requests.exceptions.Timeout:
        return jsonify({'error': '請求超時，請稍後再試'}), 500
    except Exception as e:
        return jsonify({'error': f'轉換失敗: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
