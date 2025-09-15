import { test } from '@/test'
import * as locales from '@/locale'
import fs from 'fs'

test('locale.js', ({ mount }) => {
  it('should have listed all available locales in index.js', async () => {
    const imported = Object.keys(locales)
    const dir = fs.readdirSync('src/locale').filter(filename => !['gr.js', 'index.js'].includes(filename))

    expect(dir).toHaveLength(imported.length)

    dir.forEach(filename => expect(locales[filename.replace(/\.js$/, '').replace('-', '')]).not.toBeUndefined())
  })
})
