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

// TODO: #10473 will complete the migration to Storybook test-runner as storyshots is deprecated.

// /**
//  * External dependencies
//  */
// import initStoryshots from '@storybook/addon-storyshots';
// import { puppeteerTest } from '@storybook/addon-storyshots-puppeteer';
// import { getStoryIDFromURL, isIgnored } from './ignore-console-messages';

// function customizePage( page ) {
// 	// Track the current story ID for scoping ignore rules.
// 	let currentStoryID = getStoryIDFromURL( page.url() );

// 	// Update story ID on main frame navigations.
// 	page.on( 'framenavigated', ( frame ) => {
// 		if ( frame === page.mainFrame() ) {
// 			currentStoryID = getStoryIDFromURL( frame.url() );
// 		}
// 	} );

// 	page.on( 'pageerror', ( error ) => {
// 		const messageText = error?.message || String( error );
// 		if ( isIgnored( messageText, currentStoryID ) ) {
// 			return;
// 		}
// 		throw new Error(
// 			`Page error detected during story rendering:\n${ error.message }`
// 		);
// 	} );

// 	page.on( 'console', ( message ) => {
// 		// Only fail on console "error" events.
// 		if ( message.type() !== 'error' ) {
// 			return;
// 		}

// 		const text = message.text();
// 		if ( isIgnored( text, currentStoryID ) ) {
// 			return;
// 		}

// 		throw new Error(
// 			`Console error detected during story rendering:\n${ text }`
// 		);
// 	} );

// 	return page;
// }

// initStoryshots( {
// 	suite: 'Puppeteer storyshots',
// 	configPath: path.resolve( __dirname, '../storybook' ),
// 	test: puppeteerTest( {
// 		// eslint-disable-next-line sitekit/acronym-case
// 		storybookUrl: `file://${ path.resolve( __dirname, '../dist' ) }`,
// 		setupTimeout: 5000,
// 		testTimeout: 5000,
// 		customizePage,
// 	} ),
// } );
