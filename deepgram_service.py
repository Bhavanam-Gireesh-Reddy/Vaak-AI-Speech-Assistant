import os
import io
import asyncio
from typing import AsyncGenerator
from deepgram import (
    DeepgramClient,
    LiveTranscriptionEvents,
    LiveOptions,
)

DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY")

async def stream_to_deepgram(audio_generator: AsyncGenerator[bytes, None]) -> AsyncGenerator[dict, None]:
    """
    Takes an async generator of raw audio bytes (e.g. from a WebSocket)
    and streams them to Deepgram for real-time transcription & diarization.
    Yields parsed dialogue chunks with speaker labels.
    """
    if not DEEPGRAM_API_KEY or DEEPGRAM_API_KEY == "YOUR_DEEPGRAM_API_KEY_HERE":
        yield {"error": "Deepgram API key not configured."}
        return

    deepgram = DeepgramClient(DEEPGRAM_API_KEY)
    
    # Create a websocket connection to Deepgram
    # We use asyncio Queue to bridge Deepgram's callback-based events to an AsyncGenerator
    queue = asyncio.Queue()

    try:
        dg_connection = deepgram.listen.asyncwebsocket.v("1")

        async def on_message(self, result, **kwargs):
            sentence = result.channel.alternatives[0].transcript
            if not sentence:
                return

            # Check if there are words and extract speaker info
            words = result.channel.alternatives[0].words
            
            # Simple aggregation of speakers
            # In a robust implementation, we would group words by speaker
            if words and 'speaker' in words[0]:
                speaker_id = words[0]['speaker']
                await queue.put({"speaker": f"speaker_{speaker_id}", "text": sentence, "is_final": result.is_final})
            else:
                await queue.put({"speaker": "unknown", "text": sentence, "is_final": result.is_final})

        async def on_error(self, error, **kwargs):
            await queue.put({"error": str(error)})

        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.Error, on_error)

        # Options for live transcription with diarization
        options = LiveOptions(
            model="nova-2-general",
            language="en-IN", # Optimized for Indian accents!
            smart_format=True,
            encoding="linear16", # Typically raw PCM from browser
            channels=1,
            sample_rate=16000,
            diarize=True, # Enable Speaker Diarization
        )

        if not await dg_connection.start(options):
            yield {"error": "Failed to connect to Deepgram"}
            return

        # Start a background task to pump audio from generator to Deepgram
        async def pump_audio():
            try:
                async for chunk in audio_generator:
                    await dg_connection.send(chunk)
                await dg_connection.finish()
            except Exception as e:
                print(f"Error pumping audio to Deepgram: {e}")
                await queue.put(None) # Signal completion

        bg_task = asyncio.create_task(pump_audio())

        # Yield results from the queue as they come in
        while True:
            # We use a slight timeout to check if the bg_task died prematurely
            try:
                result = await asyncio.wait_for(queue.get(), timeout=1.0)
                if result is None:
                    break
                yield result
            except asyncio.TimeoutError:
                if bg_task.done():
                    break
                continue

    except Exception as e:
        yield {"error": f"Deepgram streaming error: {e}"}
