/**
 * AdSensePerformanceWidget component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import LegacyAdSenseDashboardWidgetOverview from './LegacyAdSenseDashboardWidgetOverview';
import LegacyAdSenseDashboardWidgetSiteStats from './LegacyAdSenseDashboardWidgetSiteStats';
const { useSelect } = Data;

export default function AdSensePerformanceWidget( { handleDataSuccess, handleDataError } ) {
	const [ selectedStats, setSelectedStats ] = useState( 0 );

	const {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
	} = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { compare: true } ) );

	const handleStatSelection = useCallback( ( stat ) => {
		setSelectedStats( stat );
	}, [] );

	const metrics = {
		ESTIMATED_EARNINGS: __( 'Earnings', 'google-site-kit' ),
		PAGE_VIEWS_RPM: __( 'Page RPM', 'google-site-kit' ),
		IMPRESSIONS: __( 'Impressions', 'google-site-kit' ),
		PAGE_VIEWS_CTR: __( 'Page CTR', 'google-site-kit' ),
	};

	return (
		<Fragment>
			<LegacyAdSenseDashboardWidgetOverview
				startDate={ startDate }
				endDate={ endDate }
				compareStartDate={ compareStartDate }
				compareEndDate={ compareEndDate }
				metrics={ metrics }
				selectedStats={ selectedStats }
				handleStatSelection={ handleStatSelection }
				handleDataSuccess={ handleDataSuccess }
				handleDataError={ handleDataError }
			/>

			<LegacyAdSenseDashboardWidgetSiteStats
				startDate={ startDate }
				endDate={ endDate }
				compareStartDate={ compareStartDate }
				compareEndDate={ compareEndDate }
				metrics={ metrics }
				selectedStats={ selectedStats }
			/>
		</Fragment>
	);
}

AdSensePerformanceWidget.propTpyes = {
	handleDataError: PropTypes.func.isRequired,
	handleDataSuccess: PropTypes.func.isRequired,
};
