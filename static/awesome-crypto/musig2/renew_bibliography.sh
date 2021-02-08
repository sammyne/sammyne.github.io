#!/bin/bash

# ref: https://www.overleaf.com/learn/latex/bibliography_management_with_bibtex
# ref: http://www.bibtex.org/Using/

xelatex README
bibtex README
xelatex README
xelatex README
