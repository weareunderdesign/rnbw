# rnbw 0.1

welcome to rnbw!

## get started

to learn rnbw, go to https://rnbw.design.

## run it locally:
1. npm install
2. npm start
3. visit `http://localhost:8080/`

## architecture

rainbow has three core parts:
1. action panel (left panel - react-complex-tree)
    1. files tree view
    2. nodes tree view
        1. settings panel
2. stage (live preview and design editor)
3. code (code editor - monaco-editor)

each time you change any part, the other parts change as well. this means there’s a unique id for each node so that we can detect which node has been changed and update its states globally.

each object with events is called a “node” - so when the nodes change, the global state also changes.

## codebase
`/config` - we will use it for some project config settings. such as “toast-duration”.

`/_node` - all of the node apis including parse,serialize file would be there.

`/_redux` - redux code goes into this folder. each reducer has its sub-folder.

`/app` - the code related to the root app component goes here.

`/components` - all of the react fc goes here.

`/pages` - the in-project pages we are gonna build. they will work inside the browser- router

`/services` - functions or constants useful for coding.

`/types` - the global interfaces or types we use in the app.

for each react-redux-reducer, we must keep the following structure.

```
/template
	index.ts - import/export everything in index.ts. use path alias to import.
	selectors.ts
	slice.ts
	types.ts - an interface or type for each code part or fc.
```

## dependencies

rainbow is heavily dependent on incredible technologies. if you’re considering contributing code, study the below packages and libraries and get ready to fully customize them .

- [react](https://github.com/facebook/react) - 💁‍♂️
- [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) - the code editor.
- [react-complex-tree](https://github.com/lukasbach/react-complex-tree) - an non-opinionated accessible tree component.
- [⌘k](https://github.com/pacocoursey/cmdk) is a command menu react component.
- [redux](https://github.com/reduxjs/redux)
    - @reduxjs/toolkit
    - redux-injectors
    - [redux-undo](https://github.com/omnidan/redux-undo)
- [parse5](https://github.com/inikulin/parse5)
- [file-system-access](https://www.npmjs.com/package/file-system-access) - file system apis
- [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) - for creating resizable panels
- [react-top-loading-bar](https://github.com/klendi/react-top-loading-bar) - for showing a loading bar at the top
- [workbox-window](https://developer.chrome.com/docs/workbox/) - service worker library for giving pwa features
- [react-toastify](https://www.npmjs.com/package/react-toastify) - for showing toast style notifications
- [idb-keyval](https://www.npmjs.com/package/idb-keyval) - promise-based keyval store implemented with indexeddb
- [js-beautify](https://www.npmjs.com/package/js-beautify) - for prettifying the code
- [jszip](https://stuk.github.io/jszip/) - for zipping the project files before downloading
- [morphdom](https://github.com/patrick-steele-idem/morphdom) - dom-diffing lib to update stage without reloading
- [buffer](https://www.npmjs.com/package/buffer) - it’s a polyfill. the buffer module from node.js, for the browser.

### dependencies by rainbow

- [references](https://github.com/rnbwdev/references) - an open collection of web references.
    - inventory - rainbow is using it as the source of information for rainbow node types.
    - validation - the validation mechanism is heavily based on the segmentation of nodes.
- [rene.css](https://github.com/rnbwdev/rene.css) a utility-first css framework for styling clean, simple, and lightweight interfaces, fully customizable with variables, themes, and icons. easy syntax to quickly “get it” and create any design in any framework.
- [svg-icon.js](https://github.com/rnbwdev/svg-icon.js) - an svg icon component for the web. optimized for smooth design and development experience. it fits into any web framework and can be used anyhow.
- [raincons](https://github.com/rnbwdev/raincons) - 12x12 icon set.

## bundle

To create `rnbw` bundle file, run the following command:

```
npm run build
```

You’ll find the generated file at `/dist/client.bundle.js`

## release

To release `rnbw`, follow these simple steps:
1. Push Changes in `main` branch.
2. GitHub Actions will automatically trigger the workflow to release `rnbw`.

### GitHub action workflow overview

The workflow file [`deploy.yml`](https://github.com/rnbwdev/rnbw/blob/main/.github/workflows/deploy.yml) runs ***Build*** and ***Deploy*** jobs.

1. ***Build***: This job is responsible for preparing the project for deployment. It checks out the repository, detects the package manager, sets up Node.js, installs dependencies, builds the project, and uploads the built project.
2. ***Deploy***:  This job handles the deployment to GitHub Pages.

## community

join the [community](https://github.com/orgs/rnbwdev/discussions) to chat with other community members, ask questions ideas, and share your work.

## license
[GNU General Public License, version 3](https://www.gnu.org/licenses/gpl-3.0.en.html)
