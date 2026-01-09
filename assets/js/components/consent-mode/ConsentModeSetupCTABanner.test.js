/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { mockSurveyEndpoints } from '../../../../tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
} from '../../../../tests/js/test-utils';
import ConsentModeSetupCTABanner from './ConsentModeSetupCTABanner';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from './constants';

describe( 'ConsentModeSetupCTABanner', () => {
	let registry;
	const ConsentModeSetupCTABannerComponent = withNotificationComponentProps(
		CONSENT_MODE_SETUP_CTA_WIDGET_SLUG
	)( ConsentModeSetupCTABanner );

	const notification =
		DEFAULT_NOTIFICATIONS[ CONSENT_MODE_SETUP_CTA_WIDGET_SLUG ];

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );

		registry
			.dispatch( CORE_SITE )
			.receiveGetAdsMeasurementStatus(
				{ connected: true },
				{ useCache: true }
			);

		registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
			enabled: false,
			regions: [ 'AT', 'EU' ],
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				CONSENT_MODE_SETUP_CTA_WIDGET_SLUG,
				notification
			);
	} );

	it( 'should render the banner', async () => {
		mockSurveyEndpoints();

		registry
			.dispatch( CORE_USER )
			.finishResolution( 'getDismissedPrompts', [] );

		const { container, waitForRegistry } = render(
			<ConsentModeSetupCTABannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when consent mode is not enabled and ads is connected', async () => {
			registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
				enabled: false,
				adsConnected: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when consent mode is already enabled and ads is connected', async () => {
			registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
				enabled: true,
				adsConnected: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when consent mode is not enabled but ads is not connected', async () => {
			registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
				enabled: false,
				adsConnected: false,
			} );

			registry
				.dispatch( CORE_SITE )
				.receiveGetAdsMeasurementStatus(
					{ connected: false },
					{ useCache: true }
				);

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when consent mode is enabled and ads is not connected', async () => {
			registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
				enabled: true,
				adsConnected: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );
	} );
} );
