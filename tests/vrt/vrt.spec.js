/**
 * Visual regression tests for every story with a `.scenario`.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
const { expect, test } = require( './fixtures' );
const { runInteractions, runStoryHooks } = require( './interactions' );
const { waitForStoryReady } = require( './readiness' );
const { getScenarios, validateAgainstBuild } = require( './scenarios' );
const viewports = require( './viewports' );

const scenarios = getScenarios();
const problems = validateAgainstBuild( scenarios );

if ( problems.length ) {
	throw new Error( problems.join( '\n' ) );
}

for ( const scenario of scenarios ) {
	// `playwright.config.js` skips `@only-<viewport>` tests in other viewports.
	const tag =
		scenario.viewports.length < viewports.length
			? scenario.viewports.map( ( label ) => `@only-${ label }` )
			: [];

	test( scenario.label, { tag }, async ( { openStory }, testInfo ) => {
		const { page, network } = await openStory( scenario );

		await waitForStoryReady( page, scenario, network );
		await runInteractions( page, scenario, network );
		await runStoryHooks( page, scenario, network, testInfo.project.name );

		network.assertHealthy();

		// Saved as `__screenshots__/<story path>/<viewport>.png`.
		const directories = scenario.slug.slice( 0, -1 );
		const name = `${ scenario.slug[ scenario.slug.length - 1 ] }.png`;

		await expect( page ).toHaveScreenshot( [ ...directories, name ], {
			fullPage: true,
		} );
	} );
}
