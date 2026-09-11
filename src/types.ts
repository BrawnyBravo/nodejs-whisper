export interface WhisperOptions {
	outputInCsv?: boolean
	outputInJson?: boolean
	outputInJsonFull?: boolean
	outputInLrc?: boolean
	outputInSrt?: boolean
	outputInText?: boolean
	outputInVtt?: boolean
	outputInWords?: boolean
	translateToEnglish?: boolean
	language?: string
	timestamps_length?: number
	wordTimestamps?: boolean
	splitOnWord?: boolean
	noGpu?: boolean
	/**
	 * Suppress the "[HH:MM:SS.mmm --> HH:MM:SS.mmm]" prefix whisper.cpp writes in
	 * front of every segment (its `-nt` / `--no-timestamps` flag). Callers that
	 * want plain prose had to strip those with a regex because the library
	 * exposed no way to turn them off.
	 */
	noTimestamps?: boolean
	vad?: boolean
	vadModelPath?: string
	vadThreshold?: number
	vadMinSpeechDurationMs?: number
	vadMinSilenceDurationMs?: number
	vadMaxSpeechDurationS?: number
	vadSpeechPadMs?: number
	vadSamplesOverlap?: number
}

export interface Logger {
	debug: (...args: any[]) => void
	error: (...args: any[]) => void
	log: (...args: any[]) => void
}
