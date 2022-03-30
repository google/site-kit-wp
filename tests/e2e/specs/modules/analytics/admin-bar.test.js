/**
 * WordPress dependencies
 */
import { activatePlugin, createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	setupAnalytics,
	setSiteVerification,
	setSearchConsoleProperty,
	useRequestInterception,
} from '../../../utils';
import * as adminBarMockResponses from './fixtures/admin-bar';

let mockBatchResponse;

describe( 'Site Kit admin bar component display', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();

		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics?'
					)
			) {
				request.respond(
					{
						status: 200,
						body: JSON.stringify(
							mockBatchResponse[
								'modules::search-console::searchanalytics::e74216dd17533dcb67fa2d433c23467c'
							]
						),
					},
					10
				);
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/analytics/data/report?'
					)
			) {
				request.respond(
					{
						status: 200,
						body: JSON.stringify(
							mockBatchResponse[
								'modules::analytics::report::db20ba9afa3000cd79e2888048a1700c'
							]
						),
					},
					10
				);
			} else {
				request.continue( {}, 5 );
			}
		} );
	} );

	beforeEach( async () => {
		mockBatchResponse = [];

		await page.goto( createURL( '/hello-world' ), { waitUntil: 'load' } );
	} );

	it( 'loads Analytics data when the module is active', async () => {
		const { analytics, searchConsole } = adminBarMockResponses;
		// Data is requested when the Admin Bar app loads on first hover
		mockBatchResponse = Object.assign( {}, analytics, searchConsole );

		await setupAnalytics();
		await page.reload();

		await Promise.all( [
			page.hover( '#wp-admin-bar-google-site-kit' ),
			page.waitForResponse( ( res ) =>
				res
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics?'
					)
			),
			page.waitForResponse( ( res ) =>
				res
					.url()
					.match(
						'google-site-kit/v1/modules/analytics/data/report?'
					)
			),
		] );

		const adminBarApp = await page.$( '#js-googlesitekit-adminbar' );
		await expect( adminBarApp ).toMatchElement(
			'.googlesitekit-data-block__title',
			{
				text: /total clicks/i,
			}
		);
		await expect( adminBarApp ).toMatchElement(
			'.googlesitekit-data-block__title',
			{
				text: /total impressions/i,
			}
		);
		await expect( adminBarApp ).toMatchElement(
			'.googlesitekit-data-block__title',
			{
				text: /total users/i,
			}
		);
		await expect( adminBarApp ).toMatchElement(
			'.googlesitekit-data-block__title',
			{
				text: /total sessions/i,
			}
		);
		await adminBarApp.dispose();
	} );
} );
