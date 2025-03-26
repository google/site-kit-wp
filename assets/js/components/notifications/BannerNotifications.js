/**
 * BannerNotifications component.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import useQueryArg from '../../hooks/useQueryArg';
import SetupSuccessBannerNotification from './SetupSuccessBannerNotification';
import CoreSiteBannerNotifications from './CoreSiteBannerNotifications';
import AdSenseAlerts from './AdSenseAlerts';
import useViewOnly from '../../hooks/useViewOnly';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { UI_KEY_KEY_METRICS_SETUP_CTA_RENDERED } from '../KeyMetrics/KeyMetricsSetupCTARenderedEffect';
import { NOTIFICATION_AREAS } from '../../googlesitekit/notifications/datastore/constants';
import Notifications from './Notifications';
import { READER_REVENUE_MANAGER_MODULE_SLUG } from '../../modules/reader-revenue-manager/datastore/constants';

const MODULES_USING_SUBTLE_NOTIFICATIONS = [
	'ads',
	READER_REVENUE_MANAGER_MODULE_SLUG,
	'sign-in-with-google',
];

export default function BannerNotifications() {
	const viewOnly = useViewOnly();

	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);
	const adSenseModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'adsense' )
	);

	const [ notification ] = useQueryArg( 'notification' );
	const [ slug ] = useQueryArg( 'slug' );

	if ( viewOnly ) {
		return (
			<Fragment>
				<Notifications
					areaSlug={ NOTIFICATION_AREAS.BANNERS_ABOVE_NAV }
				/>
			</Fragment>
		);
	}

	return (
		<Fragment>
			{ adSenseModuleActive && <AdSenseAlerts /> }
			{ /* This ensures that the `SetupSuccessBannerNotification` is not rendered for the modules that are using the `SubtleNotification` to display their success notification. */ }
			{ 'authentication_success' === notification &&
				! MODULES_USING_SUBTLE_NOTIFICATIONS.includes( slug ) && (
					<SetupSuccessBannerNotification />
				) }
			{ isAuthenticated && <CoreSiteBannerNotifications /> }
			<Notifications areaSlug={ NOTIFICATION_AREAS.BANNERS_ABOVE_NAV } />
		</Fragment>
	);
}
