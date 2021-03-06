import { test } from 'zora'
import { Behavior, Event, Dynamic } from '../index.js'
import { add, identity, collectValues } from '../util.js'

test('Behavior', async t => {
	t.test('behavior.sample() returns the same value for the same t and next value for the next t', t => {
		const values = [ 'a', 'b', 'c' ]
		const b = Behavior.create(() => values.shift())
		const t0 = Symbol()
		t.equal(b.sample(t0), 'a')
		t.equal(b.sample(t0), 'a')
		const t1 = Symbol()
		t.equal(b.sample(t1), 'b')
		t.equal(b.sample(t1), 'b')
		t.equal(b.sample(t1), 'b')
		const t2 = Symbol()
		t.equal(b.sample(t2), 'c')
	})

	t.test('Behavior.map', t => {
		const values = [ 0, 1 ]
		const b = Behavior.map (add(1)) (Behavior.create(() => values.shift()))
		const t0 = Symbol()
		t.equal(b.sample(t0), 1)
		t.equal(b.sample(t0), 1)
		const t1 = Symbol()
		t.equal(b.sample(t1), 2)
		t.equal(b.sample(t1), 2)
	})

	t.test('Behavior.constant', t => {
		const b = Behavior.constant(0)
		t.deepEqual(
			[ b.sample(Symbol()), b.sample(Symbol()) ],
			[ 0, 0 ]
		)
	})

	t.test('Behavior.lift', t => {
		const b = Behavior.lift ((a, b) => a + b) ([ Behavior.constant(3), Behavior.constant(6) ])
		t.equal(b.sample(), 9)
	})

	t.test('two events occurring at the same time and tagged with the same behavior have the same value', t => {
		const eventA = Event.create()
		const randomBehavior = Behavior.create(Math.random)
		const randomEventA1 = Event.tag (randomBehavior) (eventA)
		const randomEventA2 = Event.tag (randomBehavior) (eventA)

		const actualA1 = collectValues(randomEventA1)
		const actualA2 = collectValues(randomEventA2)

		eventA.occur(1)
		eventA.occur(2)
		eventA.occur(3)

		t.deepEqual(actualA1(), actualA2(), JSON.stringify(actualA1()))
	})

	t.test('Behavior.forwardReference', t => {
		const forwardReference = Behavior.forwardReference()
		const r = forwardReference.assign(Behavior.create(Math.random))
		const t0 = Symbol()
		const t1 = Symbol()
		t.equal(r.sample(t0), forwardReference.sample(t0))
		t.equal(r.sample(t1), forwardReference.sample(t1))
	})
})
