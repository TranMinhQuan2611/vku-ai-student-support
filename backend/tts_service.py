import asyncio
import sys
import edge_tts


async def generate_speech(text, output_file):
    voice = "vi-VN-HoaiMyNeural"

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate="-5%"
    )

    await communicate.save(output_file)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tts_service.py <text> <output_file>")
        sys.exit(1)

    text = sys.argv[1]
    output_file = sys.argv[2]

    try:
        asyncio.run(generate_speech(text, output_file))
        print("TTS_SUCCESS")
    except Exception as error:
        print(f"TTS_ERROR: {error}", file=sys.stderr)
        sys.exit(1)