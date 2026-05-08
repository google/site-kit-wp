/**
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
 * External dependencies
 */
import * as path from 'path';
import { test as base } from '@playwright/test';
import { createConnection } from 'mysql2/promise';

/**
 * Internal dependencies
 */
import { WordPress, type WordPressArgs } from './wordpress';
import { getSplashHTML } from './wordpress/splash';

/**
 * Re-export parts of @playwright/test.
 */
export { expect, TestDetails } from '@playwright/test';

// Pick up environment variables or use defaults.
const WP_BASE_URL = process.env.PLAYWRIGHT_WP_URL ?? 'http://localhost:9002';
const DB_HOST = process.env.PLAYWRIGHT_DB_HOST ?? 'localhost';
const DB_PORT = Number( process.env.PLAYWRIGHT_DB_PORT ?? '9306' );
const DB_USER = process.env.PLAYWRIGHT_DB_USER ?? 'root';
const DB_PASSWORD = process.env.PLAYWRIGHT_DB_PASSWORD ?? 'example';
const MAILPIT_URL =
	process.env.PLAYWRIGHT_MAILPIT_URL ?? 'http://localhost:8025';

/**
 * Type definition for the WordPress fixture.
 *
 * @since 1.175.0
 */
export type WordPressFixture = {
	wp: WordPress;
};

/**
 * Test class with WordPress fixture.
 *
 * @since 1.175.0
 */
export const test = base.extend< WordPressFixture >( {
	wp: async ( { page, context }, use, testInfo ) => {
		// Create a connection to the database.
		const connection = await createConnection( {
			host: DB_HOST,
			port: DB_PORT,
			user: DB_USER,
			password: DB_PASSWORD,
			multipleStatements: true,
		} );

		const wpArgs: WordPressArgs = {
			db: connection,
			page,
			context,
			testInfo,
			baseURL: WP_BASE_URL,
			mailpitURL: MAILPIT_URL,
		};

		const wp = new WordPress( wpArgs );

		try {
			// Prepare the WordPress environment.
			await wp.setUp();

			// Show a branded splash screen as the first frame of the screencast.
			await page.setContent(
				getSplashHTML( testInfo.titlePath.slice( 1 ).join( ' ' ) )
			);

			// Start screencast recording.
			const video = path.join( testInfo.outputDir, 'screencast.webm' );
			await page.screencast.start( { path: video, quality: 100 } );
			await page.screencast.showActions( { position: 'top-right' } );

			// Use the WordPress fixture.
			await use( wp );

			// Finish screencast recording and attach the video to the test.
			await page.screencast.stop();
			await testInfo.attach( 'screencast.webm', { path: video } );
		} finally {
			// Clean up the WordPress environment.
			await wp.tearDown();
		}
	},
} );
