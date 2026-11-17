// Static checks on the Anatomy Match and Municipalities stylesheets, for
// layout bugs a server render cannot show (it does no layout):
//   node scripts/check-game-css.mjs
//
// Each game's main area is a grid with align-items: start above 700px and a
// flex column at 700px and below. Without align-items: stretch there, every
// card and the figure panel shrink to their content's width, and the panel
// (a size container, whose content does not size it) collapses to nothing,
// taking the figures with it. These checks guard that, and that the phone
// layout does not depend on CSS older iPhones lack.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

let passed = 0
function check(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ok  ${name}`)
  } catch (err) {
    console.error(`  FAIL  ${name}\n        ${err.message}`)
    process.exitCode = 1
  }
}

// A small CSS reader: every declaration with the selector and at-rule
// headers around it. Comments are removed first.
function parse(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const decls = []
  const stack = []
  let buf = ''
  for (const ch of text) {
    if (ch === '{') {
      stack.push(buf.trim())
      buf = ''
    } else if (ch === '}') {
      if (buf.trim()) pushDecls(buf)
      stack.pop()
      buf = ''
    } else if (ch === ';') {
      pushDecls(buf)
      buf = ''
    } else {
      buf += ch
    }
  }
  function pushDecls(raw) {
    const d = raw.trim()
    const i = d.indexOf(':')
    if (i < 0) return
    decls.push({
      prop: d.slice(0, i).trim(),
      value: d.slice(i + 1).trim(),
      selector: stack[stack.length - 1] ?? '',
      atRules: stack.slice(0, -1).filter((h) => h.startsWith('@')),
    })
  }
  return decls
}

const PHONE = '@media (max-width: 700px)'
const inPhone = (d) => d.atRules.includes(PHONE)

const games = [
  {
    name: 'Anatomy Match',
    file: '../src/practice/anatomy.css',
    main: '.anatomy-game__main',
    figureBoxes: [
      '.anatomy-fig--face .anatomy-fig__board',
      '.anatomy-fig--front .anatomy-fig__crop',
      '.anatomy-fig--front .anatomy-fig__board',
    ],
    // Each figure box with every wrapper above it, up to the full width
    // row. A wrapper inside a centered flex column shrinks to its content,
    // so each must get a definite width (a percent width, or a flex basis
    // of 0 in a row) or a percent width below it resolves to zero.
    chains: [
      ['.anatomy-fig--face', '.anatomy-fig--face .anatomy-fig__crop', '.anatomy-fig--face .anatomy-fig__board'],
      ['.anatomy-fig--front', '.anatomy-fig--front .anatomy-fig__crop', '.anatomy-fig--front .anatomy-fig__board'],
      ['.anatomy-fig--back', '.anatomy-fig--back .anatomy-fig__crop', '.anatomy-fig--back .anatomy-fig__board'],
    ],
  },
  {
    name: 'Municipalities',
    file: '../src/practice/municipality.css',
    main: '.muni-match__main',
    figureBoxes: ['.muni-match .muni-view'],
    chains: [['.muni-match .muni-view']],
  },
]

for (const g of games) {
  const decls = parse(readFileSync(new URL(g.file, import.meta.url), 'utf8'))
  const phone = decls.filter(inPhone)

  check(`${g.name}: at 700px and below the main column stretches its cards and panel to full width`, () => {
    const d = phone.find((x) => x.selector === g.main && x.prop === 'align-items')
    assert.ok(d, `no align-items on ${g.main} in ${PHONE}`)
    assert.equal(d.value, 'stretch')
  })

  check(`${g.name}: at 700px and below every figure box has an explicit width and an aspect ratio`, () => {
    for (const sel of g.figureBoxes) {
      const rules = phone.filter((x) => x.selector.split(',').map((s) => s.trim()).includes(sel))
      assert.ok(rules.some((x) => x.prop === 'width' && /%/.test(x.value)), `${sel}: no percent width`)
      assert.ok(rules.some((x) => x.prop === 'aspect-ratio'), `${sel}: no aspect-ratio`)
    }
  })

  // Phone rules for one selector (also when it is one of a list).
  const phoneRules = (sel) => phone.filter((x) => x.selector.split(',').map((s) => s.trim()).includes(sel))

  check(`${g.name}: at 700px and below each figure box and every wrapper above it has a definite width`, () => {
    for (const chain of g.chains) {
      for (const sel of chain) {
        const rules = phoneRules(sel)
        const pctWidth = rules.some((x) => x.prop === 'width' && /^\d+(\.\d+)?%$/.test(x.value))
        const flexZero = rules.some((x) => x.prop === 'flex' && /^\d+ \d+ 0(px)?$/.test(x.value))
        assert.ok(pctWidth || flexZero, `${sel}: no percent width or flex basis 0 at 700px and below`)
      }
    }
  })

  check(`${g.name}: phone sizes of figure boxes use only defined variables and no negative or zero widths`, () => {
    const defined = new Set(decls.filter((x) => x.prop.startsWith('--')).map((x) => x.prop))
    // Variables set inline from the components.
    for (const v of ['--ar', '--ar-main', '--ar-inset', '--cx', '--cy', '--w', '--h']) defined.add(v)
    for (const chain of g.chains) {
      for (const sel of chain) {
        for (const x of phoneRules(sel).filter((r) => ['width', 'min-width', 'height', 'aspect-ratio', 'flex'].includes(r.prop))) {
          for (const [, v] of x.value.matchAll(/var\((--[\w-]+)/g)) {
            assert.ok(defined.has(v), `${sel} ${x.prop} uses undefined ${v}`)
          }
          // A zero or negative width collapses the box. (min-width: 0 is
          // fine: it only lets a flex item shrink.)
          if (x.prop === 'width') assert.ok(!/^-|^0(px|%)?$/.test(x.value), `${sel} width: ${x.value}`)
          if (x.prop === 'min-width') assert.ok(!/^-/.test(x.value), `${sel} min-width: ${x.value}`)
        }
      }
    }
  })

  check(`${g.name}: the phone layout uses no container units (cqi)`, () => {
    const bad = phone.filter((x) => /cqi/.test(x.value))
    assert.equal(bad.length, 0, bad.map((x) => `${x.selector} ${x.prop}`).join(', '))
  })

  check(`${g.name}: container units are only used inside @supports (width: 1cqi)`, () => {
    const bad = decls.filter((x) => /\dcqi/.test(x.value) && !x.atRules.some((a) => a.startsWith('@supports') && a.includes('cqi')))
    assert.equal(bad.length, 0, bad.map((x) => `${x.selector} ${x.prop}`).join(', '))
  })

  check(`${g.name}: every dvh has a vh fallback (an earlier vh declaration, or inside @supports for dvh)`, () => {
    const bad = []
    decls.forEach((x, i) => {
      if (!/\ddvh/.test(x.value)) return
      if (x.atRules.some((a) => a.startsWith('@supports') && a.includes('dvh'))) return
      const earlier = decls.slice(0, i).some((y) => y.selector === x.selector && y.prop === x.prop &&
        y.atRules.join() === x.atRules.join() && /\dvh/.test(y.value) && !/dvh/.test(y.value))
      if (!earlier) bad.push(`${x.selector} ${x.prop}`)
    })
    assert.equal(bad.length, 0, bad.join(', '))
  })
}

console.log(`\n${passed} passed${process.exitCode ? ', some failed' : ''}`)
