## Release instructions

* **Use and update master:**: `git checkout master && git pull`
* **Bump version across plugin:**
   * `google-site-kit.php` - in the plugin header as well as the `GOOGLESITEKIT_VERSION` constant. 
   * `package.json` - in the version string in and update `package-lock.json`.
   * `composer.json` - in the version string in and update `composer.lock`.
   * `readme.txt` - in the plugin header.
* **Update changelogs:** update the changelog in `CHANGELOG.md` based on the release milestone. Copy changes to changelog section in `readme.txt`.
* **Commit and push master:** `git commit -am 'Update readme & bump version.' && git push`
* **Update preprod:** `git checkout preprod && git pull && git merge master && git push`. After the plugin deplys to preprod, test activating and basic UI. _There should be no PHP notices or console errors._
* **Check out the `release` branch:** `git checkout release && git pull`.
* **Merge release updates:** Make a non-fast-forward merge from `master` to `release` which now contains the stable release version: `git merge master --no-ff && git push`. Resolve any conflicts by using the version coming from `master`.
* **Build release:** run `npm install && npm run release`. This will create a `release` folder with the latest plugin version. Note: ensure that any new files are in the `release` folder (if not, add them to `gulp-tasks/copy.js`).
* **Test release:** Test running Site Kit locally from the `release` folder and run through plugin setup and a few common tasks in the UI to ensure functionality. _There should be no PHP notices or console errors._
* **Push release:** Change to the `release` directory `cd release` add all files: `git add *` commit: `git commit -am 'Release X.Y.Z' --no-verify` and push: `git push origin stable`.
* **Tag release:** Tag the release: `git tag release/X.Y.Z` and push: `git push --tags`.
* **Finish up:** Switch to root folder: `cd ../` and checkout master `git checkout master`.
* **Draft GitHub release:** Create and publish a [new release](https://github.com/google/site-kit-wp/releases/new). Select the `release/X.Y.Z` tag, and copy in the release changelog.
* **Add Zip files:** Createa and upload the zip files to the release. `npm run release-zip` and `npm run release-zip-wp50`. Test these zips.
* **Publish the Release**
**Close Milestone & Create the next one**
