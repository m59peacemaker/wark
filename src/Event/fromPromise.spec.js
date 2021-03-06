import { test } from 'zora'
import { Event } from '../index.js'

// TODO: replace this
const promiseNext = event => new Promise(event.subscribe)

test('Event.fromPromise', async t => {
	const a = Event.fromPromise(new Promise(resolve => setTimeout(() => resolve('foo'), 4)))
	t.deepEqual(await promiseNext(a), 'foo')
})
