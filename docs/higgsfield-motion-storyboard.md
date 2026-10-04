# Pearl Panda motion clips

The user requested Higgsfield-generated scroll animations. On 2026-10-04, the
first Seedance 2.5 request was rejected: "Out of credits on pro (monthly) plan
in Private workspace." No paid generation succeeded and no generated footage
is included. The website currently uses real-time Three.js and CSS motion.

When credits are available, generate these 5-second, 16:9, 720p clips without
audio. Keep each clip as one continuous shot, with slow motion suitable for
scroll seeking, and no text or watermark.

1. **Pearl / growth**: ivory ceramic pearl suspended among three emerald bamboo
   leaves and a fine brushed gold ring. Leaves unwrap, orbit the pearl, and
   return. Warm ivory #f5f7ee seamless backdrop, soft studio illumination,
   dark green #0B1F16, spring green #70B85A, restrained #DAAF37 gold.
2. **Bamboo / connection**: sculptural glossy green bamboo leaves unfold from
   one curved stem. Small pearls travel gently between the leaves, connecting
   into a balanced circular arrangement. Consistent palette and background.
3. **Panda / brand**: using the provided panda-and-bamboo logo as a reference,
   sculpt an ivory ceramic panda with deep green ears, eye patches and paws
   hugging emerald bamboo. Slowly orbit from a three-quarter view to the
   original logo view, with floating pearls and soft shadows.

Suggested integration: a muted inline video with metadata preload, paused
outside the viewport. Map normalized scroll progress to video.currentTime,
allowing one seek at a time. Supply a poster; on reduced-motion use the poster
and do not download/play the animation. Do not replace the main interactive
Three.js panda, which supports real cursor and drag rotation.
