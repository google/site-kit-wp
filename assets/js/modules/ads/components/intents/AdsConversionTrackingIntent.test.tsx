/**
 * AdsConversionTrackingIntent component tests.
 *
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { Intent } from '@/js/googlesitekit/datastore/intents/intents';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	ADS_CONVERSION_TRACKING_INTENT_SLUG,
	MODULE_SLUG_ADS,
} from '@/js/modules/ads/constants';
import { MODULES_ADS } from '@/js/modules/ads/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModules,
	provideSiteInfo,
	render,
	waitFor,
	within,
} from '@tests/js/test-utils';
import AdsConversionTrackingIntent from './AdsConversionTrackingIntent';

describe( 'AdsConversionTrackingIntent', () => {
	mockLocation();

	const adsSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/ads/data/settings'
	);
	const completeIntentEndpoint = new RegExp(
		'^/google-site-kit/v1/core/intents/data/complete-intent'
	);

	const intentCode = 'abc123';
	const returnURL =
		'https://ads.google.com/aw/conversions/sitekit?intent_code=abc123';

	const payload = {
		tag_id: 'AW-763597978',
		customer_name: 'Paws & Puppies Co.',
		consent_date: '2026-07-28',
	};

	const adsSettings = {
		conversionID: '',
		ownerID: 0,
		paxConversionID: '',
		customerID: '',
		extCustomerID: '',
		formattedExtCustomerID: '',
		userID: '',
		accountOverviewURL: '',
	};

	const error = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};
	const errorMessage = 'Error: Internal server error (Please try again.)';

	let registry: WPDataRegistry;

	function renderIntent( intentPayload: Intent[ 'payload' ] = payload ) {
		return render(
			<AdsConversionTrackingIntent
				slug={ ADS_CONVERSION_TRACKING_INTENT_SLUG }
				intentCode={ intentCode }
				payload={ intentPayload }
			/>,
			{ registry }
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		// The Ads module is active, so placing the tag skips the activation.
		// The `modules/ads` data store tests cover the activation.
		provideModules( registry, [
			{ slug: MODULE_SLUG_ADS, active: true, connected: true },
		] );
		// Conversion tracking is on, so placing the tag doesn't save it. The
		// `modules/ads` data store tests cover enabling it.
		registry
			.dispatch( CORE_SITE )
			.receiveGetConversionTrackingSettings( { enabled: true } );

		registry.dispatch( MODULES_ADS ).receiveGetSettings( adsSettings );
	} );

	it( 'should show the suggested tag with the account name and the date access was given', () => {
		const { getByText } = renderIntent();

		expect(
			getByText( 'AW-763597978 • Paws & Puppies Co.' )
		).toBeInTheDocument();
		expect(
			getByText(
				'This account is shown because you gave Site Kit access to your Google Ads data on July 28, 2026.'
			)
		).toBeInTheDocument();
	} );

	it( 'should show only the tag ID when the payload has no account name', () => {
		const { getByText } = renderIntent( {
			...payload,
			customer_name: undefined,
		} );

		expect( getByText( 'AW-763597978' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'missing', undefined ],
		[ 'not in the `YYYY-MM-DD` format', '07/28/2026' ],
	] )(
		'should leave out the sentence with the date when the consent date is %s',
		( _, consentDate ) => {
			const { getByText, queryByText } = renderIntent( {
				...payload,
				consent_date: consentDate,
			} );

			expect(
				getByText(
					'You can change this later in the Site Kit settings.'
				)
			).toBeInTheDocument();
			expect(
				queryByText( /This account is shown because/ )
			).not.toBeInTheDocument();
		}
	);

	it( 'should disable the "Place tag and return to Google Ads" button until the tag is confirmed', () => {
		const { getByRole } = renderIntent();

		expect(
			getByRole( 'button', {
				name: 'Place tag and return to Google Ads',
			} )
		).toBeDisabled();
	} );

	it( 'should replace the "Confirm tag" button with "Tag confirmed" and enable the second step without saving anything', () => {
		const { getByRole, queryByRole } = renderIntent();

		fireEvent.click( getByRole( 'button', { name: 'Confirm tag' } ) );

		expect(
			queryByRole( 'button', { name: 'Confirm tag' } )
		).not.toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Tag confirmed' } )
		).toBeDisabled();
		expect(
			getByRole( 'button', {
				name: 'Place tag and return to Google Ads',
			} )
		).toBeEnabled();
		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should return the user to Google Ads once the tag is placed', async () => {
		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			supportedConversionEvents: [ 'submit_lead_form', 'purchase' ],
		} );

		fetchMock.postOnce( adsSettingsEndpoint, {
			body: { ...adsSettings, conversionID: payload.tag_id },
		} );
		fetchMock.postOnce( completeIntentEndpoint, {
			body: { return_url: returnURL },
		} );

		const { getByRole } = renderIntent();

		fireEvent.click( getByRole( 'button', { name: 'Confirm tag' } ) );
		fireEvent.click(
			getByRole( 'button', {
				name: 'Place tag and return to Google Ads',
			} )
		);

		await waitFor( () => {
			expect( global.location.assign ).toHaveBeenCalledWith(
				`${ returnURL }&sitekit_status=success&tracked_conversion_ids=submit_lead_form%2Cpurchase`
			);
		} );
	} );

	it( 'should keep the "Place tag and return to Google Ads" button disabled while the tag is being placed', async () => {
		freezeFetch( adsSettingsEndpoint );

		const { getByRole } = renderIntent();

		fireEvent.click( getByRole( 'button', { name: 'Confirm tag' } ) );
		fireEvent.click(
			getByRole( 'button', {
				name: 'Place tag and return to Google Ads',
			} )
		);

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( adsSettingsEndpoint );
		} );

		expect(
			getByRole( 'button', {
				name: 'Place tag and return to Google Ads',
			} )
		).toBeDisabled();
	} );

	it( 'should show the error and let the user try again when placing the tag fails', async () => {
		fetchMock.postOnce( adsSettingsEndpoint, { body: error, status: 500 } );

		const { findByText, getByRole } = renderIntent();

		fireEvent.click( getByRole( 'button', { name: 'Confirm tag' } ) );
		fireEvent.click(
			getByRole( 'button', {
				name: 'Place tag and return to Google Ads',
			} )
		);

		expect( await findByText( errorMessage ) ).toBeInTheDocument();
		expect( console ).toHaveErrored();

		expect( global.location.assign ).not.toHaveBeenCalled();
		expect(
			getByRole( 'button', {
				name: 'Place tag and return to Google Ads',
			} )
		).toBeEnabled();
	} );

	it( 'should show the error and let the user try again when placing the tag throws', async () => {
		// The action throws for a tag ID that isn't a valid conversion ID.
		const { findByText, getByRole } = renderIntent( {
			...payload,
			tag_id: 'invalid-tag-id',
		} );

		fireEvent.click( getByRole( 'button', { name: 'Confirm tag' } ) );
		fireEvent.click(
			getByRole( 'button', {
				name: 'Place tag and return to Google Ads',
			} )
		);

		expect(
			await findByText(
				'Error: a valid tagID is required. (Please try again.)'
			)
		).toBeInTheDocument();

		expect( fetchMock ).not.toHaveFetched();
		expect( global.location.assign ).not.toHaveBeenCalled();
		expect(
			getByRole( 'button', {
				name: 'Place tag and return to Google Ads',
			} )
		).toBeEnabled();
	} );

	it.each( [
		[
			'`intent_not_found`',
			{
				code: 'intent_not_found',
				message:
					'This link can’t be used. Go back to where you started and try again.',
				data: { status: 404 },
			},
		],
		[
			'`intent_user_not_connected`',
			{
				code: 'intent_user_not_connected',
				message:
					'Your Google account isn’t connected to Site Kit. Connect Site Kit with your Google account, then try again.',
				data: { status: 403 },
			},
		],
		[ 'a server error', error ],
	] )(
		'should show the "We couldn’t load your request" error notice with a "Go to dashboard" button, and no steps, when loading the intent fails with %s',
		( _, intentError ) => {
			const { getByRole, queryByRole, queryByText } = render(
				<AdsConversionTrackingIntent
					slug={ ADS_CONVERSION_TRACKING_INTENT_SLUG }
					intentCode={ intentCode }
					error={ intentError }
				/>,
				{ registry }
			);

			const notice = getByRole( 'status' );

			expect( notice ).toHaveClass( 'googlesitekit-notice--error' );
			expect(
				within( notice ).getByText( 'We couldn’t load your request' )
			).toBeInTheDocument();
			expect(
				within( notice ).getByText(
					'The link may already have been used, or it may have expired. You can start again from the Google Ads console.'
				)
			).toBeInTheDocument();
			expect(
				within( notice ).getByRole( 'button', {
					name: 'Go to dashboard',
				} )
			).toHaveAttribute(
				'href',
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard'
			);
			expect( within( notice ).getAllByRole( 'button' ) ).toHaveLength(
				1
			);
			expect(
				queryByText( intentError.message )
			).not.toBeInTheDocument();
			expect(
				queryByRole( 'button', { name: 'Confirm tag' } )
			).not.toBeInTheDocument();
		}
	);
} );
