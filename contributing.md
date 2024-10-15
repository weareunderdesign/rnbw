# contributing to rainbow

a big welcome and thank you for considering contributing to rainbow!
contributions are always welcome, and you can quickly get your fix or improvement slated for the next release.
the contributors’ community can be found on [github discussions](), where you can ask questions, voice ideas, and share your projects.

## get started

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
5. create a branch locally, based on the `dev` branch.
6. follow the [project board](https://github.com/orgs/rnbwdev/projects/2) and take the first to-do that makes sense to you. go top-down.
   1. focus on the terms and specs for each task.
   2. make sure you fully understand it before you begin.
7. code. please keep the best practices and code style and follow any formatting and testing guidelines specific to this repo.
8. commit changes to your branch.
9. keep your branch always in sync with the `dev` branch.

### pull requests

when reviewing a new PR, we prioritize testing the working functionality and then reviewing the code rather than the other way around.
shortly describe how you understand the issue and how you will resolve it. doing so helps ensure everyone is on the same page and can uncover mistakes.

in general, prs should:

- address a single concern in the least number of changed lines as possible.
- include documentation in the repo or on our docs site.
- be tagged with the relevant corresponding issues.
- have a summary of your changes within the corresponding issues.

that's it! 🎉

## bundle

To create `rnbw` bundle file, run the following command:

```
npm run build
```

You’ll find the generated file at `dist` directory.

## release

to release `rnbw`, follow these simple steps:

1. Push Changes in `dev` branch.
2. GitHub Actions will automatically trigger the workflow to release `rnbw`.

### github action workflow overview

the workflow file [`deploy.yml`](https://github.com/weareunder/rnbw/blob/main/.github/workflows/deploy.yml) runs **_Build_** and **_Deploy_** jobs.

1. **_Build_**: This job is responsible for preparing the project for deployment. It checks out the repository, detects the package manager, sets up Node.js, installs dependencies, builds the project, and uploads the built project.
2. **_Deploy_**: This job handles the deployment to GitHub Pages.

## code of conduct

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
