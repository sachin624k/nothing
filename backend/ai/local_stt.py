import whisper
import sys

model = whisper.load_model("small")  # handles Hinglish well
audio_path = sys.argv[1]

result = model.transcribe(audio_path, language="hi")  # Hindi/Hinglish mode
print(result["text"])
