/**
 * WordPress dependencies
 */
import { activatePlugin, createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	setSiteVerification,
	setSearchConsoleProperty,
	useRequestInterception,
	setupAnalytics4,
} from '../../../utils';
import * as adminBarMockResponses from './fixtures/admin-bar';
import { getAnalytics4MockResponse } from '../../../../../assets/js/modules/analytics-4/utils/data-mock';
import getMultiDimensionalObjectFromParams from '../../../utils/get-multi-dimensional-object-from-params';

let mockBatchResponse;

describe( 'Site Kit admin bar component display', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();

		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();

			const paramsObject = Object.fromEntries(
				new URL( url ).searchParams.entries()
			);

			if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics?'
					)
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify(
						mockBatchResponse[
							'modules::search-console::searchanalytics::e74216dd17533dcb67fa2d433c23467c'
						]
					),
				} );
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/analytics-4/data/report?'
					)
			) {
				const multiDimensionalObjectParams =
					getMultiDimensionalObjectFromParams( paramsObject );

				request.respond( {
					status: 200,
					body: JSON.stringify(
						getAnalytics4MockResponse(
							multiDimensionalObjectParams
						)
					),
				} );
			} else {
				request.continue();
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

		await setupAnalytics4();

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
						'google-site-kit/v1/modules/analytics-4/data/report?'
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
