/**
 * AdBlockingRecoverySetupSuccessBannerNotification component tests.
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
 * External dependencies
 */
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * Internal dependencies
 */
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	render,
	waitFor,
} from '../../../../tests/js/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '../../modules/adsense/datastore/constants';
import * as tracking from '../../util/tracking';
import AdBlockingRecoverySetupSuccessBannerNotification from './AdBlockingRecoverySetupSuccessBannerNotification';
import { mockSurveyEndpoints } from '../../../../tests/js/mock-survey-endpoints';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

jest.mock( 'react-use' );

mockUseIntersection.mockImplementation( () => ( {
	isIntersecting: true,
} ) );

describe( 'AdBlockingRecoverySetupSuccessBannerNotification', () => {
	let registry;

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: 'adsense',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			accountID: 'pub-123456',
		} );
	} );

	it( 'should not render notification if ad blocking recovery setup status is not "setup-confirmed"', () => {
		registry
			.dispatch( MODULES_ADSENSE )
			.setAdBlockingRecoverySetupStatus(
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED
			);

		const { container } = render(
			<AdBlockingRecoverySetupSuccessBannerNotification />,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();

		// If the notification is not rendered, no tracking event should fire.
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should render notification otherwise', async () => {
		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				authenticated: true,
			}
		);

		mockSurveyEndpoints( registry );

		registry
			.dispatch( MODULES_ADSENSE )
			.setAdBlockingRecoverySetupStatus(
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
			);

		const { container, getByRole } = render(
			<AdBlockingRecoverySetupSuccessBannerNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( container.childElementCount ).toBe( 1 );

		// The tracking event should fire when the notification is viewed.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_adsense-abr-success-notification',
			'view_notification'
		);

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /Ok, got it!/i } ) );
		} );

		// The tracking event should fire when the notification is confirmed.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_adsense-abr-success-notification',
			'confirm_notification'
		);

		// The survey trigger endpoint should be called.
		const surveyTriggerEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/survey-trigger'
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: { triggerID: 'abr_setup_completed' },
				},
			} )
		);
	} );
} );
