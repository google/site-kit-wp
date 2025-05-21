/**
 * PageSpeed Insights module initialization.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { __ } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
	AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
} from '../../googlesitekit/widgets/default-areas';
import { SettingsView } from './components/settings';
import DashboardPageSpeedWidget from './components/dashboard/DashboardPageSpeedWidget';
import PageSpeedInsightsIcon from '../../../svg/graphics/pagespeed-insights.svg';
import { MODULES_PAGESPEED_INSIGHTS } from './datastore/constants';
import { NOTIFICATION_AREAS } from '../../googlesitekit/notifications/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import SetupSuccessNotification from './components/notifications/SetupSuccessNotification';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'pagespeed-insights', {
		storeName: MODULES_PAGESPEED_INSIGHTS,
		SettingsViewComponent: SettingsView,
		Icon: PageSpeedInsightsIcon,
		features: [
			__(
				'Website performance reports for mobile and desktop will be disabled',
				'google-site-kit'
			),
		],
		overrideSetupSuccessNotification: true,
	} );
};

export const registerWidgets = ( widgets ) => {
	widgets.registerWidget(
		'pagespeedInsightsWebVitals',
		{
			Component: DashboardPageSpeedWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			wrapWidget: false,
			modules: [ 'pagespeed-insights' ],
		},
		[
			AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
			AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
		]
	);
};

export const NOTIFICATIONS = {
	'setup-success-notification-psi': {
		Component: SetupSuccessNotification,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: () => {
			const notification = getQueryArg( location.href, 'notification' );
			const slug = getQueryArg( location.href, 'slug' );

			if (
				'authentication_success' === notification &&
				slug === 'pagespeed-insights'
			) {
				return true;
			}

			return false;
		},
	},
};

export const registerNotifications = ( notificationsAPI ) => {
	for ( const notificationID in NOTIFICATIONS ) {
		notificationsAPI.registerNotification(
			notificationID,
			NOTIFICATIONS[ notificationID ]
		);
	}
};
