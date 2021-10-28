/**
 * OverallPageMetricsWidget component.
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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS,
} from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { Grid, Row, Cell } from '../../../../../material-components/layout';
import PreviewBlock from '../../../../../components/PreviewBlock';
import DataBlock from '../../../../../components/DataBlock';
import Sparkline from '../../../../../components/Sparkline';
import whenActive from '../../../../../util/when-active';
import { calculateChange } from '../../../../../util';
import parseDimensionStringToDate from '../../../util/parseDimensionStringToDate';
import { isZeroReport } from '../../../util';
const { useSelect } = Data;
// const { useSelect, useDispatch } = Data;

function useWidgetReport() {
	return useSelect( ( select ) => {
		const dates = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const url = select( CORE_SITE ).getCurrentEntityURL();

		// eslint-disable-next-line no-console
		console.log( 'entity URL', url );

		const args = {
			...dates,
			dimensions: [ 'ga:date' ],
			// dimensions: [ 'ga:pagePath' ],
			// dimensions: [ 'ga:hostname' ],
			metrics: [
				{
					expression: 'ga:pageviews',
					alias: 'Pageviews',
				},
				{
					expression: 'ga:uniquePageviews',
					alias: 'Unique Pageviews',
				},
				{
					expression: 'ga:bounceRate',
					alias: 'Bounce Rate',
				},
				{
					expression: 'ga:avgSessionDuration',
					alias: 'Session Duration',
				},
			],
			url,
			// orderby: [
			// 	{
			// 		fieldName: 'ga:pageviews',
			// 		sortOrder: 'DESCENDING',
			// 	},
			// ],
			// limit: 10,
		};

		const report = select( MODULES_ANALYTICS ).getReport( args );

		const error = select(
			MODULES_ANALYTICS
		).getErrorForSelector( 'getReport', [ args ] );

		const isLoading = ! select(
			MODULES_ANALYTICS
		).hasFinishedResolution( 'getReport', [ args ] );

		return {
			report,
			error,
			isLoading,
		};
	} );
}

function DashboardOverallPageMetricsWidget( {
	// Widget,
	WidgetReportZero,
	WidgetReportError,
} ) {
	const isGatheringData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
	);

	// eslint-disable-next-line no-console
	console.log( 'isGatheringData', isGatheringData );

	const { report, isLoading, error } = useWidgetReport();

	// eslint-disable-next-line no-console
	console.log( 'report, isLoading, error', report, isLoading, error );

	if ( isLoading || isGatheringData === undefined ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isGatheringData && isZeroReport( report ) ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	const sparkLineData = {
		pageviews: [
			[
				{ type: 'date', label: 'Day' },
				{ type: 'number', label: 'Pageviews' },
			],
		],
		uniquePageviews: [
			[
				{ type: 'date', label: 'Day' },
				{ type: 'number', label: 'Unique Pageviews' },
			],
		],
		bounceRate: [
			[
				{ type: 'date', label: 'Day' },
				{ type: 'number', label: 'Bounce Rate' },
			],
		],
		sessionDuration: [
			[
				{ type: 'date', label: 'Day' },
				{ type: 'number', label: 'Session Duration' },
			],
		],
	};

	const { totals = [], rows = [] } = report?.[ 0 ]?.data || {};

	// // We only want half the date range, having `multiDateRange` in the query doubles the range.
	// for ( let i = Math.ceil( rows.length / 2 ); i < rows.length; i++ ) {
	for ( let i = 0; i < rows.length; i++ ) {
		const { values } = rows[ i ].metrics[ 0 ];
		const dateString = rows[ i ].dimensions[ 0 ];
		const date = parseDimensionStringToDate( dateString );

		Object.values( sparkLineData ).forEach( ( sparkLine, index ) => {
			sparkLine.push( [ date, values[ index ] ] );
		} );
	}

	const lastMonth = totals[ 0 ]?.values || [];
	const previousMonth = totals[ 1 ]?.values || [];

	const totalsData = Object.keys( sparkLineData ).reduce(
		( data, metric, index ) => {
			data[ metric ] = {
				total: lastMonth[ index ] || 0,
				totalChange: calculateChange(
					previousMonth[ index ] || 0,
					lastMonth[ index ] || 0
				),
			};
			return data;
		},
		{}
	);

	// Object.values( sparkLineData ).forEach( ( sparkLine, index ) => {
	// 	const pageviews = lastMonth[ 0 ] || 0;
	// 	const pageviewsChange = calculateChange(
	// 		previousMonth[ 0 ] || 0,
	// 		lastMonth[ 0 ] || 0
	// 	);
	// } );

	const serviceURL = 'http://foo.com';

	// content-drilldown ?
	// trafficsources-overview ?

	return (
		<Grid>
			{ /* TODO: Do we need the title/subtitle? If so, fix CSS classes. */ }
			<Row>
				<Cell className="googlesitekit-widget-area-header" size={ 12 }>
					<h3 className="googlesitekit-widget-area-header__title googlesitekit-heading-3">
						{ __( 'Overall Page Metrics', 'google-site-kit' ) }
					</h3>
					<h4 className="googlesitekit-widget-area-header__subtitle">
						{ __(
							'Overall page metrics, subtitle.',
							'google-site-kit'
						) }
					</h4>
				</Cell>
			</Row>
			<Row>
				{ /* <Cell lgSize={ 7 } mdSize={ 8 }> */ }
				<Cell size={ 3 }>
					<DataBlock
						// className="overview-goals-completed"
						title={ __( 'Pageviews', 'google-site-kit' ) }
						datapoint={ totalsData.pageviews.total }
						change={ totalsData.pageviews.totalChange }
						changeDataUnit="%"
						source={ {
							name: _x(
								'Analytics',
								'Service name',
								'google-site-kit'
							),
							link: serviceURL,
							external: true,
						} }
						sparkline={
							<Sparkline
								data={ sparkLineData.pageviews }
								change={ totalsData.pageviews.totalChange }
							/>
						}
					/>
				</Cell>
				<Cell size={ 3 }>TODO: UNIQUE PAGEVIEWS</Cell>
				<Cell size={ 3 }>TODO: BOUNCE RATE</Cell>
				<Cell size={ 3 }>TODO: SESSION DURATION</Cell>
			</Row>
		</Grid>
	);
}

export default whenActive( { moduleName: 'analytics' } )(
	DashboardOverallPageMetricsWidget
);
