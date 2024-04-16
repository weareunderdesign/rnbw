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

## contributing to rainbow

a big welcome and thank you for considering contributing to rainbow!
contributions are always welcome, and you can quickly get your fix or improvement slated for the next release.
the contributors’ community can be found on [github discussions](), where you can ask questions, voice ideas, and share your projects.


### get started

1. fork the repository to your own github account.
2. clone the repository
    
    ```
    git clone git@github.com:username/rainbow.git
    ```
    
3. run the project from the root directory.
    
    ```
    npm install
    ```
    
    ```
    npm start
    ```
    
4. visit `http://localhost:8080/`
5. create a branch locally.
7. follow the [project board](https://github.com/orgs/rnbwdev/projects/4/views/1) and take the first to-do that makes sense to you. go top-down.
    1. focus on the terms and specs for each task.
    2. make sure you fully understand it before you begin.
8. code!
    1. please keep the best practices and code style and follow any formatting and testing guidelines specific to this repo.
    2. collaborate. collaborate. collaborate. share what you do, did and will do.
9. commit changes to your branch. (don’t rush to push the latest code to your branch. that’s a waste of time.)
10. keep your branch always in sync with the dev branch.

### pull requests
when reviewing a new PR, we prioritize testing the working functionality and then reviewing the code rather than the other way around.
shortly describe how you understand the issue and how you will resolve it. doing so helps ensure everyone is on the same page and can uncover mistakes.

in general, prs should:

- address a single concern in the least number of changed lines as possible.
- include documentation in the repo or on our docs site.
- be tagged with the relevant corresponding issues.
- have a summary of your changes within the corresponding issues.

that's it! 🎉

### bundling

…

### releasing

…

### code of conduct

we take our open-source community seriously and hold ourselves and other contributors to high communication standards. you agree to uphold our [code of conduct](https://github.com/relateapp/rene.css/blob/main/code_of_conduct.md) by participating and contributing to this project.


non-code contributions are more than welcome! How?

- invite your teammates!
- star this repo or follow us on Twitter or Instagram.
- share designs and ideas, ask questions, react to others’ articles or open your conversations in the community
- report bugs with GitHub issues.
- create and share libraries & templates that will be helpful for the community.
- share some feedback directly.

## community

join the [community](https://github.com/orgs/rnbwdev/discussions) to chat with other community members, ask questions ideas, and share your work.

## license
[GNU General Public License, version 3](https://www.gnu.org/licenses/gpl-3.0.en.html)
