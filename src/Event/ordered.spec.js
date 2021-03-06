import { test } from 'zora'
import { Event, Dynamic } from '../index.js'

test('Event.ordered', t => {
	t.test('zipping zipped - sanity checking', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.create()
		const ab = Event.zip([ a, b ])
		const abv = Dynamic.hold ([]) (ab)
		b.occur(2)
		a.occur(1)
		t.deepEqual(abv.sample(), [ 1, 2 ])
		const abc = Event.map (([ a, b ]) => [ ...a, b ]) (Event.zip([ ab, c ]))
		const abcv = Dynamic.hold ([]) (abc)
		c.occur(3)
		a.occur(1)
		b.occur(2)
		t.deepEqual(abcv.sample(), [ 1, 2, 3 ])
	})
	t.test('events later in the list occur when/after the foregoing events', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.create()
		const ordered_ab = Dynamic.hold ([]) (Event.ordered ([ a, b ]))
		a.occur(1)
		t.deepEqual(ordered_ab.sample(), [ 1 ])
		b.occur(2)
		t.deepEqual(ordered_ab.sample(), [ 2 ])
		b.occur(4)
		t.deepEqual(ordered_ab.sample(), [ 2 ]) // unchanged
		a.occur(3)
		t.deepEqual(ordered_ab.sample(), [ 3, 4 ])
	})
	t.test('dynamically building the ordered event', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.create()
		const d = Event.create()
		const e = Dynamic.fold
			(event => ({ events }) => (events => ({ events, ordered: Event.ordered(events) })) ([ ...events, event ]))
			({ events: [], ordered: null })
			(d)
		const f = Event.switchMap (({ ordered }) => ordered) (e.update)
		const g = Dynamic.hold ([]) (f)
		d.occur(a)
		a.occur(1)
		t.deepEqual(g.sample(), [ 1 ])
		a.occur(2)
		t.deepEqual(g.sample(), [ 2 ])
		d.occur(b)
		b.occur(4)
		t.deepEqual(g.sample(), [ 2 ]) // unchanged
		a.occur(3)
		t.deepEqual(g.sample(), [ 3, 4 ])
		d.occur(c)
		c.occur(7)
		t.deepEqual(g.sample(), [ 3, 4 ]) // unchanged
		a.occur(5)
		t.deepEqual(g.sample(), [ 5 ])
		b.occur(6)
		t.deepEqual(g.sample(), [ 6, 7 ])
		a.occur(8)
		t.deepEqual(g.sample(), [ 8 ])
		a.occur(9)
		t.deepEqual(g.sample(), [ 9 ])
		b.occur(10)
		t.deepEqual(g.sample(), [ 10 ])
		c.occur(11)
		c.occur(13)
		t.deepEqual(g.sample(), [ 11 ])
		b.occur(12)
		b.occur(15)
		t.deepEqual(g.sample(), [ 12, 13 ])
		a.occur(14)
		t.deepEqual(g.sample(), [ 14, 15 ])
	})
})
