/**
 * DashboardAllTrafficWidget component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import PreviewBlock from '../../../../components/preview-block';
import DataBlock from '../../../../components/data-block';
import Sparkline from '../../../../components/sparkline';
import CTA from '../../../../components/notifications/cta';
import AnalyticsInactiveCTA from '../../../../components/analytics-inactive-cta';
import { extractAnalyticsDashboardSparklineData } from '../../util';
import { extractForSparkline, getSiteKitAdminURL, readableLargeNumber, changeToPercent } from '../../../../util';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import getNoDataComponent from '../../../../components/notifications/nodata';

const { useSelect } = Data;

function DashboardGoalsWidget() {
	const {
		error,
		loading,
		sparkData,
		goalsData,
		goals,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const args = {
			dateRange: select( CORE_USER ).getDateRange(),
		};

		const sparkDataArgs = {
			compareDateRanges: 1,
			dimensions: 'ga:date',
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Users',
				},
				{
					expression: 'ga:sessions',
					alias: 'Sessions',
				},
				{
					expression: 'ga:bounceRate',
					alias: 'Bounce Rate',
				},
				{
					expression: 'ga:avgSessionDuration',
					alias: 'Average Session Duration',
				},
				{
					expression: 'ga:goalCompletionsAll',
					alias: 'Goal Completions',
				},
			],
			limit: 180,
			...args,
		};

		const goalsDataArgs = {
			...args,
			multiDateRange: 1,
			dimensions: 'ga:date',
			metrics: [ { expression: 'ga:goalCompletionsAll', alias: 'Goal Completions' } ],
			limit: 10,
		};

		return {
			error: store.getErrorForSelector( 'getReport', [ sparkDataArgs ] ) || store.getErrorForSelector( 'getReport', [ goalsDataArgs ] ),
			loading: store.isResolving( 'getReport', [ sparkDataArgs ] ) || store.isResolving( 'getReport', [ goalsDataArgs ] ),
			sparkData: store.getReport( sparkDataArgs ),
			goalsData: store.getReport( goalsDataArgs ),
			goals: store.getGoals(),
		};
	} );

	if ( loading ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	if ( error ) {
		return getDataErrorComponent( __( 'Analytics', 'google-site-kit' ), error.message );
	}

	if ( ( ! sparkData || ! sparkData.length ) && ( ! goalsData || ! goalsData.length ) ) {
		return getNoDataComponent( __( 'Analytics', 'google-site-kit' ) );
	}

	if ( ! goals || ! Array.isArray( goals.items ) || ! goals.items.length ) {
		return (
			<CTA
				title={ __( 'Use goals to measure success.', 'google-site-kit' ) }
				description={ __( 'Goals measure how well your site or app fulfills your target objectives.', 'google-site-kit' ) }
				ctaLink="https://support.google.com/analytics/answer/1032415?hl=en#create_or_edit_goals"
				ctaLabel={ __( 'Create a new goal', 'google-site-kit' ) }
			/>
		);
	}

	const extractedAnalytics = extractAnalyticsDashboardSparklineData( sparkData );

	const { totals } = goalsData[ 0 ].data;
	const lastMonth = totals[ 0 ].values;
	const previousMonth = totals[ 1 ].values;
	const goalCompletions = lastMonth[ 0 ];
	const goalCompletionsChange = changeToPercent( previousMonth[ 0 ], lastMonth[ 0 ] );

	return (
		<DataBlock
			className="overview-goals-completed"
			title={ __( 'Goals Completed', 'google-site-kit' ) }
			datapoint={ readableLargeNumber( goalCompletions ) }
			change={ goalCompletionsChange }
			changeDataUnit="%"
			source={ {
				name: _x( 'Analytics', 'Service name', 'google-site-kit' ),
				link: getSiteKitAdminURL( 'googlesitekit-module-analytics', {} ),
			} }
			sparkline={
				extractedAnalytics &&
				<Sparkline
					data={ extractForSparkline( extractedAnalytics, 3 ) }
					change={ goalCompletionsChange }
				/>
			}
		/>
	);
}

export default whenActive( {
	moduleName: 'analytics',
	fallbackComponent: AnalyticsInactiveCTA,
} )( DashboardGoalsWidget );
