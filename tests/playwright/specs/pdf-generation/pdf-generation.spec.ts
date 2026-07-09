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
 * Internal dependencies
 */
import { expect, test } from '../../playwright';
import {
	asUser,
	withFeatureFlags,
	withFixtures,
	withPlugins,
} from '../../wordpress';
import { PDFGenerationPage } from './pdf-generation-page';

const user = asUser( 'admin' );
const featureFlags = withFeatureFlags( 'pdfGeneration' );
const plugins = withPlugins( 'proxy-auth.php', 'pdf-generation-adsense.php' );

test.describe(
	'PDF Generation',
	{ annotation: [ user, featureFlags, plugins ] },
	() => {
		// The cases share one WordPress instance and drive the same in-app export, so
		// run them one at a time to avoid cross-test interference on the report and
		// download state. Generating the PDF (rendering charts to images, then
		// assembling the document) is heavy, and on slower CI runners it pushes past
		// the default 30s test timeout — especially on the mobile project — so the
		// timeout is raised to keep the download-driven cases from flaking.
		test.describe.configure( { mode: 'serial', timeout: 90_000 } );

		test(
			'generates a report and downloads a PDF (golden path)',
			{ annotation: [ withFixtures( 'pdf-generation/full' ) ] },
			async ( { wp } ) => {
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

				await wp.step( 'Download the report', async () => {
					await pageObject.download();
				} );

				await wp.step( 'Verify progress and success', async () => {
					// The progress snackbar appears during generation and the success
					// snackbar appears on completion.
					await expect( pageObject.successSnackbar ).toBeVisible( {
						timeout: 30_000,
					} );
					await expect( pageObject.errorSnackbar ).toBeHidden();
				} );
			}
		);

		test(
			'downloads the AdSense monetization section on its own',
			{ annotation: [ withFixtures( 'pdf-generation/full' ) ] },
			async ( { wp } ) => {
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
				await pageObject.download();
				await expect( pageObject.successSnackbar ).toBeVisible( {
					timeout: 30_000,
				} );
				await expect( pageObject.errorSnackbar ).toBeHidden();
			}
		);

		test(
			'still completes and downloads when one section fails',
			{
				annotation: [
					withFixtures( 'pdf-generation/single-section-failure' ),
				],
			},
			async ( { wp } ) => {
				await wp.visitDashboard();

				const pageObject = new PDFGenerationPage( wp.page );

				await pageObject.openPanel();

				// One section's report fails, but the export still completes and a file
				// still downloads.
				await pageObject.download();
				await expect( pageObject.successSnackbar ).toBeVisible( {
					timeout: 30_000,
				} );
			}
		);

		test(
			'shows the error snackbar and downloads nothing when every section fails',
			{ annotation: [ withFixtures( 'pdf-generation/all-failure' ) ] },
			async ( { wp } ) => {
				await wp.visitDashboard();

				const pageObject = new PDFGenerationPage( wp.page );

				// Guard: no browser download should fire in the all-fail case.
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

// A separate block runs as a non-authenticated editor with its own setup plugin
// (no `proxy-auth.php`), so the dashboard is view-only. The setup plugin has the
// admin own a connected Search Console shared with the editor role, while
// PageSpeed stays unshared.
test.describe(
	'PDF Generation (view-only)',
	{
		annotation: [
			asUser( 'editor' ),
			featureFlags,
			withPlugins( 'pdf-generation-view-only.php' ),
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
