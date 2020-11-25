/**
 * AdSensePerformanceWidget component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { Fragment, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AdSenseDashboardWidgetOverview from './AdSenseDashboardWidgetOverview';
import AdSenseDashboardWidgetSiteStats from './AdSenseDashboardWidgetSiteStats';

export default function AdSensePerformanceWidget() {
	const [ selectedStats, setSelectedStats ] = useState( 0 );

	const handleStatSelection = useCallback( ( stat ) => {
		setSelectedStats( stat );
	}, [] );

	const metrics = {
		EARNINGS: __( 'Earnings', 'google-site-kit' ),
		PAGE_VIEWS_RPM: __( 'Page RPM', 'google-site-kit' ),
		IMPRESSIONS: __( 'Impressions', 'google-site-kit' ),
		PAGE_VIEWS_CTR: __( 'Page CTR', 'google-site-kit' ),
	};

	return (
		<Fragment>
			<AdSenseDashboardWidgetOverview
				metrics={ metrics }
				selectedStats={ selectedStats }
				handleStatSelection={ handleStatSelection }
			/>

			<AdSenseDashboardWidgetSiteStats
				metrics={ metrics }
				selectedStats={ selectedStats }
			/>
		</Fragment>
	);
}
