const assert = require('node:assert/strict')
const test = require('node:test')
const path = require('node:path')

const { constructOptionsFlags } = require('../src/WhisperHelper')
const { parsePrepareArgs } = require('../src/prepareModel')
const { DEFAULT_MODEL, WHISPER_CPP_PATH } = require('../src/constants')

// The two additions this fork carries. Both are here because the site that
// depends on it was working around their absence: stripping timestamps with a
// regex, and compiling whisper.cpp on the first call in production.

test('noTimestamps passes whisper.cpp its -nt flag', () => {
	const flags = constructOptionsFlags({ modelName: 'base.en', whisperOptions: { noTimestamps: true } })

	assert.match(flags, /(^|\s)-nt(\s|$)/)
})

test('the -nt flag is absent unless it is asked for, so existing callers are unchanged', () => {
	assert.doesNotMatch(constructOptionsFlags({ modelName: 'base.en' }), /-nt/)
	assert.doesNotMatch(constructOptionsFlags({ modelName: 'base.en', whisperOptions: {} }), /-nt/)
	assert.doesNotMatch(
		constructOptionsFlags({ modelName: 'base.en', whisperOptions: { noTimestamps: false } }),
		/-nt/
	)
})

test('-nt sits alongside the other flags rather than replacing them', () => {
	const flags = constructOptionsFlags({
		modelName: 'base.en',
		whisperOptions: { noTimestamps: true, outputInText: true, noGpu: true },
	})

	assert.match(flags, /-otxt/)
	assert.match(flags, /-ng/)
	assert.match(flags, /-nt/)
})

test('prepare defaults to the package model and whisper.cpp own models directory', () => {
	const args = parsePrepareArgs([])

	assert.equal(args.model, DEFAULT_MODEL)
	assert.equal(args.modelDir, path.join(WHISPER_CPP_PATH, 'models'))
	assert.equal(args.withCuda, false)
})

test('prepare reads the model and directory a Docker build hands it', () => {
	const args = parsePrepareArgs(['--model', 'base.en', '--model-dir', '/opt/whisper-models'])

	assert.equal(args.model, 'base.en')
	assert.equal(args.modelDir, '/opt/whisper-models')
	assert.equal(args.withCuda, false)
})

test('prepare takes --cuda in any position', () => {
	assert.equal(parsePrepareArgs(['--cuda', '--model', 'base.en']).withCuda, true)
	assert.equal(parsePrepareArgs(['--model', 'base.en', '--cuda']).withCuda, true)
})

test('a mistyped option stops the build rather than quietly using a default', () => {
	// The whole point of the prepare step is that a broken image build fails at
	// build time. Silently falling back to tiny.en would ship the wrong model.
	assert.throws(() => parsePrepareArgs(['--modle', 'base.en']), /unknown option/)
	assert.throws(() => parsePrepareArgs(['--model']), /needs a value/)
	assert.throws(() => parsePrepareArgs(['--model', '--model-dir', '/tmp']), /needs a value/)
	assert.throws(() => parsePrepareArgs(['--model-dir']), /needs a value/)
	assert.throws(() => parsePrepareArgs(['--model', 'not-a-model']), /not a known model name/)
})
