.PHONY: install dev build start typecheck clean

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start: build
	npm run start

typecheck:
	npm run typecheck

clean:
	rm -rf out node_modules
