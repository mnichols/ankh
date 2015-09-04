LOG = export DEBUG=ankh:*

build: clean
	./node_modules/.bin/gulp build
	./node_modules/.bin/gulp dist

ci: clean node_modules build
	./node_modules/.bin/mocha ./test/**-spec.js
	./node_modules/.bin/gulp test
	./node_modules/.bin/karma start karma.conf-ci.js

test: clean node_modules build
	./node_modules/.bin/mocha ./test/**-spec.js
	./node_modules/.bin/gulp test
	./node_modules/.bin/karma start karma.conf.js

verbose:
	$(eval LOG = export DEBUG=ankh:*)

silent:
	LOG = unset DEBUG

clean:
	rm -rf build

node_modules: package.json
	npm install --quiet

examples: dist
	cp -r ./build/* ./examples/
	pushd ./examples; python -m SimpleHTTPServer 8001; popd

docs:
	./node_modules/.bin/doxx --title Ankh --source lib --target docs

publish: docs
	./node_modules/.bin/gh-pages -d docs

view-docs: docs
	pushd ./docs; python -m SimpleHTTPServer 3000; popd

.PHONY: test ci build verbose silent docs examples view-docs publish
