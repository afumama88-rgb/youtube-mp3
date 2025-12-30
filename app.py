from flask import Flask, request, jsonify, render_template
import re

app = Flask(__name__)

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

@app.route('/api/convert', methods=['POST'])
def convert():
    """Generate download links"""
    data = request.get_json()
    url = data.get('url', '')

    if not url:
        return jsonify({'error': '請輸入 YouTube 連結'}), 400

    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({'error': '無效的 YouTube 連結'}), 400

    # Return thumbnail and converter links
    return jsonify({
        'success': True,
        'video_id': video_id,
        'thumbnail': f'https://img.youtube.com/vi/{video_id}/mqdefault.jpg',
        'converters': [
            {
                'name': 'Cobalt',
                'url': f'https://cobalt.tools/',
                'color': '#1a1a2e'
            },
            {
                'name': 'Y2Mate',
                'url': f'https://www.y2mate.com/youtube-mp3/{video_id}',
                'color': '#4ecdc4'
            },
            {
                'name': '9Convert',
                'url': f'https://9convert.com/download?url=https://www.youtube.com/watch?v={video_id}',
                'color': '#667eea'
            }
        ]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
