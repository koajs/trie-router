BIN = ./node_modules/.bin/

test tests:
	@${BIN}mocha \
		--require should \
		--reporter spec \
		--harmony-generators

.PHONY: test tests