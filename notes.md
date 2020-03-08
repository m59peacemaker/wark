// maybe TODO: turn your push based types into a type implementing Observable, transduce it, convert back to your type. You could use a helper like `Emitter.asObservable(tranduceStuff)` that takes and returns an Emitter, but converts to and from Observable to interop with the given fn
// const asObservable = fnOnObservable =>  emitter => fromObservable(fnOnObservable(toObservable(emitter)))

on Behavior vs IO, what is a behavior
const click = Event()
const random = Behavior.create(Math.random)
const randWhenClickedA = Event.tag (random) (click)
const rameWhenClickedB = Event.tag (random) (click)

not positive this idea will be used, but it is super cool
Behavior(Behavior) means all the behaviors that could be derived from the expression
Behavior(Behavior) means all the accumulations that could be derived from the expression / that could possibly come about to be due to the expression
an accumulation of [ 1, 2, 3, 4, 5 ] if you sampled it at the time of 1, or an accumulation of [ 4, 5 ] if you sampled at the time of 4, etc
the outer behavior represents the inner changing behavior, so sampling the outer one gives you one specific accumulation behavior out of the many possible behaviors


const a = [ 1, 2, 3 ]
const x = Event.of(...a)
const b = Array.map (add(1)) (a)
const y = Event.map (add(1)) (x)
t.deepEqual(b, y)
also, completion would be nice for parity with arrays... maybe add on completion as needed, instead of all Events having it?
need rules about propagations as they pertain to items in an array
[ 1, 2, 3 ] // 3 items in an array right now
[ [ 1 ], [ 2, 3 ] ] => [ 1, 2, 3 ]
flatten

perhaps have an execution context in which emits are queued and then executed at the end, so that subscribes can run first

Event.of(1, 2, 3), outside of time is three occurrences that can't be realized unless they're in time
const x = Event.of(1, 2, 3)
x.subscribe(f)
withinTime(x)
withinTime(() => x)

Event.of (time) ([ 1, 2, 3 ]) // Event(List(Occurrence(List(1, 2, 3)))) event with list of one occurrence with a list of 3 values
Event.of (time) (1, 2, 3) // Event(List(Occurrence(1), Occurrence(2), Occurrence(3))) Event with a list of 3 occurrences each with one value
const a = Event.of([ 1, 2, 3 ])
const b = Event.chain (list => Event.of(...list)) (a)
const c = Event.bufferN (3) (1) (b)
const d = Event.concatAll ([ a, c ]) { time: 1, value: [ 1, 2, 3 ] }, { time: 4, value: [ 1, 2, 3 ] }

[ Occurrence(1), Occurrence(2), Occurrence(3) ] // 3 items in an array eventually
Event.of(1, 2, 3) // should be able to turn this directly into [ 1, 2, 3 ]
Dynamic.fold (add) (0) (Event.of(1, 2, 3))
const Sync = dynamic => {
	const subscribe = f => {
		f(dynamic.sample())
		return dynamic.subscribe(f)
	}
	return { ...dynamic, subscribe }
}

const cacheBustingTime = (n => ({ current: () => ++n, forward: noop }))(0)
const findTime = behaviors => (behaviors.find(b => b.time !== Always) || behaviors[0]).time
const of = value => create(Always, () => value)



TODO: solve the issue of whether Event is a list of occurrences across time or a list across time of a list of simultaneous occurrences
if the latter, then flatMap, etc work naturally in cases where there are simultaneous events... otherwise, you have a list of occurrences where only a single value makes sense here
const flatMap = f => e => {
	const dependencies_emitter = Emitter.scan (v => acc => acc.concat(v)) ([ ]) (e)
	const event = DerivedEvent((emit, occurrences) => {
		const values = Object.values(occurrences)
		emit(f(values.length > 1 ? values : values[0]))
		onsole.log({ occurrences: Object.values(dependency_occurrences) })
		Object.values(dependency_occurrences).forEach((v, index) => {
			console.log({ v })
				if (index === 0) event.occurrence_pending.emit()
			emit(f(v))
		})
		values.slice(1).forEach(() => event.occurrence_settled.emit())
	}, dependencies_emitter)
	return event
}

function Event (time, fn = noop) {
	const e = AtemporalEvent()

	const emit = value => time.forward(() => e.emit(value))

	const start = () => fn(emit)

	if (time.current() > 0) {
		//once (time.momentEnd) (start)
		time.forward(start)
	} else {
		time.start.subscribe(start)
	}

	return {
		...e,
		emit,
		time
	}
}
const once = emitter => f => {
	const u = emitter.subscribe((...args) => {
		u()
		f(...args)
	})
	return u
}

const bufferN = n => startEvery => source => {
	return filter
		(buffer => buffer.length === n)
		(snapshot (identity) (Behavior.bufferN (n) (startEvery) (source)) (source))
}

const pairwise = bufferN (2) (1)

export const switchLatest = switchMap (identity)
export const flatMap = f => emitter => DerivedEmitter(fold (v => acc => acc.concat(f(v))) ([]) (emitter))
export const flatten = flatMap (identity)
export const concat = a => b => concatAll([ a, b ])
export const proxy = () => createProxy ({ create, switchLatest, push: 'emit' })
export const recentN = n => fold
	(v => acc => [ ...acc.slice(Math.max(0, acc.length - n + 1)), v ])
	([])

test('Emitter.bufferN', async t => {
	await t.test('bufferN (4) (1)', async t => {
		const expected = [
			[ 1, 2, 3, 4 ],
			[ 2, 3, 4, 5 ],
			[ 3, 4, 5, 6 ]
		]
		const actual = []

		const a = Emitter.create()
		const b = Emitter.bufferN (4) (1) (a)

		b.subscribe(value => actual.push(value))

		await Promise.all([ 1, 2, 3, 4, 5, 6 ].map(a.emit))

		t.deepEqual(actual, expected)
	})

	t.test('bufferN (3) (3)', async t => {
		const expected = [
			[ 1, 2, 3 ],
			[ 4, 5, 6 ],
			[ 7, 8, 9 ]
		]
		const actual = []

		const a = Emitter.create()
		const b = Emitter.bufferN (3) (3) (a)

		b.subscribe(value => actual.push(value))

		await Promise.all([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ].map(a.emit))
		
		t.deepEqual(actual, expected)
	})
	return
	t.test('bufferN (3) (2)', async t => {
		const expected = [
			[ 1, 2, 3 ],
			[ 3, 4, 5 ],
			[ 5, 6, 7 ]
		]

		const a = Emitter.create()
		const b = Emitter.bufferN (3) (2) (a)

		b.subscribe(value => t.deepEqual(value, expected.shift()))

		;[ 1, 2, 3, 4, 5, 6, 7, 8 ].forEach(a.emit)
	})

	t.test('bufferN (2) (4)', t => {
		const expected = [
			[ 1, 2 ],
			[ 5, 6 ],
			[ 9, 10 ]
		]
		t.plan(expected.length)

		const a = Emitter.create()
		const b = Emitter.bufferN (2) (4) (a)

		b.subscribe(value => t.deepEqual(value, expected.shift()))

		;[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ].forEach(a.emit)
	})
})

test('Emitter.pairwise', t => {
	const expected = [
		[ 1, 2 ],
		[ 2, 3 ],
		[ 3, 4 ]
	]
	t.plan(expected.length)
	const a = Emitter.create()
	const b = Emitter.pairwise(a)

	b.subscribe(value => t.deepEqual(value, expected.shift()))

	;[ 1, 2, 3, 4 ].forEach(a.emit)
})

// TODO: not currently usable
export const of = (...values) => Event(emit => values.forEach(value => emit(value)))