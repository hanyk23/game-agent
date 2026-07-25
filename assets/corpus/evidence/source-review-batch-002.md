# Batch 002 source review

Reviewed online and acquired on 2026-07-15 under the bounded envelope in
`docs/ASSET_BATCH_002_PROPOSAL.md`.

- Kenney Pixel Shmup: the official page and included `License.txt` identify the
  archive as CC0. Forty-four semantically classified PNGs were selected from
  the original `Ships/` and `Tiles/` entries.
- Kenney Pixel UI Pack: the official page and included `License.txt` identify
  the archive as CC0. The archive contained far fewer standalone files than the
  page's asset count implies, so the selection excludes pressed states,
  same-role recolors, preview images, sprite sheets, and individual nine-slice
  pieces. Six normal-state PNGs have distinct intended UI roles.
- OpenGameArt Seamless Space Backgrounds: the page names Screaming Brain
  Studios as author and marks the pack CC0; the included `License.txt` agrees.
  Six visually distinct, opaque 512×512 PNGs were selected from the small
  archive and separately previewed at the runtime's 540×960 presentation.
- OpenGameArt Mars Background Pixel Art: the page names Quantiset and marks the
  four direct PNGs CC0. All four downloaded files are transparent composition
  layers, so none was mislabeled or selected as a standalone background.
- OpenGameArt Pixel Art 2D Space Themed Background: the page names Cayden
  Franklin and marks the direct PNG CC-BY 4.0. The file has a large transparent
  canvas region, so it was not selected as a full-canvas background. No
  CC-BY-4.0 Batch 002 file was materialized into the candidate set.
- The saved OpenGameArt `robots.txt` requires `Crawl-delay: 10`. All six
  OpenGameArt asset requests were serialized with at least ten seconds between
  request starts. The complete fixed plan used 14 GET requests: five source
  pages, one robots file, three archives, and five direct PNGs.

The 56 selected source files have unique hashes across Batch 001 and Batch 002.
After reviewing `review-contact-sheet-batch-002.png`, the project owner rejected
the complete batch because it was visually dominated by small, similar
spacecraft. All records and files are preserved as rejected evidence and remain
excluded from retrieval eligibility.
