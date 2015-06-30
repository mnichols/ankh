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

examples: build
	cp -r ./build/* ./examples/
	pushd ./examples; python -m SimpleHTTPServer 8001; popd

docs:
	pip install Pygments
	./node_modules/.bin/groc ./lib/**/*.js README.md
	pushd ./doc; python -m SimpleHTTPServer; popd


.PHONY: test ci build verbose silent docs examples
