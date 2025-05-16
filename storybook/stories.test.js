/**
 * Failing stories test runner.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Node dependencies
 */
import path from 'path';

/**
 * External dependencies
 */
import initStoryshots from '@storybook/addon-storyshots';
import { puppeteerTest } from '@storybook/addon-storyshots-puppeteer';

/**
 * Creates a custom puppeteer test that fails on console errors.
 *
 * @since 1.23.0
 *
 * @param {Object} options Options for puppeteerTest.
 * @return {Function} Test function.
 */
const puppeteerTestWithErrorHandling = ( options ) => {
	const originalTest = puppeteerTest( options );

	return ( { story, context } ) => {
		const testFn = originalTest( { story, context } );

		return async () => {
			const consoleErrors = [];

			const page = options.getPage
				? await options.getPage()
				: global.page;

			page.on( 'console', ( msg ) => {
				if ( msg.type() === 'error' ) {
					consoleErrors.push( msg.text() );
				}
			} );

			await testFn();

			if ( consoleErrors.length > 0 ) {
				throw new Error(
					`Console errors detected during story rendering:\n${ consoleErrors.join(
						'\n'
					) }`
				);
			}
		};
	};
};

initStoryshots( {
	suite: 'Puppeteer storyshots',
	configPath: path.resolve( __dirname, '../storybook' ),
	test: puppeteerTestWithErrorHandling( {
		// eslint-disable-next-line sitekit/acronym-case
		storybookUrl: `file://${ path.resolve( __dirname, '../dist' ) }`,
		setupTimeout: 5000,
		testTimeout: 5000,
	} ),
} );
