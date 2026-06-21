.PHONY: install dev build start typecheck pack dist dist-mac dist-win dist-linux clean

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

pack:
	npm run pack

dist:
	npm run dist

dist-mac:
	npm run dist:mac

dist-win:
	npm run dist:win

dist-linux:
	npm run dist:linux

clean:
	rm -rf out dist node_modules
