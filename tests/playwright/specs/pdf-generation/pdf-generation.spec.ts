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
import type { Download } from '@playwright/test';

/**
 * Internal dependencies
 */
import { expect, test } from '../../playwright';
import {
	asUser,
	withConnectedModules,
	withFeatureFlags,
	withFixtures,
	withPlugins,
	withSharedModules,
} from '../../wordpress';
import { PDFGenerationPage } from './pdf-generation-page';

const user = asUser( 'admin' );
const featureFlags = withFeatureFlags( 'pdfGeneration' );
const plugins = withPlugins( 'proxy-auth.php' );

// Connect AdSense so the export includes the Monetization section. The admin's
// OAuth token comes from proxy-auth.php, so the AdSense reports resolve against
// the fixtures container.
const adsenseConnected = withConnectedModules( {
	slug: 'adsense',
	settings: {
		ownerID: 1,
		accountID: 'pub-123456789',
		clientID: 'ca-pub-123456789',
		accountStatus: 'approved',
		siteStatus: 'added',
		accountSetupComplete: true,
		siteSetupComplete: true,
		useSnippet: true,
	},
} );

test.describe(
	'PDF Generation',
	{ annotation: [ user, featureFlags, plugins, adsenseConnected ] },
	() => {
		// Generating the PDF (rendering charts to images, then assembling the
		// document) is heavy, and on slower CI runners it pushes past the default
		// 30s test timeout — especially on the mobile project — so the download
		// event never arrives in time. Raise the timeout to keep the
		// download-driven cases from flaking.
		test.describe.configure( { timeout: 90_000 } );

		test(
			'generates a report and downloads a PDF (golden path)',
			{ annotation: [ withFixtures( 'pdf-generation/full' ) ] },
			async ( { wp }, testInfo ) => {
				await wp.visitDashboard();

				const pageObject = new PDFGenerationPage( wp.page );

				await wp.step( 'Open the export panel', async () => {
					await pageObject.openPanel();
					// Every connected module's section is listed, including the
					// AdSense Monetization section.
					await expect(
						pageObject.sectionCheckbox(
							'mainDashboardMonetizationPrimary'
						)
					).toBeVisible();
				} );

				let download!: Download;
				await wp.step( 'Download the report', async () => {
					download = await pageObject.download();
				} );

				await wp.step( 'Verify progress and success', async () => {
					// The progress snackbar appears during generation and the success
					// snackbar appears on completion.
					await expect( pageObject.successSnackbar ).toBeVisible( {
						timeout: 30_000,
					} );
					await expect( pageObject.errorSnackbar ).toBeHidden();
				} );

				await wp.step( 'Verify the downloaded PDF', async () => {
					await pageObject.verifyPDF( download, testInfo );
				} );
			}
		);

		test(
			'downloads the AdSense monetization section on its own',
			{ annotation: [ withFixtures( 'pdf-generation/full' ) ] },
			async ( { wp }, testInfo ) => {
				await wp.visitDashboard();

				const pageObject = new PDFGenerationPage( wp.page );

				await pageObject.openPanel();

				// Export only the AdSense Monetization section. Its overview widget
				// throws if any of its four reports fail to resolve, so a successful
				// download proves the AdSense PDF widget rendered from real report
				// data.
				await pageObject.deselectAllExcept( [
					'mainDashboardMonetizationPrimary',
				] );
				const download = await pageObject.download();
				await expect( pageObject.successSnackbar ).toBeVisible( {
					timeout: 30_000,
				} );
				await expect( pageObject.errorSnackbar ).toBeHidden();

				await pageObject.verifyPDF( download, testInfo );
			}
		);

		test(
			'still completes and downloads when one section fails',
			{
				annotation: [
					withFixtures( 'pdf-generation/single-section-failure' ),
				],
			},
			async ( { wp }, testInfo ) => {
				await wp.visitDashboard();

				const pageObject = new PDFGenerationPage( wp.page );

				await pageObject.openPanel();

				// One section's report fails, but the export still completes and a file
				// still downloads.
				const download = await pageObject.download();
				await expect( pageObject.successSnackbar ).toBeVisible( {
					timeout: 30_000,
				} );

				await pageObject.verifyPDF( download, testInfo );
			}
		);

		test(
			'shows the error snackbar and downloads nothing when every section fails',
			{ annotation: [ withFixtures( 'pdf-generation/all-failure' ) ] },
			async ( { wp } ) => {
				await wp.visitDashboard();

				const pageObject = new PDFGenerationPage( wp.page );

				// Track browser downloads to assert none fire in the all-fail case.
				let downloadFired = false;
				wp.page.on( 'download', () => {
					downloadFired = true;
				} );

				await pageObject.openPanel();

				// Keep only the Speed section: its widget fails when its PageSpeed
				// report errors (the Search Console traffic/content widgets tolerate a
				// failed report and render an empty state), so every selected section
				// fails and the export reaches its ERROR state.
				await pageObject.deselectAllExcept( [
					'mainDashboardSpeedPrimary',
				] );
				await pageObject.downloadReportButton.click();

				await expect( pageObject.errorSnackbar ).toBeVisible( {
					timeout: 30_000,
				} );
				await expect( pageObject.successSnackbar ).toBeHidden();
				expect( downloadFired ).toBe( false );
			}
		);

		test(
			'cancels mid-export and returns to idle without downloading',
			{ annotation: [ withFixtures( 'pdf-generation/full' ) ] },
			async ( { wp } ) => {
				await wp.visitDashboard();

				const pageObject = new PDFGenerationPage( wp.page );

				let downloadFired = false;
				wp.page.on( 'download', () => {
					downloadFired = true;
				} );

				await pageObject.openPanel();
				await pageObject.downloadReportButton.click();

				// Cancel while the progress snackbar is showing.
				await expect( pageObject.progressSnackbar ).toBeVisible();
				await pageObject.cancel();

				// The dashboard returns to idle: the progress snackbar clears, no
				// success snackbar appears, and no file downloads.
				await expect( pageObject.progressSnackbar ).toBeHidden();
				await expect( pageObject.successSnackbar ).toBeHidden();
				expect( downloadFired ).toBe( false );
			}
		);
	}
);

// A separate block runs as a non-authenticated editor with only site-level proxy
// credentials (no `proxy-auth.php`), so the dashboard is view-only. Search
// Console is connected (owned by the admin, ID 1) and shared with the editor
// role, while PageSpeed stays unshared. The editor has the shared-dashboard
// splash pre-dismissed so it lands on the view-only dashboard directly.
test.describe(
	'PDF Generation (view-only)',
	{
		annotation: [
			asUser( 'editor', {
				dismissedItems: [ 'shared_dashboard_splash' ],
			} ),
			featureFlags,
			withPlugins( 'proxy-credentials.php' ),
			withConnectedModules( {
				slug: 'search-console',
				settings: {
					propertyID: 'http://localhost:9002',
					ownerID: 1,
				},
			} ),
			withSharedModules( {
				'search-console': {
					sharedRoles: [ 'editor' ],
					management: 'owner',
				},
			} ),
		],
	},
	() => {
		test(
			'lists only shared-module sections on a view-only dashboard',
			{ annotation: [ withFixtures( 'pdf-generation/view-only' ) ] },
			async ( { wp } ) => {
				await wp.visitDashboard();

				const pageObject = new PDFGenerationPage( wp.page );

				await pageObject.openPanel();

				// Search Console is shared with the editor role, so its Traffic
				// section is listed; PageSpeed is not shared, so the Speed section
				// is absent.
				await expect(
					pageObject.sectionCheckbox( 'mainDashboardTrafficPrimary' )
				).toBeVisible();
				await expect(
					pageObject.sectionCheckbox( 'mainDashboardSpeedPrimary' )
				).toBeHidden();
			}
		);
	}
);
