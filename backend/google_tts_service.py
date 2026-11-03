import sys
from gtts import gTTS


def generate_speech(text, output_file):
    if not text or not text.strip():
        raise ValueError("Nội dung văn bản không được để trống.")

    tts = gTTS(
        text=text,
        lang="vi",
        slow=False
    )

    # Trả âm thanh trực tiếp cho ExpressJS
    if output_file == "-":
        tts.write_to_fp(sys.stdout.buffer)

    # Hoặc lưu thành file MP3 như trước
    else:
        tts.save(output_file)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(
            "Usage: python google_tts_service.py <text> <output_file>",
            file=sys.stderr
        )
        sys.exit(1)

    text = sys.argv[1]
    output_file = sys.argv[2]

    try:
        generate_speech(text, output_file)

        # Không in thông báo vào dữ liệu âm thanh
        if output_file != "-":
            print("GOOGLE_TTS_SUCCESS")

    except Exception as error:
        print(
            f"GOOGLE_TTS_ERROR: {error}",
            file=sys.stderr
        )
        sys.exit(1)