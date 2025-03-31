/**
 * `BannerNotifications` tests.
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
	act,
	createTestRegistry,
	muteFetch,
	provideModules,
	provideSiteConnection,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	provideUserInfo,
	render,
} from '../../../../tests/js/test-utils';
import { MODULES_ADSENSE } from '../../modules/adsense/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';
import BannerNotifications from './BannerNotifications';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_AREAS,
} from '../../googlesitekit/notifications/datastore/constants';

describe( 'BannerNotifications', () => {
	mockLocation();

	let registry;

	const testNotification = {
		id: 'test-notification-id',
		title: 'Test notification title',
		content: 'Test notification content',
		ctaURL: '',
		ctaLabel: '',
		ctaTarget: '',
		dismissible: true,
		dismissLabel: 'test dismiss site notification',
		learnMoreURL: '',
		learnMoreLabel: '',
	};

	const activateAdsenseModule = () => {
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
	};

	beforeEach( () => {
		registry = createTestRegistry();

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
			),
			[]
		);

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry );
		provideSiteConnection( registry, {
			hasMultipleAdmins: false,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
		registry.dispatch( CORE_USER ).receiveGetSurvey( { survey: null } );
		registry.dispatch( CORE_SITE ).receiveGetNotifications( [] );
		registry.dispatch( CORE_USER ).receiveNonces( [] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( [] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveHasMismatchGoogleTagID( false );
	} );

	it( 'prioritizes alerts over regular notifications', async () => {
		// Trigger the gathering data notification using the new registration process
		act( () => {
			registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification( 'gathering-data-notification', {
					Component() {
						return (
							<div className="googlesitekit-publisher-win">
								Test notification!
							</div>
						);
					},
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				} );
		} );

		activateAdsenseModule();

		// Include alert notification.
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetNotifications( [ testNotification ] );

		const { container, waitForRegistry } = render(
			<BannerNotifications />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		const notificationBanners = container.querySelectorAll(
			'.googlesitekit-publisher-win'
		);

		// Default notification for search console gathering data
		// is present and adSense alert.
		expect( notificationBanners.length ).toBe( 2 );

		// The first (visible) notification should be alert,
		// taking precedence over other notifications.
		expect( notificationBanners[ 0 ] ).toHaveTextContent(
			'AdSenseTest notification'
		);
	} );
} );
