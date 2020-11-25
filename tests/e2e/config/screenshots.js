import path from 'path';

const screenshotsPath = path.resolve( __dirname, '../screenshots' );
const toFilename = ( s ) => s.replace( /[^a-z0-9.-]+/gi, '_' );

function takeScreenshot( testName, pageInstance = page ) {
	return pageInstance.screenshot( {
		path: path.join(
			screenshotsPath,
			toFilename( `${ new Date().toISOString() }_${ testName }.png` ),
		),
	} );
}

export function registerScreenshotReporter() {
	/**
	 * Jasmine reporter does not support async.
	 * So we store the screenshot promise and wait for it before each test.
	 */
	let screenshotPromise = Promise.resolve();

	beforeEach( () => screenshotPromise );
	afterAll( () => screenshotPromise );

	/**
	 * Take a screenshot on Failed test.
	 * Jest standard reporters run in a separate process so they don't have
	 * access to the page instance. Using jasmine reporter allows us to
	 * have access to the test result, test name and page instance at the same time.
	 */
	jasmine.getEnv().addReporter( {
		specDone: async ( result ) => {
			if ( result.status === 'failed' ) {
				screenshotPromise = screenshotPromise
					.catch()
					.then( takeScreenshot.bind( null, result.fullName ) );
			}
		},
	} );
}
