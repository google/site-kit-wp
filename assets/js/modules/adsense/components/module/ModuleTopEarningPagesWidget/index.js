/**
 * ModuleTopEarningPagesWidget module
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import PreviewTable from '../../../../../components/PreviewTable';
import AdSenseLinkCTA from '../../../../analytics/components/common/AdSenseLinkCTA';
import { DATE_RANGE_OFFSET } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS } from '../../../../analytics/datastore/constants';
import { isZeroReport } from '../../../../analytics/util/is-zero-report';
import { isRestrictedMetricsError } from '../../../../analytics/util/error';
import Header from './Header';
import Table from './Table';

const { useSelect } = Data;

function ModuleTopEarningPagesWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const {
		isAdSenseLinked,
		data,
		isLoading,
		error,
	} = useSelect( ( select ) => {
		const analyticsStore = select( MODULES_ANALYTICS );
		const userStore = select( CORE_USER );

		const { startDate, endDate } = userStore.getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

		const reportArgs = {
			startDate,
			endDate,
			dimensions: [ 'ga:pageTitle', 'ga:pagePath' ],
			metrics: [
				{ expression: 'ga:adsenseRevenue', alias: 'Earnings' },
				{ expression: 'ga:adsenseECPM', alias: 'Page RPM' },
				{ expression: 'ga:adsensePageImpressions', alias: 'Impressions' },
			],
			orderby: {
				fieldName: 'ga:adsenseRevenue',
				sortOrder: 'DESCENDING',
			},
			limit: 10,
		};

		return {
			isAdSenseLinked: analyticsStore.getAdsenseLinked(),
			data: analyticsStore.getReport( reportArgs ),
			error: analyticsStore.getErrorForSelector( 'getReport', [ reportArgs ] ),
			isLoading: ! analyticsStore.hasFinishedResolution( 'getReport', [ reportArgs ] ),
		};
	} );

	// A restricted metrics error will cause this value to change in the resolver
	// so this check should happen before an error, which is only relevant if they are linked.
	if ( ! isAdSenseLinked ) {
		return <AdSenseLinkCTA />;
	}

	if ( error && ! isRestrictedMetricsError( error ) ) {
		return <WidgetReportError error={ error } moduleSlug="adsense" />;
	}

	if ( isZeroReport( data ) || isRestrictedMetricsError( error ) ) {
		return <WidgetReportZero moduleSlug="adsense" />;
	}

	return (
		<Widget
			noPadding
			Header={ Header }
		>
			{ isLoading && (
				<PreviewTable padding />
			) }
			{ ! isLoading && (
				<Table report={ data } />
			) }
		</Widget>
	);
}

ModuleTopEarningPagesWidget.propTypes = {
	Widget: PropTypes.func.isRequired,
	WidgetReportZero: PropTypes.func.isRequired,
	WidgetReportError: PropTypes.func.isRequired,
};

export default ModuleTopEarningPagesWidget;
