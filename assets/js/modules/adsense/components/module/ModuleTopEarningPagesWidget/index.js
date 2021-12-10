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
import cloneDeep from 'lodash/cloneDeep';

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
import WhenActive from '../../../../../util/when-active';
import { isRestrictedMetricsError } from '../../../../analytics/util/error';
import Header from './Header';
import Table from './Table';
const { useSelect, useInViewSelect } = Data;

function ModuleTopEarningPagesWidget( {
	Widget,
	WidgetReportZero,
	WidgetReportError,
} ) {
	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const reportArgs = {
		startDate,
		endDate,
		dimensions: [ 'ga:pagePath' ],
		metrics: [
			{ expression: 'ga:adsenseRevenue', alias: 'Earnings' },
			{ expression: 'ga:adsenseECPM', alias: 'Page RPM' },
			{
				expression: 'ga:adsensePageImpressions',
				alias: 'Impressions',
			},
		],
		orderby: {
			fieldName: 'ga:adsenseRevenue',
			sortOrder: 'DESCENDING',
		},
		limit: 10,
	};

	const { isAdSenseLinked, error } = useSelect( ( select ) => {
		return {
			isAdSenseLinked: select( MODULES_ANALYTICS ).getAdsenseLinked(),
			error: select( MODULES_ANALYTICS ).getErrorForSelector(
				'getReport',
				[ reportArgs ]
			),
		};
	} );

	const data = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( reportArgs )
	);

	const titles = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPageTitles( data, reportArgs )
	);

	const isLoading = useSelect( ( select ) => {
		const hasLoadedPageTitles = undefined !== error || undefined !== titles;

		const hasLoaded =
			hasLoadedPageTitles &&
			select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [
				reportArgs,
			] );

		return ! hasLoaded;
	} );

	// A restricted metrics error will cause this value to change in the resolver
	// so this check should happen before an error, which is only relevant if they are linked.
	if ( ! isAdSenseLinked ) {
		return (
			<Widget Header={ Header }>
				<AdSenseLinkCTA />
			</Widget>
		);
	}

	if ( isLoading ) {
		return (
			<Widget noPadding Header={ Header }>
				<PreviewTable padding />
			</Widget>
		);
	}

	if ( error && ! isRestrictedMetricsError( error ) ) {
		return (
			<Widget Header={ Header }>
				<WidgetReportError error={ error } moduleSlug="adsense" />
			</Widget>
		);
	}

	if ( isZeroReport( data ) || isRestrictedMetricsError( error ) ) {
		return (
			<Widget Header={ Header }>
				<WidgetReportZero moduleSlug="adsense" />
			</Widget>
		);
	}

	const rows = data?.[ 0 ]?.data?.rows?.length
		? cloneDeep( data[ 0 ].data.rows )
		: [];

	// Combine the titles from the pageTitles with the rows from the metrics report.
	rows.forEach( ( row ) => {
		const url = row.dimensions[ 0 ];
		row.dimensions.unshift( titles[ url ] ); // We always have an entry for titles[url].
	} );

	return (
		<Widget noPadding Header={ Header }>
			<Table report={ data } />
		</Widget>
	);
}

ModuleTopEarningPagesWidget.propTypes = {
	Widget: PropTypes.func.isRequired,
	WidgetReportZero: PropTypes.func.isRequired,
	WidgetReportError: PropTypes.func.isRequired,
};

export default WhenActive( { moduleName: 'analytics' } )(
	ModuleTopEarningPagesWidget
);
