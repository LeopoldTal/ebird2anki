Full recordings from eBird have lots of silence, way too slow for flashcards. So I chop 'em up:

1. Download the recordings from eBird. Save them under the species name in `full_audio/`.
2. Clip 2–10 seconds excerpts. I like [Tenacity](https://tenacityaudio.org/). Save the clips under the species name in `clips`.
3. When done with that species, run `node make_audio_cards.js species_name`. It copies the audio clips and photos to the Anki media collection.
4. Import the generated CSV into Anki.
