
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { set } from 'monolite'
import { join, resolve } from 'path'
import { exec, readFile, writeFile, createTempDirectory } from './utils'
import { readErrorLog } from './readErrorLog'

export type Options = {
  texInputs?: string[]
  shellEscape?: boolean
  compileExtraTimes?: number
}

/**
 * Create ENV for pdflatex with TEXINPUTS correctly set
 */
const createChildEnv = (texInputs: string[] = []) =>
  // Prepend given texInputs
  set(process.env, _ => _.TEXINPUTS)((TEXINPUTS = '') =>
    [
      // Transform relative paths in absolute paths
      ...texInputs.map(path => resolve(process.cwd(), path)),
      ...TEXINPUTS.split(':')
    ]
      // Append colon to use default paths too
      .join(':')
  )

const createCommand = (options: Options) =>
  [
    'pdflatex',
    ...(options.shellEscape ? ['-shell-escape'] : []),
    '-halt-on-error',
    'texput.tex'
  ].join(' ')

/**
 * Compile LaTeX source
 */
const compile = async (tempPath: string, options: Options) => {
  try {
    if (options.compileExtraTimes === null ||
      options.compileExtraTimes === undefined ||
      options.compileExtraTimes < 0)
    {
      options.compileExtraTimes = 0;
    }

    const command = createCommand(options);
    const execOptions = {
      cwd: tempPath,
      env: createChildEnv(options.texInputs)
    };

    let compileTimes = options.compileExtraTimes + 1;
    while (compileTimes-- > 0)
    {
      await exec(command, execOptions);  
    }
    
    return readFile(join(tempPath, 'texput.pdf'))
  } catch {
    throw await readErrorLog(tempPath)
  }
}

/**
 * Create PDF from a LaTeX file
 */
const pdflatex = async (source: string, options: Options = {}) => {
  const tempPath = await createTempDirectory()
  await writeFile(join(tempPath, 'texput.tex'), source)
  return compile(tempPath, options)
}

export default pdflatex
