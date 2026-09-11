import shell from 'shelljs'
import { WHISPER_CPP_PATH } from './constants'
import { Logger } from './types'

export function getCmakeConfigureCommand(withCuda: boolean = false): string {
	const configureCommand = ['cmake', '-B', 'build']
	const extraCmakeArgs = process.env.NODEJS_WHISPER_CMAKE_ARGS?.trim()

	if (withCuda) {
		configureCommand.push('-DGGML_CUDA=1')
	}

	if (extraCmakeArgs) {
		configureCommand.push(extraCmakeArgs)
	}

	return configureCommand.join(' ')
}

/**
 * Configure and compile whisper.cpp in place, throwing on either step.
 *
 * Extracted from autoDownloadModel so the build-time prepare step runs exactly
 * the same two commands rather than a second, drifting copy of them.
 */
export function buildWhisperCpp(logger: Logger = console, withCuda: boolean = false): void {
	const projectDir = process.cwd()

	try {
		shell.cd(WHISPER_CPP_PATH)

		logger.debug('[Nodejs-whisper] Configuring CMake build...')
		const configResult = shell.exec(getCmakeConfigureCommand(withCuda))
		if (configResult.code !== 0) {
			throw new Error(`[Nodejs-whisper] CMake configuration failed: ${configResult.stderr}`)
		}

		logger.debug('[Nodejs-whisper] Building whisper.cpp...')
		const buildResult = shell.exec('cmake --build build --config Release')
		if (buildResult.code !== 0) {
			throw new Error(`[Nodejs-whisper] Build failed: ${buildResult.stderr}`)
		}
	} finally {
		shell.cd(projectDir)
	}
}
