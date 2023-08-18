/**
 * AdBlockingRecoveryWidget - SetupMain component test.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { mockLocation } from '../../../../../../../tests/js/mock-browser-utils';
import {
	act,
	fireEvent,
	render,
} from '../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	muteFetch,
	provideModules,
	provideSiteInfo,
	unsubscribeFromAll,
} from '../../../../../../../tests/js/utils';
import { VIEW_CONTEXT_AD_BLOCKING_RECOVERY } from '../../../../../googlesitekit/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import * as tracking from '../../../../../util/tracking';
import { MODULES_ADSENSE } from '../../../datastore/constants';
import SetupMain from './SetupMain';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AdBlockingRecoveryWidget - SetupMain', () => {
	mockLocation();

	let registry;
	let container;
	let getByRole;

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'adsense',
			},
		] );
		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			adBlockingRecoverySetupStatus: '',
		} );

		const renderResult = render( <SetupMain />, {
			registry,
			viewContext: VIEW_CONTEXT_AD_BLOCKING_RECOVERY,
		} );

		container = renderResult.container;
		getByRole = renderResult.getByRole;
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'Place Tag step', () => {
		it( 'Should fire the event tracking when rendered', () => {
			expect( container ).toHaveTextContent(
				'Identify site visitors that have an ad blocker browser extension installed'
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'setup_place_tag'
			);
		} );

		it( 'should toggle error protection code checkbox when `Enable error protection code` is clicked', async () => {
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'checkbox', {
						name: /enable error protection code/i,
					} )
				);
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'uncheck_box' // because it was checked by default
			);

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'checkbox', {
						name: /enable error protection code/i,
					} )
				);
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'check_box'
			);
		} );

		it( 'should render the `Create message` step when `Enable message` button is clicked', async () => {
			muteFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/adsense/data/sync-ad-blocking-recovery-tags'
				)
			);

			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/modules/adsense/data/settings'
				),
				{ body: { success: true }, status: 200 }
			);

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /enable message/i } )
				);
			} );

			expect( container ).toHaveTextContent(
				'Create and publish an ad blocking recovery message in AdSense'
			);

			// Save updated Ad Blocking Recovery Settings.
			expect( JSON.parse( fetchMock.lastOptions().body ) ).toStrictEqual(
				{
					data: {
						adBlockingRecoverySetupStatus: 'tag-placed',
						useAdBlockingRecoveryErrorSnippet: true,
						useAdBlockingRecoverySnippet: true,
					},
				}
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'setup_enable_tag'
			);
		} );

		it( 'should return to dashboard when `Cancel` button is clicked', async () => {
			const dashboardURL = registry
				.select( CORE_SITE )
				.getAdminURL( 'googlesitekit-dashboard' );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /cancel/i } ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'cancel_setup',
				'on_place_tag_step'
			);

			expect( global.location.assign ).toHaveBeenCalled();
			expect( global.location.assign ).toHaveBeenCalledWith(
				dashboardURL
			);
		} );

		it( 'should return to AdSense settings page when `Cancel` button is clicked', async () => {
			const originalReferrer = document.referrer;

			const settingsURL = registry
				.select( CORE_SITE )
				.getAdminURL( 'googlesitekit-settings' );

			// Mock the document.referrer to be the AdSense settings page.
			Object.defineProperty( document, 'referrer', {
				writable: true,
				value: settingsURL,
			} );

			const adSenseSettingsURL = `${ settingsURL }#/connected-services/adsense`;

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /cancel/i } ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'cancel_setup',
				'on_place_tag_step'
			);

			expect( global.location.assign ).toHaveBeenCalled();
			expect( global.location.assign ).toHaveBeenCalledWith(
				adSenseSettingsURL
			);

			// Reset the document.referrer back to its original value.
			Object.defineProperty( document, 'referrer', {
				writable: true,
				value: originalReferrer,
			} );
		} );
	} );

	describe( 'Create Message step', () => {
		beforeEach( async () => {
			muteFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/adsense/data/sync-ad-blocking-recovery-tags'
				)
			);

			muteFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/adsense/data/settings'
				)
			);

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /enable message/i } )
				);
			} );
		} );

		it( 'Should fire the event tracking when rendered', () => {
			expect( container ).toHaveTextContent(
				'Create and publish an ad blocking recovery message in AdSense'
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'setup_create_message'
			);
		} );

		it( 'should render the `Final (My message is ready)` step when `Create message` button is clicked', async () => {
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /create message/i } )
				);
			} );

			expect( container ).toHaveTextContent(
				'Ad blocking recovery only works if you’ve created and published your message in AdSense'
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'create_message',
				'primary_cta'
			);

			expect( container ).toHaveTextContent(
				'Ad blocking recovery only works if you’ve created and published your message in AdSense'
			);
		} );

		it( 'should return to dashboard when `Cancel` button is clicked', async () => {
			const dashboardURL = registry
				.select( CORE_SITE )
				.getAdminURL( 'googlesitekit-dashboard' );

			fetchMock.postOnce(
				/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/,
				{ body: { success: true }, status: 200 }
			);

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /cancel/i } ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'cancel_setup',
				'on_create_message_step'
			);

			// Rollback Ad Blocking Recovery Settings.
			expect( JSON.parse( fetchMock.lastOptions().body ) ).toStrictEqual(
				{
					data: {
						adBlockingRecoverySetupStatus: '',
						useAdBlockingRecoveryErrorSnippet: false,
						useAdBlockingRecoverySnippet: false,
					},
				}
			);

			expect( global.location.assign ).toHaveBeenCalled();
			expect( global.location.assign ).toHaveBeenCalledWith(
				dashboardURL
			);
		} );

		it( 'should return to AdSense settings page when `Cancel` button is clicked', async () => {
			const originalReferrer = document.referrer;

			fetchMock.postOnce(
				/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/,
				{ body: { success: true }, status: 200 }
			);

			const settingsURL = registry
				.select( CORE_SITE )
				.getAdminURL( 'googlesitekit-settings' );

			// Mock the document.referrer to be the AdSense settings page.
			Object.defineProperty( document, 'referrer', {
				writable: true,
				value: settingsURL,
			} );

			const adSenseSettingsURL = `${ settingsURL }#/connected-services/adsense`;

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /cancel/i } ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'cancel_setup',
				'on_create_message_step'
			);

			// Rollback Ad Blocking Recovery Settings.
			expect( JSON.parse( fetchMock.lastOptions().body ) ).toStrictEqual(
				{
					data: {
						adBlockingRecoverySetupStatus: '',
						useAdBlockingRecoveryErrorSnippet: false,
						useAdBlockingRecoverySnippet: false,
					},
				}
			);

			expect( global.location.assign ).toHaveBeenCalled();
			expect( global.location.assign ).toHaveBeenCalledWith(
				adSenseSettingsURL
			);

			// Reset the document.referrer back to its original value.
			Object.defineProperty( document, 'referrer', {
				writable: true,
				value: originalReferrer,
			} );
		} );
	} );

	describe( 'Final (My message is ready) step', () => {
		beforeEach( async () => {
			muteFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/adsense/data/sync-ad-blocking-recovery-tags'
				)
			);

			muteFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/adsense/data/settings'
				)
			);

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /enable message/i } )
				);
			} );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /create message/i } )
				);
			} );
		} );

		it( 'Should fire the event tracking when rendered', () => {
			expect(
				getByRole( 'button', { name: /my message is ready/i } )
			).toBeInTheDocument();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'setup_final_step'
			);
		} );

		it( 'should return to dashboard with success notice when `My message is ready` button is clicked', async () => {
			const dashboardURL = registry
				.select( CORE_SITE )
				.getAdminURL( 'googlesitekit-dashboard' );

			const setupSuccessURL = addQueryArgs( dashboardURL, {
				notification: 'ad_blocking_recovery_setup_success',
			} );

			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/modules/adsense/data/settings'
				),
				{ body: { success: true }, status: 200 }
			);

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /my message is ready/i } )
				);
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'confirm_message_ready'
			);

			// Save updated Ad Blocking Recovery Settings.
			expect( JSON.parse( fetchMock.lastOptions().body ) ).toStrictEqual(
				{
					data: {
						adBlockingRecoverySetupStatus: 'setup-confirmed',
					},
				}
			);

			expect( global.location.assign ).toHaveBeenCalled();
			expect( global.location.assign ).toHaveBeenCalledWith(
				setupSuccessURL
			);
		} );

		it( 'should fire the tracking event for secondary `Create message` when it is clicked', async () => {
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /create message/i } )
				);
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'create_message',
				'secondary_cta'
			);
		} );

		it( 'should return to AdSense settings page when `Cancel` button is clicked', async () => {
			const adSenseSettingsURL = `${ registry
				.select( CORE_SITE )
				.getAdminURL(
					'googlesitekit-settings'
				) }#/connected-services/adsense`;

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /cancel/i } ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'adBlockingRecovery_adsense-abr',
				'cancel_setup',
				'on_final_step'
			);

			expect( global.location.assign ).toHaveBeenCalled();
			expect( global.location.assign ).toHaveBeenCalledWith(
				adSenseSettingsURL
			);
		} );
	} );
} );
