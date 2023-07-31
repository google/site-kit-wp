/**
 * DashboardViewIndicator component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Badge from './Badge';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS } from '../modules/analytics/datastore/constants';
import { GA4_AUTO_SWITCH_DATE } from '../modules/analytics-4/constants';
import { stringToDate } from '../util';
import whenActive from '../util/when-active';
import useViewOnly from '../hooks/useViewOnly';
const { useSelect } = Data;

const DashboardViewIndicator = () => {
	const isGA4DashboardView = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGA4DashboardView()
	);
	const referenceDate = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const viewOnly = useViewOnly();
	const canViewSharedAnalytics = useSelect( ( select ) => {
		if ( ! viewOnly ) {
			return true;
		}

		return (
			select( CORE_USER ).canViewSharedModule( 'analytics' ) ||
			select( CORE_USER ).canViewSharedModule( 'analytics-4' )
		);
	} );

	if (
		! canViewSharedAnalytics ||
		isGA4DashboardView === undefined ||
		stringToDate( referenceDate ) >= stringToDate( GA4_AUTO_SWITCH_DATE )
	) {
		return null;
	}

	const badgeLabel = isGA4DashboardView
		? __( 'Google Analytics 4 view', 'google-site-kit' )
		: __( 'Universal Analytics view', 'google-site-kit' );

	return (
		<div className="googlesitekit-dashboard-view-indicator__wrapper">
			<Badge
				className="googlesitekit-dashboard-view-indicator__badge"
				label={ badgeLabel }
			/>
		</div>
	);
};

export default whenActive( { moduleName: 'analytics' } )(
	DashboardViewIndicator
);
