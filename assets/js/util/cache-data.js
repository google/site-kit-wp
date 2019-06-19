/**
 * Cache data.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
/* global require, process */

const puppeteer = require( 'puppeteer' );
const fs = require( 'fs' );
const readline = require( 'readline' );

const dataCacheBase = 'https://googlekit.10uplabs.com/';
const adminPath     = 'wp-admin/';

const rl = readline.createInterface( {
	input: process.stdin,
	output: process.stdout
} );

rl.question( 'Username: ', ( username ) => {
	rl.question( 'Password: ', ( password ) => {

		console.log( 'Starting data caching process...' ); // eslint-disable-line no-console

		const endpoints = [
			dataCacheBase + adminPath + 'admin.php?page=googlesitekit-dashboard',
			dataCacheBase + adminPath + 'admin.php?page=googlesitekit-module-search-console',
			dataCacheBase + adminPath + 'admin.php?page=googlesitekit-module-analytics',
			dataCacheBase + adminPath + 'admin.php?page=googlesitekit-module-adsense',
			dataCacheBase + adminPath + 'admin.php?page=googlesitekit-settings',
			dataCacheBase + adminPath + 'index.php?',
			dataCacheBase + adminPath + 'post.php?post=57&action=edit',
			dataCacheBase + adminPath + 'edit.php?',
			dataCacheBase + 'blog/?',
		];

		// Grab the data...
		( async() => {
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto( dataCacheBase + adminPath, { waitUntil: 'networkidle0' } );

			// Log in!
			await page.tap( '#user_login' );
			await page.type( '#user_login', username, { delay: 10 } );
			await page.type( '#user_pass', password, { delay: 10 } );
			await ( page.tap( '#wp-submit' ) );

			// Go thru each endpoint from the predefined list.
			for ( let endpoint of endpoints ) {
				console.log( 'Caching %s', endpoint ); // eslint-disable-line no-console

				// Once to cache.
				await page.goto( `${ endpoint }&datacache`, { waitUntil: 'networkidle0' } );

				console.log( 'Loading %s', endpoint ); // eslint-disable-line no-console

				// Once to load data.
				await page.goto( `${ endpoint }&datacache`, { waitUntil: 'networkidle0' } );

				let html = await page.content();

				// Remove identifying info from the scraped data.
				html = html.replace( /googlekit\.10uplabs/gi, 'sitekitbygoogle' );
				html = html.replace( /elasticpress\.io/gi, 'sitekitbygoogle.com' );
				html = html.replace( /Elasticpress/gi, 'Site Kit' );

				// Account Ids
				html = html.replace( /"accountId":"[\d]+"/gi, '"accountId":"XXXXXXXX"' );
				html = html.replace( /"profileId":"[\d]+"/gi, '"profileId":"XXXXXXXX"' );
				html = html.replace( /"internalWebPropertyId":"[\d]+"/gi, '"internalWebPropertyId":"XXXXXXXX"' );
				html = html.replace( /"propertyId":"UA-[\d]+-[\d]+"/gi, '"propertyId":"UA-XXXXXXXX-X"' );
				html = html.replace( /"trackingID":"UA-[\d]+-[\d]+"/gi, '"trackingID":"UA-XXXXXXXX-X"' );
				html = html.replace( /pub-[\d]+/gi, 'pub-XXXXXXXXXX' );

				html = html.replace( /"email":"(.*?)","name":"(.*?)"/gi, '"email":"sundar.pichai@google.com","name":"Sundar Pichai"' );
				html = html.replace( /"picture":"(.*?)"/gi, '"picture":""' );

				// Misc remaining strings.
				html = html.replace( /10up/gi, 'google' );
				html = html.replace( /elastic ?press/gi, 'site kit' );
				html = html.replace( /elastic ?search/gi, 'site kit' );

				// Asset root.
				html = html.replace( /"assetsRoot":"(.*?)"/gi, '"assetsRoot":"/assets/"' );


				// Store one file for each localized variable used by the plugin.
				const scriptsToMatch = [
					'googlesitekit',
					'googlesitekitCurrentModule',
					'googlesitekitAdminbar',
				];
				for ( let scriptName of scriptsToMatch ) {

					// A regex that looks for the localized variable.
					const matchStringRegex = '[window.|var ]' + scriptName + ' = (.*)';
					const matches = html.match( matchStringRegex );
					if ( matches ) {

						// Clean up the file name to make it a loadable file.
						let shortname = endpoint
							.replace( dataCacheBase, '' )
							.replace( '/', '-' )
							.replace( '?', '-' );
						const filename = '.storybook/data/' + shortname + '-' + scriptName + '.js';

						// The file contains a single line defining the localized variable.
						const toWrite = 'export const ' + scriptName + ' = ' + matches[1];
						fs.writeFile(
							filename,
							toWrite,
							function( err ) {
								if ( err ) {
									console.error( err ); // eslint-disable-line no-console
								}
							}
						);
						console.log( '%s data saved for %s', scriptName, endpoint ); // eslint-disable-line no-console
					}
				}
			}
			await browser.close();
			console.log( 'Data capture complete!' ); // eslint-disable-line no-console

		} )();
		rl.close();

	} );
} );

