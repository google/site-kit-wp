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
	withAudiences,
	withConnectedModules,
	withFeatureFlags,
	withFixtures,
	withKeyMetrics,
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
const adsenseModule = {
	slug: 'adsense',
	// Served via `pre_option`, which bypasses the module's default merge, so this
	// mirrors the module's `get_default()` with the connected identifiers filled
	// in — every setting the module reads must be present or it emits a notice.
	settings: {
		ownerID: 1,
		accountID: 'pub-123456789',
		autoAdsDisabled: [],
		clientID: 'ca-pub-123456789',
		accountStatus: 'approved',
		siteStatus: 'added',
		accountSetupComplete: true,
		siteSetupComplete: true,
		useSnippet: true,
		webStoriesAdUnit: '',
		setupCompletedTimestamp: null,
		useAdBlockingRecoverySnippet: false,
		useAdBlockingRecoveryErrorSnippet: false,
		adBlockingRecoverySetupStatus: '',
	},
};
const adsenseConnected = withConnectedModules( adsenseModule );

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

		test.beforeEach( async ( { wp } ) => {
			await wp.visitDashboard();
		} );

		test(
			'generates a report and downloads a PDF (golden path)',
			{ annotation: [ withFixtures( 'pdf-generation/full' ) ] },
			async ( { wp }, testInfo ) => {
				const pageObject = new PDFGenerationPage( wp.page );

				await wp.step( 'Open the export panel', async () => {
					await pageObject.openPanel();
					// Every connected module's section is listed, including the
					// AdSense Monetization section.
					await expect(
						pageObject.sectionCheckbox(
							'mainDashboardMonetization'
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

				await wp.step(
					'Check the header chips can scroll to their sections in the Apple Preview app',
					async () => {
						const pdfReport = await pageObject.readPDFReport(
							download
						);

						// Clicking a chip in the Apple Preview app scrolls to
						// that section, and the scroll happens only when the
						// section's anchor has a left coordinate. In the PDF
						// report the anchor reads `(section-<slug>)`, and a
						// missing coordinate shows up as `/XYZ null`.
						// `patches/@react-pdf+render+4.5.1.patch` writes the
						// coordinate.
						expect( pdfReport ).toContain(
							'(section-mainDashboardTraffic)'
						);
						expect( pdfReport ).not.toContain( '/XYZ null' );
					}
				);

				await wp.step( 'Verify the downloaded PDF', async () => {
					await pageObject.verifyPDF( download, testInfo );
				} );
			}
		);

		test(
			'downloads the AdSense monetization section on its own',
			{ annotation: [ withFixtures( 'pdf-generation/full' ) ] },
			async ( { wp }, testInfo ) => {
				const pageObject = new PDFGenerationPage( wp.page );

				await pageObject.openPanel();

				// Export only the AdSense Monetization section. Its overview widget
				// throws if any of its four reports fail to resolve, so a successful
				// download proves the AdSense PDF widget rendered from real report
				// data.
				await pageObject.deselectAllExcept( [
					'mainDashboardMonetization',
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
				await pageObject.deselectAllExcept( [ 'mainDashboardSpeed' ] );
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

// Connect Analytics 4 so the Analytics-backed sections (Key Metrics, the audience
// tiles, and the GA4 top earning pages) are available to export. The property ID
// keys the GA4 report fixtures the tests resolve against. AdSense and Analytics 4
// are declared in one annotation because only the first `connected-modules`
// annotation is applied.
const analytics4Module = {
	slug: 'analytics-4',
	// The e2e module-activation plugin serves these settings via `pre_option`,
	// which bypasses the module's default merge, so every setting the module reads
	// must be present or it emits an undefined-index notice. This mirrors the
	// module's `get_default()` with connected identifiers filled in.
	settings: {
		ownerID: 1,
		accountID: '12345678',
		adsConversionID: '',
		propertyID: '123456789',
		webDataStreamID: '1234567890',
		measurementID: 'G-A1B2C3D4E5',
		trackingDisabled: [ 'loggedinUsers' ],
		useSnippet: true,
		googleTagID: '',
		googleTagAccountID: '',
		googleTagContainerID: '',
		googleTagContainerDestinationIDs: null,
		googleTagLastSyncedAtMs: 0,
		// Pre-populated so `getAvailableCustomDimensions()` short-circuits instead
		// of calling the (unmocked) Analytics Admin sync, and the audience tile
		// reads `googlesitekit_post_type` as present. A `null` here would make an
		// authenticated admin sync custom dimensions on dashboard load.
		availableCustomDimensions: [ 'googlesitekit_post_type' ],
		propertyCreateTime: 0,
		// Linked so the GA4 top earning pages widget is exportable.
		adSenseLinked: true,
		adSenseLinkedLastSyncedAt: 0,
		adsLinked: false,
		adsLinkedLastSyncedAt: 0,
		detectedEvents: [],
		newConversionEventsLastUpdateAt: 0,
		lostConversionEventsLastUpdateAt: 0,
	},
};

test.describe(
	'PDF Generation (Analytics sections)',
	{
		annotation: [
			user,
			featureFlags,
			plugins,
			withConnectedModules( adsenseModule, analytics4Module ),
		],
	},
	() => {
		test.describe.configure( { timeout: 90_000 } );

		test.beforeEach( async ( { wp } ) => {
			await wp.visitDashboard();
		} );

		test(
			'downloads the Key Metrics section on its own',
			{
				annotation: [
					withFixtures( 'pdf-generation/key-metrics' ),
					// Four Analytics 4 metrics with no custom-dimension or
					// detected-event requirement, so all four stay active and the
					// section renders four tiles.
					withKeyMetrics( [
						'kmAnalyticsNewVisitors',
						'kmAnalyticsReturningVisitors',
						'kmAnalyticsVisitsPerVisitor',
						'kmAnalyticsVisitLength',
					] ),
				],
			},
			async ( { wp }, testInfo ) => {
				const pageObject = new PDFGenerationPage( wp.page );

				await pageObject.openPanel();

				// The Key Metrics section is its own dashboard context, so a
				// section-level deselect isolates it, and the selected metrics
				// render four tiles from real report data.
				await pageObject.deselectAllExcept( [
					'mainDashboardKeyMetrics',
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
			'downloads the audience "Your visitor groups" widget on its own',
			{
				annotation: [
					withFixtures( 'pdf-generation/audience-segmentation' ),
					// Two audiences make the "Your visitor groups" PDF widget
					// active (it renders two or more cards). Their resource names
					// use the same property the GA4 fixtures are keyed by.
					withAudiences( [
						{
							name: 'properties/123456789/audiences/1',
							displayName: 'All visitors',
							description: 'All users',
							audienceType: 'DEFAULT_AUDIENCE',
							audienceSlug: 'all-users',
						},
						{
							name: 'properties/123456789/audiences/2',
							displayName: 'Returning visitors',
							description: 'Users who returned to the site',
							audienceType: 'SITE_KIT_AUDIENCE',
							audienceSlug: 'returning-visitors',
						},
					] ),
				],
			},
			async ( { wp }, testInfo ) => {
				const pageObject = new PDFGenerationPage( wp.page );

				await pageObject.openPanel();

				// The audience tiles are one widget inside the Traffic section, so
				// isolate that widget. The two configured audiences are the minimum
				// the PDF widget renders.
				await pageObject.selectOnlyWidget(
					'mainDashboardTraffic',
					'analyticsAudienceTiles'
				);
				const download = await pageObject.download();
				await expect( pageObject.successSnackbar ).toBeVisible( {
					timeout: 30_000,
				} );
				await expect( pageObject.errorSnackbar ).toBeHidden();

				await pageObject.verifyPDF( download, testInfo );
			}
		);

		test(
			'downloads the top earning pages widget on its own',
			{
				annotation: [
					withFixtures( 'pdf-generation/top-earning-pages' ),
				],
			},
			async ( { wp }, testInfo ) => {
				const pageObject = new PDFGenerationPage( wp.page );

				await pageObject.openPanel();

				// The GA4 top earning pages tile is one widget inside the
				// Monetization section, so isolate that widget. It needs AdSense
				// and Analytics 4 connected with the AdSense–Analytics link, which
				// the block-level settings provide.
				await pageObject.selectOnlyWidget(
					'mainDashboardMonetization',
					'adsenseTopEarningPagesGA4'
				);
				const download = await pageObject.download();
				await expect( pageObject.successSnackbar ).toBeVisible( {
					timeout: 30_000,
				} );
				await expect( pageObject.errorSnackbar ).toBeHidden();

				await pageObject.verifyPDF( download, testInfo );
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
		test.beforeEach( async ( { wp } ) => {
			await wp.visitDashboard();
		} );

		test(
			'lists only shared-module sections on a view-only dashboard',
			{ annotation: [ withFixtures( 'pdf-generation/view-only' ) ] },
			async ( { wp } ) => {
				const pageObject = new PDFGenerationPage( wp.page );

				await pageObject.openPanel();

				// Search Console is shared with the editor role, so its Traffic
				// section is listed; PageSpeed is not shared, so the Speed section
				// is absent.
				await expect(
					pageObject.sectionCheckbox( 'mainDashboardTraffic' )
				).toBeVisible();
				await expect(
					pageObject.sectionCheckbox( 'mainDashboardSpeed' )
				).toBeHidden();
			}
		);
	}
);
