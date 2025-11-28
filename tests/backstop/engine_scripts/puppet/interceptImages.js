/**
 * Stub images for BackstopJS.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

const fs = require( 'fs' );
const path = require( 'path' );

const IMAGE_URL_RE = /\.gif|\.jpg|\.png/i;
const IMAGE_STUB_URL = path.resolve( __dirname, '../../imageStub.jpg' );
const IMAGE_DATA_BUFFER = fs.readFileSync( IMAGE_STUB_URL );
const HEADERS_STUB = {};

/**
 * Listen to all requests. If a request matches IMAGE_URL_RE
 * then stub the image with data from IMAGE_STUB_URL
 *
 * Use this in an onBefore script E.G.
 * ```
 * module.exports = async function(page, scenario) {
 *   require('./interceptImages')(page, scenario);
 * }
 * ```
 */

module.exports = async function ( page ) {
	async function intercept( request ) {
		if ( IMAGE_URL_RE.test( request.url() ) ) {
			await request.respond( {
				body: IMAGE_DATA_BUFFER,
				headers: HEADERS_STUB,
				status: 200,
			} );
		} else {
			request.continue();
		}
	}
	await page.setRequestInterception( true );
	page.on( 'request', intercept );
};
