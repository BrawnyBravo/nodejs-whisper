# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1-bbr.1] - 2026-09-11

Fork of ChetanXpro/nodejs-whisper maintained at BrawnyBravo/nodejs-whisper for
the Big Bear Ready site. Based on upstream 0.3.1. Released as a GitHub Release
tarball only; it is deliberately not published to the npm registry.

The version is `0.3.1-bbr.1` and not `0.3.0-bbr.1`: the fork point is upstream
0.3.1, and a version that understates the code it describes is worse than one
that does not match the consumer's old lockfile entry.

The `cpp/whisper.cpp` submodule is pinned at
`f049fff95a089aa9969deb009cdd4892b3e74916` (whisper.cpp v1.9.1). Pinning it is
the point: the tarball is built with `npm pack` so it carries the whisper.cpp
source, which a git install would miss because npm does not clone submodules.

### Added

- `whisperOptions.noTimestamps`, which passes whisper.cpp's `-nt` flag. Without
  it whisper.cpp prefixes every segment with `[HH:MM:SS.mmm --> HH:MM:SS.mmm]`
  and a caller who wants plain prose has to strip those with a regex.
- `nodejs-whisper-prepare`, a non-interactive command that downloads a model and
  compiles whisper.cpp, meant to run inside a Docker build:
  `npx nodejs-whisper-prepare --model base.en --model-dir /opt/whisper-models`.
  Doing this at build time means the first transcription in production is not
  the one that pays for the compile, and the compiler toolchain does not have to
  stay in the runtime image. It prompts for nothing, and an unknown model name,
  a mistyped flag or a failed compile exits non-zero so the image build stops.
- Tests covering the `-nt` flag and the prepare argument parsing.

### Changed

- The whisper.cpp configure-and-build pair moved out of `autoDownloadModel` into
  an exported `buildWhisperCpp` in `buildConfig.ts`, so the prepare step runs the
  same two commands rather than a drifting copy. Behaviour is unchanged.
- `constructOptionsFlags` is exported, so the flag construction can be tested
  without a compiled binary and a model file on disk.

---

## [Unreleased]

### Added

- Nothing yet

### Changed

- Nothing yet

### Fixed

- Nothing yet

---

## [0.2.9] - 2025-05-15

### Fixed

- Fixed CLI download command not executing (missing function call)
- `npx nodejs-whisper download` now works as expected
- Fixed restrictive Console logger type that didn't work with popular loggers like Pino, Winston ([#158](https://github.com/ChetanXpro/nodejs-whisper/issues/158))
- Fixed inconsistent console usage in downloadModel.ts, now properly uses logger parameter ([#157](https://github.com/ChetanXpro/nodejs-whisper/issues/157))
- Fixed WAV validation that incorrectly reported non-16kHz files as valid ([#113](https://github.com/ChetanXpro/nodejs-whisper/issues/113))
- WAV files with incorrect sample rates are now automatically converted to 16kHz
- Eliminates "WAV file must be 16 kHz" errors from whisper.cpp

### Changed

- Replaced Console type with flexible Logger interface for better logger compatibility
- Updated all internal logging to use logger parameter instead of direct console calls

### Added

- Added CHANGELOG.md for version tracking

## [0.2.7] - 2025-05-15

### Fixed

- Fixed Windows build failures by migrating from make to CMake build system ([#185](https://github.com/ChetanXpro/nodejs-whisper/issues/185))
- Fixed "WHISPER_CUDA unknown on Windows" error ([#193](https://github.com/ChetanXpro/nodejs-whisper/issues/193))
- Fixed Windows executable detection issues ([#163](https://github.com/ChetanXpro/nodejs-whisper/issues/163))
- Improved cross-platform compatibility for Windows, macOS, and Linux builds

### Changed

- **BREAKING**: Migrated from Makefile-based builds to CMake as primary build system
- Replaced make/mingw32-make commands with `cmake --build` for better Windows support
- Updated CUDA compilation to use `-DGGML_CUDA=1` instead of environment variables
- Improved executable path detection for CMake output structure

### Technical Details

- Added support for Visual Studio, MinGW, and other Windows compilers
- Enhanced build detection to avoid unnecessary rebuilds
- Better error messages for build failures

## [0.2.6] - 2024-XX-XX

### Note

- Previous versions before changelog was maintained
- Major Windows compatibility improvements started with 0.2.7

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [GitHub Releases](https://github.com/ChetanXpro/nodejs-whisper/releases)
