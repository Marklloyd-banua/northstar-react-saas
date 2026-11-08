# Third-Party Notices (frontend-only commercial template)

**Project:** Northstar React SaaS Admin Dashboard Template (`saas-admin-template`, frontend).
**Document status:** Buyer-facing disclosure draft (Phase 8B.5 remediation; Phase 8F.3 release-specific alignment; Phase 8F.5A documentation remediation — TypeScript `ThirdPartyNoticeText.txt` reference/evidence and release-folder packaging-state reconciliation). **This is not legal advice and does not constitute legal clearance for sale or distribution.**

## 1) Scope and accuracy

- This notice covers third-party software, fonts, and related materials identified from `package.json`, `package-lock.json` (lockfile v3), and actual `LICENSE`/`LICENCE`/`COPYING`/`NOTICE` files present in the audited workspace install (`node_modules/...`) for the versions listed.
- **Verified facts** are based on inspected package files, lockfile metadata, source references in this repository (`src/index.css`), and authoritative upstream font license files fetched during audit (URLs cited below).
- **Unresolved items** are explicitly marked. **Manifest license metadata alone does not prove compliance**; review actual license/NOTICE texts, distribution obligations, and your delivery channel’s requirements.
- Detailed/verbatim texts from audited installed packages and verified font OFL texts are provided in **`docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`** to avoid unnecessary duplication in this summary while preserving actual texts.
- **Vite bundled-dependency notices (clarification):** Vite's published `LICENSE.md` (included in the detailed texts as an actual installed package file) may contain notices for dependencies bundled within Vite itself. Those bundled-dependency notices do **not** necessarily mean those packages are direct dependencies in this template's `package-lock.json` or separately distributed by this template; they are part of Vite's own license/notice content. Review the detailed texts in context.

## 2) Project license boundary (important)

- **Commercial license status (this release package):** A finalized commercial license for the Template’s original materials is **not included** in this release package. The commercial license is still under **owner/legal review** and is **not yet finalized**. Obtain and review the applicable final license/terms from the seller or rights holder before commercial use or redistribution.
- This release package’s `package.json` does **not** include a `license` field pointing to a finalized commercial `LICENSE` file. (The source repository may contain separate draft/review materials outside this release package; those do not make a license final for buyers.)
- **The draft/proposed commercial license terms do not override third-party license rights.** Third-party components/fonts remain subject to their own licenses and conditions. You must comply with applicable third-party licenses, notices, attribution, source-availability, and redistribution requirements.

## 3) Distribution scope (frontend-only first edition)

- Intended first commercial edition: **frontend-only** template package. `backend/` exists in the repository as a separate foundation but is **not** part of the frontend-only commercial package unless explicitly approved and separately licensed/documented.
- Typical commercial delivery should exclude secrets and development artifacts (e.g., real `.env*` files, `.git/`, `.aider*`, `node_modules/`, `dist/` as appropriate) per your approved release process. **Phase 8F.4/8F.5A factual state:** `release/codester-main/node_modules/` and platform/native binaries are currently present in this folder (dev/build artifacts; cleanup/removal requires approved packaging operations — **not performed in 8F.5A**). A clean commercial ZIP was **not** created in this remediation phase.
- **Do not claim every optional platform package is distributed.** Optional native/platform packages are selected by package managers per platform and may not be present in or relevant to a given delivered package. Dev/build dependency presence in a workspace or release-folder `node_modules` must be distinguished from **actually distributed artifacts**.

## 4) Fonts (verified upstream; external loading)

### Usage (verified in source)
`src/index.css` loads fonts externally from Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
```

- Google Fonts CSS delivery observed (DM Sans v17, Manrope v23 `@font-face` rules pointing to `fonts.gstatic.com` assets). **No font binary files are downloaded or bundled by this template source in this remediation.**

### DM Sans — SIL Open Font License 1.1 (verified)
- **Verified upstream source (fetched):** `https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt`
- **Copyright (from fetched OFL header):** `Copyright 2014 The DM Sans Project Authors (https://github.com/googlefonts/dm-fonts)`
- **License:** SIL Open Font License, Version 1.1 (26 February 2007), with FAQ reference `https://scripts.sil.org/OFL` as stated in the fetched file.
- Full verified OFL text is included in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`.

### Manrope — SIL Open Font License 1.1 (verified)
- **Verified upstream source (fetched):** `https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt`
- **Copyright (from fetched OFL header):** `Copyright 2018 The Manrope Project Authors (https://github.com/googlefonts/manrope)`
- **License:** SIL Open Font License, Version 1.1 (26 February 2007), with FAQ reference `http://scripts.sil.org/OFL` as stated in the fetched file.
- Full verified OFL text is included in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`.

### Font attribution/compliance note (not legal advice)
- **External Google Fonts loading does not eliminate all attribution or license obligations.** OFL 1.1 imposes conditions when redistributing/bundling Font Software (including providing copyright notice and license with distributed font software, Reserved Font Name restrictions where applicable, and other terms). Because this template currently references fonts externally rather than bundling font files, obligations depend on your distribution model and applicable terms — **review required**.
- If you later self-host or bundle DM Sans/Manrope font files, include applicable OFL files/notices and comply with OFL 1.1 conditions for the distributed font software.

## 5) Runtime dependency notices (verified/available from audited install)

Direct runtime dependencies declared in `package.json` (manifest metadata observed in lockfile/install): `react`/`react-dom` (MIT), `react-router-dom` (MIT), `bootstrap` (MIT), `bootstrap-icons` (MIT), `recharts` (MIT), `@reduxjs/toolkit` (MIT). These bring transitive runtime dependencies (e.g., d3/ISC, `d3-ease`/BSD-3-Clause in the chart/vendor graph, `es-toolkit`/MIT with NOTICE, `victory-vendor` compound license, React Router/Redux internals, etc.).

Actual LICENSE/NOTICE files for packages installed in the audited workspace are included verbatim in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`. Key runtime-graph cases:

### `es-toolkit@1.53.2` (MIT) — LICENSE + NOTICE included (verified)
- **Installed files (audited):** `node_modules/es-toolkit/LICENSE`, `node_modules/es-toolkit/NOTICE` — both included verbatim in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`.
- **LICENSE copyright (preserved):** `Copyright (c) 2024 Viva Republica, Inc.`
- **NOTICE (preserved, verbatim in detailed file):** states that parts of the test suite and compatibility layer in `es-toolkit/compat` are derived from Lodash; includes Lodash copyright/permission notice: `Copyright OpenJS Foundation and other contributors <https://openjsf.org/>`; based on Underscore.js, `copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors <http://underscorejs.org/>`; and the MIT permission notice as included in that NOTICE.

### `victory-vendor@37.4.1` (`MIT AND ISC AND BSD-3-Clause`) — bundled third-party attributions included (verified)
- **Installed file (audited):** `node_modules/victory-vendor/LICENSE.txt` — included verbatim in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`.
- **Preserved attributions (as stated in that file):** `Copyright (c) 2015-2026 Nearform` (MIT portion for victory-vendor) and bundled third-party notices for D3 libraries (ISC; Mike Bostock copyrights as listed), `d3-ease` (BSD-3-Clause; Mike Bostock, Robert Penner), and `d3-voronoi` (BSD-3-Clause and MIT-licensed portions; Mike Bostock, Raymond Hill) as reproduced in the package’s LICENSE.txt. **Compound license obligations require review.**

## 6) Relevant development/build dependency notices

Direct dev dependencies (`package.json`): `typescript`, `vite`, `@vitejs/plugin-react`, `oxlint`, `@types/*`. These and their transitive dev dependencies (e.g., `rolldown`, `lightningcss`, `postcss`, `tinyglobby`, `detect-libc`, platform bindings) are relevant to source/build workflows and may be relevant to your distribution form. Installed dev dependency license files are included in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md` where available.

### Apache-2.0 packages (verified files; NOTICE/third-party notice status)
| Package | Version | Scope | Installed LICENSE/notice files | `NOTICE` file found in audited install | Status |
|---|---|---|---|---:|---|
| `typescript` | 5.9.3 | dev | `node_modules/typescript/LICENSE.txt` and `node_modules/typescript/ThirdPartyNoticeText.txt` (both included in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`; exact text preserved from installed package; Phase 8F.4 verified file present locally and consistent with Microsoft/TypeScript v5.9.3 upstream notice file) | **No** (no file named `NOTICE`) | Apache-2.0 LICENSE text verified/preserved. **`ThirdPartyNoticeText.txt` is present and included**, but it is not named `NOTICE`; **Apache-2.0 Section 4(d) / NOTICE/attribution obligation handling for the intended distribution form still requires qualified legal review**. Upstream/version-specific obligations not fully verified. |
| `detect-libc` | 2.1.2 | dev, transitive | `node_modules/detect-libc/LICENSE` (included) | **No** | Apache-2.0 text verified/preserved. Phase 8F.4 checked upstream `https://raw.githubusercontent.com/lovell/detect-libc/main/NOTICE` and received **404** (unavailable at that path at time of audit); **NOTICE/attribution obligations for the intended distribution form still require qualified legal review**. |

### Lightning CSS — MPL-2.0 (verified license file; **compliance requires review**)
- **Package:** `lightningcss@1.33.0` (manifest: MPL-2.0). **Not a direct root dependency**; transitive **dev/build dependency of `vite@8.3.6`** per lockfile/investigation.
- **Installed license file (audited, original workspace):** `node_modules/lightningcss/LICENSE` (MPL-2.0, full text present) — included verbatim in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`. **Phase 8F.4 factual state (release folder):** `release/codester-main/node_modules/lightningcss/` package files and `release/codester-main/node_modules/lightningcss-android-arm64/lightningcss.android-arm64.node` are **currently present** in this release folder. This is a packaging-state fact, **not** an approved final buyer distribution; per approved process these files should be removed from a clean frontend-only buyer ZIP unless intentionally distributed with reviewed compliance (**do not delete in 8F.5A**).
- **Optional platform bindings (MPL-2.0, dev/optional):** Lockfile declares multiple `lightningcss-*` platform bindings. In the **audited original workspace install** (Phase 8F.4), `lightningcss-android-arm64` was installed (LICENSE files included in detailed texts) and other platform bindings were not installed locally (texts unavailable locally). In the **current release folder** (Phase 8F.4), `lightningcss-android-arm64` files are present as noted above. **Do not claim every optional platform package is distributed** in the final buyer package.
- **Build/runtime evidence (factual):** Lightning CSS library source/runtime code was not found in inspected `dist/assets/*.js`. Built CSS contains transform-related artifacts (e.g., `--lightningcss-light`/`--lightningcss-dark` in compiled output) and unrelated Bootstrap Icons `lightning` class names — **this does not by itself determine MPL compliance obligations**.
- **MPL compliance for the eventual distribution model still requires review.** MPL-2.0 can impose conditions related to Covered Software, Source Code Form/Executable Form availability, modifications, and notices depending on what is distributed (source, binaries, modified files, package contents). **Do not assume build-tool/dev status or absence from browser JS bundle eliminates all obligations.** Dev/build dependency status must be distinguished from **actually distributed artifacts** (source ZIP contents, any shipped `node_modules`/native binaries, prebuilt bundles, etc.).

## 7) Optional platform dependency scope and limitations

- `package-lock.json` declares optional/platform-specific packages (e.g., `@oxlint/binding-*`, `@rolldown/binding-*`, `fsevents`, `lightningcss-*` platform bindings). Package managers typically install the variant matching the user’s platform.
- **This document does not claim every optional platform package is distributed** with the frontend-only commercial template. Only audited installed packages have locally verified/included license texts in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`.
- **Phase 8F.4 factual state (current release folder):** `release/codester-main/node_modules/` and native `.node` binaries are **currently present** in this release folder, including `@oxlint/binding-android-arm64/oxlint.android-arm64.node`, `@rolldown/binding-android-arm64/rolldown-binding.android-arm64.node`, `lightningcss-android-arm64/lightningcss.android-arm64.node`, and `lightningcss` package files. These are **dev/build/platform artifacts** in the audited context and are **not** evidence of approved final buyer distribution. A clean frontend-only buyer ZIP should typically exclude `node_modules`/native binaries/secrets/internal artifacts (**no deletions performed in 8F.5A**).
- For non-installed optional packages (and platform variants not present in a given install/package), lockfile manifest license metadata was observed (MIT for listed oxlint/rolldown bindings and fsevents; MPL-2.0 for lightningcss bindings), but **actual LICENSE/NOTICE files were not available locally** for non-installed variants. If you distribute specific platform binaries/artifacts, obtain and include the exact package license/NOTICE texts for those versions and review MPL/other obligations for the actual distributed artifacts.

## 8) Unresolved legal questions / pending items

- **Commercial `LICENSE` for original template materials:** owner/legal review required; **not finalized and not included in this release package**.
- **MPL-2.0:** distribution-form-specific compliance (including any Executable Form/source availability obligations) requires legal review. **Dev/build vs distributed artifacts must be distinguished**; `release/codester-main/node_modules/` and MPL/native platform files are currently present in the release folder (factual, 8F.4) and must be handled by approved cleanup/packaging before buyer distribution.
- **Apache-2.0 NOTICE/third-party notice handling:** `typescript@5.9.3` `ThirdPartyNoticeText.txt` is now included in `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md` (preserved from installed package), but it is not named `NOTICE`; no `NOTICE` file was found for `typescript` or `detect-libc` in audited installs. detect-libc upstream `main/NOTICE` path was checked (404 at time of audit, 8F.4). **Apache-2.0 Section 4(d) / attribution obligations for the intended distribution form still require qualified legal review**; upstream/version-specific obligations not fully verified.
- **Fonts:** OFL 1.1 texts/copyrights verified from upstream Google Fonts repo files; external Google Fonts runtime delivery does not eliminate all attribution/license obligations — final packaging/attribution sufficiency requires review.
- **Full transitive completeness:** detailed texts file includes audited installed package files and non-installed lockfile entries marked unavailable locally. A complete, release-specific notice set for every artifact actually distributed (including any platform binaries) should be finalized before commercial sale.
- **Compound licenses / bundled attributions:** `victory-vendor` (and related chart stack) requires careful compliance review.
- **Clean release packaging:** frontend-only ZIP/release manifest, exclusion of secrets/internal artifacts, and `backend/` handling remain process steps. **`release/codester-main/node_modules/`/native binaries currently present (8F.4/8F.5A factual) — not cleaned in 8F.5A; no ZIP created.**

## 9) Where to find actual texts

- **`docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`** — verbatim license/NOTICE texts from audited installed package files (preserving copyright/attribution statements as present), plus verified upstream DM Sans/Manrope OFL 1.1 texts with source URLs. Entries for non-installed lockfile packages are marked unavailable locally/pending.
- Original package files remain in `node_modules/<package>/` in the audited workspace install (not shipped in a clean frontend ZIP).

**End of third-party notices (Phase 8F.5A documentation update; prior 8B.5/8F.3 content preserved).** No legal clearance is claimed.