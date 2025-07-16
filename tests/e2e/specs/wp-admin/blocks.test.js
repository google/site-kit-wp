/**
 * Blocks test.
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

/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { setupSiteKit } from '../../utils';
import { setupReaderRevenueManager } from '../../utils/setup-reader-revenue-manager';
import { setupSignInWithGoogle } from '../../utils/setup-sign-in-with-google';

describe( 'blocks', () => {
	beforeEach( async () => {
		await setupSiteKit();
	} );

	/**
	 * Closes the Gutenberg welcome modal if present.
	 */
	const closeWelcomeModalIfPresent = async () => {
		const closeModalSelector =
			'.components-modal__header button[aria-label="Close"]';
		try {
			await page.waitForSelector( closeModalSelector, {
				timeout: 2000,
			} );
			await page.click( closeModalSelector );
		} catch ( error ) {
			// Modal not present, continue with test.
		}
	};

	describe( 'google-site-kit/rrm-contribute-with-google block', () => {
		it( 'can be inserted without console errors', async () => {
			await setupReaderRevenueManager( {
				publicationID: `test-publication-${ Math.random()
					.toString( 36 )
					.substring( 7 ) }`,
			} );

			await visitAdminPage( 'post-new.php' );
			await closeWelcomeModalIfPresent();

			// Click on the blocks inserter.
			await page.waitForSelector(
				'.editor-document-tools__inserter-toggle'
			);
			await page.click( '.editor-document-tools__inserter-toggle' );

			// Wait for the block inserter to open and the RRM block to be available.
			await page.waitForSelector(
				'button.editor-block-list-item-google-site-kit-rrm-contribute-with-google',
				{ visible: true }
			);

			// Click on the RRM Contribute with Google block.
			await page.click(
				'button.editor-block-list-item-google-site-kit-rrm-contribute-with-google'
			);

			// Expect the block to be present in the block editor.
			await page.waitForSelector(
				'.googlesitekit-blocks-reader-revenue-manager'
			);

			// Verify there are no console errors.
			const consoleErrors = await page.evaluate( () => {
				return window.console.errors || [];
			} );

			expect( consoleErrors ).toHaveLength( 0 );
		} );
	} );

	describe( 'google-site-kit/rrm-subscribe-with-google block', () => {
		it( 'can be inserted without console errors', async () => {
			await setupReaderRevenueManager( {
				publicationID: `test-publication-${ Math.random()
					.toString( 36 )
					.substring( 7 ) }`,
			} );

			await visitAdminPage( 'post-new.php' );
			await closeWelcomeModalIfPresent();

			// Click on the blocks inserter.
			await page.waitForSelector(
				'.editor-document-tools__inserter-toggle'
			);
			await page.click( '.editor-document-tools__inserter-toggle' );

			// Wait for the block inserter to open and the RRM subscribe block to be available.
			await page.waitForSelector(
				'button.editor-block-list-item-google-site-kit-rrm-subscribe-with-google',
				{ visible: true }
			);

			// Click on the RRM Subscribe with Google block.
			await page.click(
				'button.editor-block-list-item-google-site-kit-rrm-subscribe-with-google'
			);

			// Expect the block to be present in the block editor.
			await page.waitForSelector(
				'.googlesitekit-blocks-reader-revenue-manager'
			);

			// Verify there are no console errors.
			const consoleErrors = await page.evaluate( () => {
				return window.console.errors || [];
			} );

			expect( consoleErrors ).toHaveLength( 0 );
		} );
	} );

	describe( 'google-site-kit/sign-in-with-google block', () => {
		it( 'can be inserted without console errors', async () => {
			await setupSignInWithGoogle( {
				clientID: '1234',
			} );

			await visitAdminPage( 'post-new.php' );
			await closeWelcomeModalIfPresent();

			// Click on the blocks inserter.
			await page.waitForSelector(
				'.editor-document-tools__inserter-toggle'
			);
			await page.click( '.editor-document-tools__inserter-toggle' );

			// Wait for the block inserter to open and the Sign in with Google block to be available.
			await page.waitForSelector(
				'button.editor-block-list-item-google-site-kit-sign-in-with-google',
				{ visible: true }
			);

			// Click on the Sign in with Google block.
			await page.click(
				'button.editor-block-list-item-google-site-kit-sign-in-with-google'
			);

			// Expect the block to be present in the block editor.
			await page.waitForSelector(
				'.googlesitekit-blocks-sign-in-with-google'
			);

			// Verify there are no console errors.
			const consoleErrors = await page.evaluate( () => {
				return window.console.errors || [];
			} );

			expect( consoleErrors ).toHaveLength( 0 );
		} );
	} );
} );
