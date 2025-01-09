/**
 * Reader Revenue Manager Setup CTA Banner component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import ReaderRevenueManagerSetupCTABanner from './ReaderRevenueManagerSetupCTABanner';
import {
	act,
	render,
	createTestRegistry,
	fireEvent,
	provideModules,
	waitFor,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	ERROR_CODE_NON_HTTPS_SITE,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
} from '../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import { WEEK_IN_SECONDS } from '../../../../util';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '../../../../../../tests/js/mock-survey-endpoints';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import { NOTIFICATIONS } from '../..';

jest.mock( '../../../../hooks/useActivateModuleCallback' );

describe( 'ReaderRevenueManagerSetupCTABanner', () => {
	let registry;
	let activateModuleMock;

	const ReaderRevenueManagerSetupCTABannerComponent =
		withNotificationComponentProps( 'rrm-setup-notification' )(
			ReaderRevenueManagerSetupCTABanner
		);

	const notification = NOTIFICATIONS[ 'rrm-setup-notification' ];

	beforeEach( () => {
		registry = createTestRegistry();
		activateModuleMock = jest.fn( () => jest.fn() );

		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );

		registry
			.dispatch( CORE_USER )
			.finishResolution( 'getDismissedPrompts', [] );

		provideModules( registry, [
			{
				slug: READER_REVENUE_MANAGER_MODULE_SLUG,
				active: false,
			},
		] );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification( 'rrm-setup-notification', notification );

		useActivateModuleCallback.mockImplementation( activateModuleMock );
	} );

	it( 'should render the Reader Revenue Manager setup CTA banner', async () => {
		mockSurveyEndpoints();

		const { getByText, waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText( /Grow your revenue and deepen reader engagement/ )
		).toBeInTheDocument();
	} );

	it( 'should call the "useActivateModuleCallback" hook when the setup CTA is clicked', async () => {
		mockSurveyEndpoints();

		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-prompt' ),
			{
				body: JSON.stringify( [ 'rrm-setup-notification' ] ),
				status: 200,
			}
		);

		registry
			.dispatch( CORE_MODULES )
			.receiveCheckRequirementsSuccess(
				READER_REVENUE_MANAGER_MODULE_SLUG
			);

		const { container, getByRole, waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).not.toBeEmptyDOMElement();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click(
				getByRole( 'button', {
					name: /Set up Reader Revenue Manager/i,
				} )
			);
		} );

		expect( activateModuleMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should call the dismiss item endpoint when the banner is dismissed', async () => {
		mockSurveyEndpoints();

		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-prompt' ),
			{
				body: JSON.stringify( [ 'rrm-setup-notification' ] ),
				status: 200,
			}
		);

		const { getByRole, waitForRegistry } = render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<ReaderRevenueManagerSetupCTABannerComponent />,
			</div>,
			{
				registry,
			}
		);

		await waitForRegistry();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /Maybe later/i } ) );
		} );

		// 3 fetches: 1 for the survey trigger, 1 for the survey timeout, 1 for the dismiss prompt.
		expect( fetchMock ).toHaveFetchedTimes( 3 );
	} );

	it( 'should trigger a survey when the banner is displayed', async () => {
		mockSurveyEndpoints();

		const { waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// The survey trigger endpoint should be called with the correct trigger ID.
		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: { triggerID: 'view_reader_revenue_manager_cta' },
				},
			} )
		);
	} );

	it( 'should not render the Reader Revenue Manager setup CTA banner when dismissed', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			'rrm-setup-notification': {
				expires: Date.now() / 1000 + WEEK_IN_SECONDS,
				count: 1,
			},
		} );
		const { container, waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render the banner when the dismissed prompts selector is not resolved', async () => {
		registry
			.dispatch( CORE_USER )
			.startResolution( 'getDismissedPrompts', [] );

		const { container, waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should call dismiss prompt with the correct expiration time when dismissed once', async () => {
		mockSurveyEndpoints();

		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-prompt' ),
			{
				body: {
					'rrm-setup-notification': {
						expires: 2 * WEEK_IN_SECONDS,
						count: 1,
					},
				},
				status: 200,
			}
		);

		const { getByText, waitForRegistry } = render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<ReaderRevenueManagerSetupCTABannerComponent />,
			</div>,
			{
				registry,
			}
		);

		await waitForRegistry();

		const dismissPromptEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-prompt'
		);

		act( () => {
			fireEvent.click( getByText( /Maybe later/i ) );
		} );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
				body: {
					data: {
						slug: 'rrm-setup-notification',
						expiration: WEEK_IN_SECONDS * 2,
					},
				},
				method: 'POST',
			} );

			expect(
				getByText(
					/You can always enable Reader Revenue Manager from Settings later/
				)
			).toBeInTheDocument();
		} );
	} );

	it( 'should dismiss the prompt permanently when dismissed for the second time', async () => {
		mockSurveyEndpoints();

		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-prompt' ),
			{
				body: {
					'rrm-setup-notification': {
						expires: 0, // Expiry of 0 permanently dismisses the prompt.
						count: 2,
					},
				},
				status: 200,
			}
		);

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			'rrm-setup-notification': {
				expires: Date.now() / 1000 - 2 * WEEK_IN_SECONDS + 1,
				count: 1,
			},
		} );

		const { getByText, waitForRegistry } = render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<ReaderRevenueManagerSetupCTABannerComponent />,
			</div>,
			{
				registry,
			}
		);

		await waitForRegistry();

		const dismissPromptEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-prompt'
		);

		act( () => {
			fireEvent.click( getByText( /Don’t show again/i ) );
		} );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
				body: {
					data: {
						slug: 'rrm-setup-notification',
						expiration: 0,
					},
				},
				method: 'POST',
			} );
		} );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when all required conditions are met', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when the banner was dismissed with the legacy dismissal key', async () => {
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
				[ READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY ]: {
					expires: Date.now() / 1000 + WEEK_IN_SECONDS,
					count: 1,
				},
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the module requirements do not meet', async () => {
			// Throw error from checkRequirements to simulate non-HTTPS site error.
			provideModules( registry, [
				{
					slug: READER_REVENUE_MANAGER_MODULE_SLUG,
					active: false,
					checkRequirements: () => {
						throw {
							code: ERROR_CODE_NON_HTTPS_SITE,
							message:
								'The site should use HTTPS to set up Reader Revenue Manager',
							data: null,
						};
					},
				},
			] );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );
} );
