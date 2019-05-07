// WARNING: this plugin isn't SSR applicable
// TODO: try to introduce prismjs as the nuxt head meta
import Prism from 'prismjs'

// TODO: figure out the unknown reason for the broken loagLanguages below
//import loadLanguages from 'prismjs/components/'
//loadLanguages(['go'])

import 'prismjs/themes/prism-solarizedlight.css'

// import the language or
// employ the autoloader below
import 'prismjs/components/prism-go'

// autoloader requires to set the languages_path
//import 'prismjs/plugins/autoloader/prism-autoloader'
//Prism.plugins.autoloader.languages_path = '/components/'

import 'prismjs/plugins/line-numbers/prism-line-numbers.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers'

import 'prismjs/plugins/line-highlight/prism-line-highlight.css'
import 'prismjs/plugins/line-highlight/prism-line-highlight'

import 'prismjs/plugins/toolbar/prism-toolbar.css'
import 'prismjs/plugins/toolbar/prism-toolbar'

import 'prismjs/plugins/show-language/prism-show-language'

import 'clipboard/dist/clipboard'
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard'

window.Prism = Prism // mount the Prism to the global window object

// REFERENCES
// https://blog.csdn.net/dexing07/article/details/78907639
