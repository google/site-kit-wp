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
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '../../../../../../tests/js/mock-survey-endpoints';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import * as tracking from '../../../../util/tracking';
import AdBlockingRecoverySetupSuccessBannerNotification, {
	AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID,
} from './AdBlockingRecoverySetupSuccessBannerNotification';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: () => ( {
		isIntersecting: true,
	} ),
} ) );

describe( 'AdBlockingRecoverySetupSuccessBannerNotification', () => {
	let registry;
	const AdBlockingRecoverySetupSuccessBannerNotificationComponent =
		withNotificationComponentProps(
			AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID
		)( AdBlockingRecoverySetupSuccessBannerNotification );

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

	it( 'should render notification and trigger ACR survey', async () => {
		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				authenticated: true,
			}
		);

		mockSurveyEndpoints();

		await registry
			.dispatch( CORE_UI )
			.setValue(
				`notification/${ AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID }/viewed`,
				true
			);

		registry
			.dispatch( MODULES_ADSENSE )
			.setAdBlockingRecoverySetupStatus(
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
			);

		const { container } = render(
			<AdBlockingRecoverySetupSuccessBannerNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( container ).toMatchSnapshot();

		// The survey trigger endpoint should be called on view.
		await waitFor( () =>
			expect( fetchMock ).toHaveFetched(
				surveyTriggerEndpoint,
				expect.objectContaining( {
					body: {
						data: { triggerID: 'abr_setup_completed' },
					},
				} )
			)
		);
	} );
} );
