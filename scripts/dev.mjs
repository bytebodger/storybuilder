/**
 * Start the bridge and the console together.
 *
 * They were two commands in two terminals, and forgetting the bridge is the
 * easy mistake to make: the console comes up looking fine and every request it
 * makes turns into a 500 from the Vite proxy, which reads as a crash rather
 * than as a missing service.
 *
 * No dependency for this. Spawning two children and forwarding their output is
 * a few dozen lines, and the alternative is adding a package to the root of a
 * repo that has managed without one.
 */
import { spawn } from 'node:child_process'

const RESET = '\x1b[0m'
const parts = [
  { name: 'bridge', dir: 'bridge', colour: '\x1b[36m' },
  { name: 'web', dir: 'web', colour: '\x1b[35m' },
]

let shuttingDown = false

const children = parts.map(({ name, dir, colour }) => {
  // `npm --prefix` rather than a cwd, so this works the same from anywhere in
  // the repo. `shell: true` because npm is a shell script on Windows.
  const child = spawn('npm', ['--prefix', dir, 'run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  })

  const label = `${colour}[${name}]${RESET} `
  const forward = (stream, to) => {
    stream.setEncoding('utf8')
    let rest = ''
    stream.on('data', (chunk) => {
      const lines = (rest + chunk).split('\n')
      rest = lines.pop() ?? ''
      for (const line of lines) to.write(label + line + '\n')
    })
  }
  forward(child.stdout, process.stdout)
  forward(child.stderr, process.stderr)

  child.on('exit', (code) => {
    // One of them dying leaves the other useless - a console with no bridge
    // behind it is the exact failure this script exists to prevent - so the
    // pair goes down together, and says which one went first.
    if (shuttingDown) return
    process.stderr.write(`${label}exited with code ${code}. Stopping the other.\n`)
    stop(code ?? 1)
  })

  return child
})

function stop(code) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) child.kill()
  process.exit(code)
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(0))
