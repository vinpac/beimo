import nesting from 'postcss-nesting'
import nested from 'postcss-nested'
import filters from 'pleeease-filters'
import flexBugsFixes from 'postcss-flexbugs-fixes'
import notSelector from 'postcss-selector-not'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    nesting(),
    nested(),
    filters(),
    notSelector(),
    flexBugsFixes(),
    autoprefixer(),
  ],
}
