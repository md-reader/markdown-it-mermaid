import mermaid from 'mermaid'
import type mermaidAPI from 'mermaid/mermaidAPI'
import murmur3 from 'murmurhash-js'

interface MermaidPlugin {
  (md: any, opts: mermaidAPI.Config): void
  default: {
    dictionary: {
      token: string
    }
  } & mermaidAPI.Config
}

const sanitize = (str: string) =>
  String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const MermaidChart = (code: string) => {
  try {
    const needsUniqueId = 'mermaid-render' + murmur3(code, 42).toString()
    mermaid.mermaidAPI.render(needsUniqueId, code, sc => {
      code = sc
    })
    return `<pre class="mermaid">${code}</pre>`
  } catch (err: any) {
    return `<pre>${sanitize(err.message)}</pre>`
  }
}

const MermaidPlugin: MermaidPlugin = (md, opts) => {
  Object.assign(MermaidPlugin.default, opts)

  const { token: _token = 'mermaid', ...dictionary } =
    MermaidPlugin.default.dictionary
  mermaid.initialize(MermaidPlugin.default)

  const renderer = md.renderer.rules.fence.bind(md.renderer.rules)

  function replacer(_, p1, p2, p3) {
    p1 = dictionary[p1] ?? p1
    p2 = dictionary[p2] ?? p2
    return p2 === '' ? `${p1}\n` : `${p1} ${p2}${p3}`
  }

  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx]
    const code = token.content.trim()
    if (token.info.trim() === _token) {
      return MermaidChart(code.replace(/(.*?)[ \n](.*?)([ \n])/, replacer))
    }
    return renderer(tokens, idx, opts, env, self)
  }
}

MermaidPlugin.default = {
  dictionary: {
    token: 'mermaid',
  },
}

export default MermaidPlugin
