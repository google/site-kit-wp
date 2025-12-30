/**
 * BannerNotifications component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import CoreSiteBannerNotifications from './CoreSiteBannerNotifications';
import useViewOnly from '@/js/hooks/useViewOnly';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '@/js/hooks/useDashboardType';
import InternalServerError from './InternalServerError';

export default function LegacyNotifications() {
	const viewOnly = useViewOnly();
	const dashboardType = useDashboardType();

	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);

	return (
		<Fragment>
			<InternalServerError />
			{ ! viewOnly &&
				dashboardType === DASHBOARD_TYPE_MAIN &&
				isAuthenticated && <CoreSiteBannerNotifications /> }
		</Fragment>
	);
}
