# Asset Batch 003 Proposal

Status: network acquisition stopped on 2026-07-15 after the fixed partial, gap,
and background-probe acquisitions. Selection remains quarantined until
technical review and project-owner contact-sheet approval.

## Objective

Build the 70-source-image Kit B defined in `docs/ASSET_CORPUS_PLAN.md`: a
complete pixel/retro science-fiction vertical bullet-hell set with exactly 6
players, 14 enemies, 4 Bosses, 8 backgrounds, 6 player projectiles, 6 enemy
projectiles, 6 pickups, 10 UI images, and 10 effects.

Batch 002's 56 rejected files remain evidence only. None may be copied,
renamed, derived, or selected into Batch 003.

## Fixed acquisition envelope

- Source pages: exactly 29 pages listed below; no search-result, collection, or
  author-profile crawl.
- Policy check: one logical GET for OpenGameArt's current robots policy.
- Page verification: 29 logical GETs, one per fixed source page.
- Asset acquisition: 40 logical GETs comprising 20 archives and 20 direct PNG
  files.
- Total: exactly 70 planned logical GET starts. Redirect hops are transport
  details, but an unexpected destination host is a hard stop.
- Page-reported asset bytes: approximately 8.4 MB.
- Expected actual download: no more than 10 MB.
- Download hard stop: 15 MB of response bodies; stop before starting the next
  asset request if the remaining allowance cannot contain its page-reported
  size.
- Expected expanded acquisition workspace: no more than 90 MB.
- Expanded-workspace hard stop: 150 MB.
- Expected 100-110-image shortlist: no more than 12 MB.
- Permanent 70-image candidate hard stop: 20 MB; the existing complete-corpus
  150 MB verifier cap remains unchanged.
- Network time: approximately 10-15 minutes with serialized starts and at least
  ten seconds between OpenGameArt asset-file request starts.
- Review and evidence time: approximately 8-12 hours for archive inventory,
  hashes, image analysis, semantic screening, contact sheets, catalog records,
  tests, and documentation.
- Model calls: none.
- Paid services: none.

Any request-count, license, author, ownership, redirect-host, archive-safety,
download, expanded-workspace, or permanent-corpus hard-stop breach ends the
acquisition before further requests or promotion. A revised proposal is then
required.

### Preflight timeout amendment

The first execution attempt ended on a 30-second network timeout while checking
the fixed robots/page preflight and before the asset-file loop. The script
version used for that attempt did not persist per-request events, so the exact
failed-page position cannot be reconstructed. Its control flow and the empty
download directory prove that it started at most 27 logical GETs: one robots
request plus no more than 26 source-page requests. It wrote zero asset files and
zero downloaded asset bytes.

The one clean retry completed all 27 policy/page requests and then timed out on
logical GET 28, the 25.3 MB Wisedawn archive. It wrote zero asset files. The
incremental event log proves this exact position. The slow archive is now
removed rather than retried.

The replacement plan used four small independent ship pages and author pools:
Scrittl's CC0 32x32 set, Irmandito's CC-BY-4.0 32x32 set,
The_Scientist___'s CC0 ship set, and Lamoot's CC0 fighter. It authorizes one new
70-GET execution with the reduced 15 MB download hard stop. The earlier attempts
consumed at most 27 plus exactly 28 logical GET starts, so the conservative
cumulative ceiling was 125. The replacement execution completed all 30
policy/page requests and asset requests 31-61, then timed out on request 62 for
the Reactorcore plasma archive. It wrote 31 asset files: 18 archives and 13
direct PNG files totaling 5,310,222 bytes. Requests 63-70 were not started.
The request event log, downloaded files, safe archive inspection, and PNG
inventory are retained under the ignored `.runtime/asset-batch-003/`
workspace. The same failed request will not be retried.

Local inspection expanded 18 safe archives into 1,238 files and found 927
valid unique PNG files plus 11 invalid macOS AppleDouble pseudo-PNG entries.
The valid PNGs total 6,209,792 expanded bytes. None duplicates another file in
this partial acquisition. Inventory also invalidated the original capacity
assumptions: zero downloaded background passed the opaque `512x512` or
`360x640` gate, the Shiv pack did not prove a complete giant-mech Boss, and
standalone projectile coverage remains incomplete.

## Fixed incremental gap acquisition

The partial acquisition evidence is reused; completed files are not requested
again. This one no-model increment exists only to obtain technically testable
background, projectile, Boss/mech, pickup, and effect candidates.

- Source pages: exactly 19 fixed pages in the table below.
- Policy check: one logical GET for the current OpenGameArt robots policy.
- Page verification: exactly 19 logical GETs.
- Asset acquisition: exactly 25 logical GETs comprising 6 archives and 19
  direct PNG files.
- Total: exactly 45 planned logical GET starts.
- Page-response hard stop: 22 MB cumulative and 2 MB per page.
- Page-reported asset bytes: approximately 10.6 MB.
- Asset-response hard stop: 14 MB for this increment.
- Combined previous-plus-increment asset hard stop: 19,310,222 bytes.
- Expanded-workspace hard stop remains 150 MB; permanent candidate hard stop
  remains 20 MB.
- Asset request starts remain serialized and separated by at least ten seconds.
- Transport: the fixed Windows `curl.exe` 8.14.1 executable, invoked without a
  shell, with HTTPS-only redirects, at most three redirects, streamed byte
  counting, and an operating-system process-level total time limit.
- Page/robots timeout: 60 seconds. Asset timeout: 120 seconds. No automatic
  retry; another transport failure is a hard stop.
- Expected network time: approximately 5-8 minutes. Inventory and visual review
  time after download: approximately 4-8 hours.
- Model calls and paid services: none.

|   # | Source page                                                                        | Author                 | Fixed asset requests | Page-reported bytes | Purpose                                                |
| --: | ---------------------------------------------------------------------------------- | ---------------------- | -------------------: | ------------------: | ------------------------------------------------------ |
|  1a | https://opengameart.org/content/black-and-green-2000x2000                          | ToxSickProductions.com |                1 PNG |            318.4 KB | abstract/seamless background candidate                 |
|  1b | https://opengameart.org/content/background-space-with-planet-in-chalky-style       | tebruno99              |                1 PNG |              2.0 MB | planet/nebula scene candidate                          |
|  1c | https://opengameart.org/content/starfield-background                               | Sauer2                 |                1 PNG |             15.1 KB | small-transfer starfield, subject to dimensions        |
|   2 | https://opengameart.org/content/perfectly-seamless-night-sky                       | LuminousDragonGames    |                1 PNG |              3.5 MB | seamless starfield                                     |
|   3 | https://opengameart.org/content/sci-fi-background                                  | hassekf                |            1 archive |            162.6 KB | constructed facility scene                             |
|   4 | https://opengameart.org/content/seamless-cave-background                           | PWL                    |                1 PNG |             82.9 KB | terrain/seamless scene                                 |
|   5 | https://opengameart.org/content/space-backdrop                                     | beren77                |                1 PNG |            454.3 KB | dark starfield                                         |
|   6 | https://opengameart.org/content/space-background-2                                 | StumpyStrust           |                1 PNG |              1.2 MB | nebula/star scene                                      |
|   7 | https://opengameart.org/content/starry-night-background                            | SethByrd               |            1 archive |              1.1 MB | constructed pixel night scene                          |
|   8 | https://opengameart.org/content/bullets                                            | phobi                  |            1 archive |              1.6 KB | three separated bullet PNGs                            |
|   9 | https://opengameart.org/content/abstract-geometric-bosses-bullets-player-and-other | RUOK                   |            1 archive |            919.7 KB | retro bullet and Boss candidates                       |
|  10 | https://opengameart.org/content/stg-object-image                                   | mieki256               |                4 PNG |              5.1 KB | independent shot, Boss shot, Boss laser, and Boss body |
|  11 | https://opengameart.org/content/mega-bot-assets-pack                               | ansimuz                |            1 archive |             24.6 KB | complete pixel robot/mech candidates                   |
|  12 | https://opengameart.org/node/88384                                                 | JayKingSta14           |                1 PNG |            378.3 KB | complete Mega Mecha fallback candidate                 |
|  13 | https://opengameart.org/content/explosions                                         | GameProgrammingSlave   |                4 PNG |             89.2 KB | explosion and shield sheets omitted by the failed run  |
|  14 | https://opengameart.org/content/energy                                             | ArlanTR                |                1 PNG |              4.2 KB | charge effect omitted by the failed run                |
|  15 | https://opengameart.org/content/shield-sprite                                      | zeroisnotnull          |                1 PNG |            150.6 KB | shield effect omitted by the failed run                |
|  16 | https://opengameart.org/content/16-direction-rocket-projectile                     | diggy                  |                1 PNG |             98.8 KB | missile source omitted by the failed run               |
|  17 | https://opengameart.org/content/bullet-collection-different-colors                 | Luca Pixel             |            1 archive |              2.3 KB | small bullet archive omitted by the failed run         |

Every incremental page currently declares CC0. The fixed file labels are
encoded in `scripts/acquire-asset-batch-003-gaps.ts`; a missing label, changed
author/license, unexpected host, byte-cap breach, or pre-existing output file
stops the script. Downloads remain ignored quarantine evidence and do not imply
selection or approval.

### Incremental transport amendment

The first execution of the earlier 17-page/23-asset increment completed the
robots request and all 17 source-page checks, then stalled on logical GET 19,
`Space-background-OGA-pack.zip`. No asset response completed and no asset file
was written. The process was terminated after more than 20 minutes, proving the
Node fetch/body timeout did not provide the promised total-operation bound.

At that observation point the 3 MB archive was treated as transport-excluded.
The proposed replacement used three independent direct PNG pages totaling about
2.34 MB. The amended
19-page/25-asset plan uses `curl.exe` as described above so the 120-second bound
is enforced by the child process and streamed output is killed immediately if
it crosses the remaining byte allowance. Earlier incremental page requests are
retained as evidence but are not trusted as live page content; the amended run
rechecks all fixed pages. Its exact new request ceiling is 45 logical GETs.

### Late completion correction and final background micro-increment

After the outer task was terminated, the original 41-GET Node process continued
as a detached child and ultimately completed. Its manifest proves 17 page
checks, 23 asset files, 11,124,256 new asset bytes, and 16,434,478 combined
Batch 003 asset bytes. The later 45-GET amendment was stopped during page
preflight as soon as this completion was discovered; it wrote no asset files.
No successful file will be requested again.

Safe extraction and PNG inventory found 74 valid PNGs with 73 unique hashes.
Eleven opaque files pass the background canvas gate, but the maximum-two-visual-
family rule limits the six phoenix1291 scenes to two selections. The remaining
independent sources provide only five more eligible backgrounds, leaving the
eight-background quota short by one.

One final no-model micro-increment is fixed:

- one robots-policy GET;
- one page GET for
  `https://opengameart.org/content/black-and-green-2000x2000`;
- one asset GET for `GreenBlackBG.png` by ToxSickProductions.com, declared CC0,
  page-reported as 318.4 KB and 2000x2000;
- exactly three logical GET starts, 2 MB page cap, 1 MB asset hard stop, 60
  seconds per page/robots request, 120 seconds for the asset, no retry;
- HTTPS-only `curl.exe` transport, expected network time below one minute;
- expanded and permanent hard stops remain 150 MB and 20 MB respectively;
- no model call, paid service, automatic promotion, or Git state change.

The micro-increment stops on any author, license, label, host, response type,
hash-evidence, byte, timeout, or pre-existing-output mismatch. The resulting
file is only a quarantine candidate until contact-sheet approval.

The micro-increment completed at 318,439 bytes. Its 2000x2000 PNG has exactly
one transparent pixel among 4,000,000 pixels. The project owner accepted that
deviation as negligible, so the image is a usable background candidate with the
measured alpha anomaly recorded. The project owner also made small quota
shortfalls non-blocking in favor of continuing quickly. No further network
request is authorized by this proposal. The 70-image matrix remains a later
planning target; it is not a blocking exact count.

## Fixed source roster

All pages were checked on 2026-07-15. Every page declares CC0 except the
Irmandito page, which declares allowed CC-BY-4.0 and requires attribution.
Credits will preserve title, author, source page, license URL, and modification
status for every source. Page sizes below are discovery metadata, not trusted
file metadata; actual bytes and SHA-256 values will be recomputed after
acquisition.

|   # | Source page                                                                            | Author/publisher                           | Fixed asset requests | Page-reported size | Intended gap                                                               |
| --: | -------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------: | -----------------: | -------------------------------------------------------------------------- |
|  1a | https://opengameart.org/content/spaceship-set-32x32px                                  | Scrittl                                    |            1 archive |            36.9 KB | five 32x32 ships and one larger independent silhouette                     |
|  1b | https://opengameart.org/content/spaceships-32x32                                       | Irmandito                                  |            1 archive |             7.2 KB | five separately stored CC-BY-4.0 top-down silhouettes                      |
|  1c | https://opengameart.org/content/spaceship-set                                          | The_Scientist___                           |            1 archive |           100.3 KB | limited ship, missile, beam, and charge candidates                         |
|  1d | https://opengameart.org/content/top-down-space-fighter-sprite                          | Lamoot, submitted by qubodup               |         1 direct PNG |            31.4 KB | independent fighter silhouette                                             |
|   2 | https://opengameart.org/content/multiple-alien-enemies-and-soldier-character           | Gusmando                                   |            1 archive |              59 KB | robots/aliens and a non-conventional player candidate                      |
|   3 | https://opengameart.org/content/pixel-robot                                            | David Harrington                           |            1 archive |              33 KB | mechanical character candidate                                             |
|   4 | https://opengameart.org/content/pixel-drone                                            | knik1985                                   |            1 archive |              16 KB | independent light-drone silhouette                                         |
|   5 | https://opengameart.org/content/pixel-turret-animation                                 | zonked                                     |         4 direct PNG |           253.8 KB | one turret family and animation-sheet evidence                             |
|   6 | https://opengameart.org/content/small-turret-deploying-animation                       | Ultrahuntr                                 |         1 direct PNG |             1.9 KB | independent station/turret unit                                            |
|   7 | https://opengameart.org/content/asteroidsdebris-set                                    | The_Scientist___                           |            1 archive |            12.9 KB | three distinct asteroid/mine/debris hazards                                |
|   8 | https://opengameart.org/content/spaceship-boss-set                                     | The_Scientist___                           |            1 archive |             182 KB | mothership Boss plus charge/beam candidates                                |
|   9 | https://opengameart.org/content/alien-boss-set                                         | The_Scientist___                           |            1 archive |             501 KB | biomechanical alien Boss                                                   |
|  10 | https://opengameart.org/content/sci-fi-top-down-shipyard-space-station                 | ChaosShark                                 |         1 direct PNG |            19.8 KB | station/fortress Boss                                                      |
|  11 | https://opengameart.org/content/mecha-platformer-pixelart                              | Shiv                                       |            1 archive |           542.4 KB | giant-mech Boss candidate, subject to complete-sprite and prominence gates |
|  12 | https://opengameart.org/content/pixel-art-backgrounds-0                                | stealthix                                  |            1 archive |              90 KB | eight scene candidates across required background meanings                 |
|  13 | https://opengameart.org/node/34210                                                     | ansimuz                                    |            1 archive |             263 KB | loopable scene and limited projectile/pickup backup                        |
|  14 | https://opengameart.org/content/power-ups                                              | KonitaTutorials                            |            1 archive |             5.5 KB | three space-shooter pickups                                                |
|  15 | https://opengameart.org/content/pickup-items-icons                                     | Cethiel                                    |            1 archive |           588.4 KB | health, shield, and weapon/damage pickups                                  |
|  16 | https://opengameart.org/content/pixel-uihud-pack                                       | TokyoGeisha                                |            1 archive |              77 KB | pixel HUD, panel, bar, frame, and control candidates                       |
|  17 | https://opengameart.org/content/pixel-ui-kit                                           | barkino                                    |            1 archive |             6.2 KB | green/grey retro UI backup                                                 |
|  18 | https://opengameart.org/content/retro-pixel-art-guihud-elements-including-dialogue-box | Pace Smith                                 |         6 direct PNG |             2.5 KB | cursor/focus, icon, warning/badge, and dialog/frame roles                  |
|  19 | https://opengameart.org/content/simple-hud-gui-constraction-kit-in-8-colors            | Rawdanitsu                                 |            1 archive |             1.3 MB | semantically distinct button, panel, bar, and touch-control backup         |
|  20 | https://opengameart.org/content/gun-muzzle-flash-effects-fire-and-ion-and-melee        | Reactorcore                                |            1 archive |             1.2 MB | muzzle flash, hit spark, trail, and ion effects                            |
|  21 | https://opengameart.org/content/plasma-electric-effect-animations                      | Reactorcore                                |            1 archive |             2.7 MB | plasma/orb projectiles, charge, impact, beam, and warp effects             |
|  22 | https://opengameart.org/content/explosions                                             | GameProgrammingSlave                       |         4 direct PNG |            89.2 KB | three explosion sheets and one shield sheet                                |
|  23 | https://opengameart.org/content/energy                                                 | ArlanTR                                    |         1 direct PNG |             4.2 KB | original charge animation sheet                                            |
|  24 | https://opengameart.org/content/shield-sprite                                          | zeroisnotnull                              |         1 direct PNG |           150.6 KB | standalone science-fiction shield effect                                   |
|  25 | https://opengameart.org/content/16-direction-rocket-projectile                         | diggy, with declared Master484 CC0 lineage |         1 direct PNG |            98.8 KB | original rocket-direction sheet as one missile source                      |
|  26 | https://opengameart.org/content/bullet-collection-different-colors                     | Luca Pixel                                 |            1 archive |             2.3 KB | distinct bullet shapes, capped at two color variants                       |

The six fixed Pace Smith files are `dialoguebox1.png`, `dialoguebox2.png`,
`mouse pointer.png`, `question mark.png`, `quit-icon.png`, and
`speaker-icon1.png`. The four fixed zonked files are
`turret-sprites-body.png`, `turret-sprites-deployment.png`,
`turret-sprites-head-shot-idle.png`, and `turret-sprites-head-shot.png`. The
four fixed GameProgrammingSlave files are `explosion0.png`, `explosion1.png`,
`explosion2.png`, and `shields.png`.

## Capacity and diversity budget

The roster is deliberately larger than the selected set because archive names
and previews cannot prove standalone runtime usability. Inventory screening is
expected to produce 100-110 technically plausible original PNG source images.

| Source group                                           | Shortlist ceiling | Selection ceiling | Reason                                                                 |
| ------------------------------------------------------ | ----------------: | ----------------: | ---------------------------------------------------------------------- |
| Four small ship sources                                |                24 |                10 | independent silhouette pools without a large-pack concentration        |
| Gusmando, David Harrington, knik1985, and turret pages |                24 |                14 | robots, aliens, drones, and station units from independent authors     |
| The_Scientist___ entity pages                          |                18 |                 8 | hazards and two Boss families; author stays well below 28              |
| ChaosShark and Shiv Boss pages                         |                 4 |                 2 | one independent station and one independent mech                       |
| stealthix and ansimuz backgrounds                      |                12 |                 8 | exact background quota; maximum two related scene variants             |
| pickup pages                                           |                12 |                 6 | six gameplay meanings, never six palette states                        |
| UI pages                                               |                20 |                10 | ten roles, not construction fragments or button states                 |
| Reactorcore pages                                      |                20 |                14 | two independent packs, each below the 17-per-pack ceiling              |
| remaining projectile/effect pages                      |                16 |                 8 | semantic and author diversity for the two projectile sides and effects |

The shortlist ceilings are source-specific upper bounds, not targets to fill.
Global gates still apply: at most 17 selected images per pack, 28 per author,
and two variants of one visual family. One original sprite sheet counts as one
source image. Crops, frames, assembled components, recolors, resizes, and other
derivatives never increase the source count.

## Exact semantic proof plan

- Player 6: two agile fighters and two heavy silhouettes from the four
  independent ship sources; two mechanical/alien or otherwise unconventional
  candidates from the Gusmando/robot pools.
- Enemy 14: four light ships/drones, four robots or aliens, three hazards from
  the asteroids/debris archive, and three independent turret/station units.
- Boss 4: one massive spaceship body, the ChaosShark station, one complete
  alien Boss source, and a complete prominent Shiv mecha. Components cannot be counted as a
  complete Boss unless the archive also supplies an original assembled PNG.
- Background 8: eight visually full-frame original files passing the minimum
  canvas gate. Negligible isolated alpha defects are recorded and tolerated;
  materially transparent clouds and composition layers are excluded.
- Projectiles 12: six friendly and six hostile shapes assigned only after a
  runtime-scale color/silhouette separation review. Required meanings remain
  two lasers, two plasma/energy shots, one missile, and one charged beam on the
  player side; two orbs, two spread/star bullets, one mine/missile, and one
  beam on the enemy side.
- Pickups 6: health, shield, weapon upgrade, bomb/screen clear, energy, and
  score reward. Page labels alone do not prove meaning; each needs a visibly
  distinct source image.
- UI 10: primary button, restart/end button, HUD panel, player-health bar,
  Boss-health bar, score frame, icon slot, cursor/focus, touch control, and
  warning/badge.
- Effects 10: small explosion, large explosion, hit spark, muzzle flash,
  shield, heal, power-up, engine trail, charge/beam, and warp/warning.

If inventory inspection cannot supply every exact cell without relabeling or
derivative inflation, the process stops at a documented gap report. It does not
promote a partial or semantically false kit.

## Acquisition and review sequence

1. Recheck OpenGameArt's robots policy and all 29 source pages.
2. Confirm page license, author, file label, expected file count, and expected
   host before each asset request.
3. Download serially into an ignored project-local Batch 003 acquisition
   workspace, recording request order, response URL, bytes, SHA-256, and time.
4. Reject unsafe archive paths, links, unsupported formats, corrupt entries,
   and expansion-cap breaches before extracting.
5. Inventory original files without creating countable derivatives; compute
   PNG dimensions, visual bounds, opacity, and source hashes.
6. Build a 100-110-image quarantine shortlist only if every semantic cell has
   sufficient candidates.
7. Generate a category-grouped nearest-neighbor contact sheet and a separate
   runtime-scale composition preview.
8. Add pending/rejected catalog and acquisition evidence, then run focused
   asset tests and `pnpm check`.
9. Ask the project owner to approve or reject numbered candidates. No pending
   Batch 003 image becomes retrieval-eligible before that decision.
10. After approval, run one complete pixel/retro desktop/mobile browser,
    visual, and package-hash regression and update the durable handoff.

This authorization does not permit a paid model call, a new license class,
unlisted source, Git branch, commit, push, pull request, or automatic candidate
promotion.
