#! /usr/bin/env node

// npx nodejs-whisper-prepare --model base.en --model-dir /opt/whisper-models
//
// The non-interactive half of `npx nodejs-whisper download`, meant to run
// inside a Docker build rather than on a developer's terminal.
//
// Why this exists: without it, the first transcription in production pays for
// downloading the model AND compiling whisper.cpp, which means the image has to
// carry build-essential and cmake at runtime and the first caller waits minutes
// for a result. Doing both at image build time moves that cost to the build and
// lets the compiler leave the runtime image.
//
// It asks no questions and it never guesses: an unknown model name, a missing
// directory it cannot create, or a failed compile all exit non-zero so the
// Docker build stops rather than producing an image that fails later.

import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import autoDownloadModel from './autoDownloadModel'
import { buildWhisperCpp } from './buildConfig'
import { DEFAULT_MODEL, isModelName, LEGACY_MODEL_FILES, MODEL_OBJECT, WHISPER_CPP_PATH } from './constants'
import { Logger } from './types'

interface PrepareArgs {
	model: string
	modelDir: string
	withCuda: boolean
}

const USAGE = `
Usage: nodejs-whisper-prepare [options]

  --model <name>       Whisper model to fetch (default: ${DEFAULT_MODEL})
  --model-dir <path>   Where the model file is written
                       (default: whisper.cpp's own models directory)
  --cuda               Configure the build with CUDA support
  -h, --help           Print this message

Downloads the model if it is not already present and compiles whisper.cpp.
Intended for a Docker build; it prompts for nothing.
`

export function parsePrepareArgs(argv: string[]): PrepareArgs {
	const args: PrepareArgs = {
		model: DEFAULT_MODEL,
		modelDir: path.join(WHISPER_CPP_PATH, 'models'),
		withCuda: false,
	}

	for (let i = 0; i < argv.length; i++) {
		const flag = argv[i]

		if (flag === '--cuda') {
			args.withCuda = true
			continue
		}

		if (flag === '--model' || flag === '--model-dir') {
			const value = argv[i + 1]
			// A flag with no value is a typo, not a request for the default.
			if (!value || value.startsWith('--')) {
				throw new Error(`[Nodejs-whisper] Error: ${flag} needs a value.`)
			}
			if (flag === '--model') {
				args.model = value
			} else {
				args.modelDir = value
			}
			i++
			continue
		}

		throw new Error(`[Nodejs-whisper] Error: unknown option "${flag}".`)
	}

	if (!isModelName(args.model)) {
		throw new Error(`[Nodejs-whisper] Error: "${args.model}" is not a known model name.`)
	}

	return args
}

export async function prepare(argv: string[], logger: Logger = console): Promise<void> {
	const { model, modelDir, withCuda } = parsePrepareArgs(argv)
	const resolvedModelDir = path.resolve(modelDir)

	logger.log(`[Nodejs-whisper] Preparing ${model} in ${resolvedModelDir}`)

	fs.mkdirSync(resolvedModelDir, { recursive: true })

	// autoDownloadModel is the existing non-interactive path: it skips the
	// download when the file is already there, and it builds whisper.cpp after
	// downloading. It does NOT build when the model already exists, so the
	// build is repeated below rather than assumed.
	await autoDownloadModel(logger, model, withCuda, resolvedModelDir)

	const modelFiles = [MODEL_OBJECT[model], ...(LEGACY_MODEL_FILES[model] || [])]
	const written = modelFiles.find(fileName => fs.existsSync(path.join(resolvedModelDir, fileName)))
	if (!written) {
		throw new Error(
			`[Nodejs-whisper] Error: ${model} is still not present in ${resolvedModelDir} after the download step.`
		)
	}

	buildWhisperCpp(logger, withCuda)

	const executable = shell.find(path.join(WHISPER_CPP_PATH, 'build')).filter(file => /whisper-cli(\.exe)?$/.test(file))
	if (!executable.length) {
		throw new Error('[Nodejs-whisper] Error: the build finished but no whisper-cli executable was produced.')
	}

	logger.log(`[Nodejs-whisper] Ready: model ${path.join(resolvedModelDir, written)}, binary ${executable[0]}`)
}

/* istanbul ignore next -- entrypoint, exercised by running the bin */
if (require.main === module) {
	const argv = process.argv.slice(2)

	if (argv.includes('-h') || argv.includes('--help')) {
		console.log(USAGE)
		process.exit(0)
	}

	prepare(argv).catch(error => {
		console.error(error instanceof Error ? error.message : error)
		console.error(USAGE)
		process.exit(1)
	})
}
