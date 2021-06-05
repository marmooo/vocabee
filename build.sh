dir=docs
cp -r src/* $dir
minify src/index.html > $dir/index.html
minify src/index.js > $dir/index.js
minify src/drill/drill.js > $dir/drill/drill.js
minify src/drill/index.html > $dir/drill/index.html
minify src/sw.js > $dir/sw.js

