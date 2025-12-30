from flask import Flask, request, jsonify, send_file, render_template
import yt_dlp
import os
import uuid
import threading
import time

app = Flask(__name__)

# Directory for temporary files
DOWNLOAD_DIR = '/tmp/youtube-mp3'
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Store download progress
downloads = {}

def cleanup_old_files():
    """Clean up files older than 10 minutes"""
    while True:
        time.sleep(300)  # Check every 5 minutes
        now = time.time()
        for filename in os.listdir(DOWNLOAD_DIR):
            filepath = os.path.join(DOWNLOAD_DIR, filename)
            if os.path.isfile(filepath):
                if now - os.path.getmtime(filepath) > 600:  # 10 minutes
                    try:
                        os.remove(filepath)
                    except:
                        pass

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
cleanup_thread.start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/info', methods=['POST'])
def get_info():
    """Get video information"""
    data = request.get_json()
    url = data.get('url', '')

    if not url:
        return jsonify({'error': '請輸入 YouTube 連結'}), 400

    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            return jsonify({
                'success': True,
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail', ''),
                'video_id': info.get('id', '')
            })
    except Exception as e:
        return jsonify({'error': f'無法取得影片資訊: {str(e)}'}), 400

@app.route('/api/convert', methods=['POST'])
def convert():
    """Convert YouTube video to MP3"""
    data = request.get_json()
    url = data.get('url', '')

    if not url:
        return jsonify({'error': '請輸入 YouTube 連結'}), 400

    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        output_path = os.path.join(DOWNLOAD_DIR, f'{file_id}.mp3')

        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': os.path.join(DOWNLOAD_DIR, f'{file_id}.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'audio')

        # Check if file exists
        if os.path.exists(output_path):
            return jsonify({
                'success': True,
                'file_id': file_id,
                'title': title,
                'download_url': f'/api/download/{file_id}'
            })
        else:
            return jsonify({'error': '轉換失敗，請稍後再試'}), 500

    except Exception as e:
        return jsonify({'error': f'轉換失敗: {str(e)}'}), 500

@app.route('/api/download/<file_id>')
def download(file_id):
    """Download the converted MP3 file"""
    # Sanitize file_id to prevent path traversal
    file_id = file_id.replace('/', '').replace('\\', '').replace('..', '')
    filepath = os.path.join(DOWNLOAD_DIR, f'{file_id}.mp3')

    if os.path.exists(filepath):
        return send_file(
            filepath,
            as_attachment=True,
            download_name='audio.mp3',
            mimetype='audio/mpeg'
        )
    else:
        return jsonify({'error': '檔案不存在或已過期'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
