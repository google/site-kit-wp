/**
 * DashboardGoalsWidget component.
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
} from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import whenActive from '../../../../util/when-active';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
import CTA from '../../../../components/notifications/CTA';
import { calculateChange } from '../../../../util';
import parseDimensionStringToDate from '../../util/parseDimensionStringToDate';
import { isZeroReport } from '../../util';
import { generateDateRangeArgs } from '../../util/report-date-range-args';
const { useSelect, useInViewSelect } = Data;

function DashboardGoalsWidget( { WidgetReportZero, WidgetReportError } ) {
	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
	);

	const url = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const { compareStartDate, compareEndDate, startDate, endDate } = useSelect(
		( select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} )
	);

	const args = {
		compareStartDate,
		compareEndDate,
		startDate,
		endDate,
		dimensions: 'ga:date',
		metrics: [
			{
				expression: 'ga:goalCompletionsAll',
				alias: 'Goal Completions',
			},
		],
	};

	const totalUsersArgs = {
		startDate,
		endDate,
		url,
		compareStartDate,
		compareEndDate,
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
	};

	const { error, loading, serviceURL } = useSelect( ( select ) => {
		const store = select( MODULES_ANALYTICS );

		const isLoading =
			! store.hasFinishedResolution( 'getGoals', [] ) ||
			! store.hasFinishedResolution( 'getReport', [ args ] ) ||
			! store.hasFinishedResolution( 'getReport', [ totalUsersArgs ] );

		return {
			error:
				store.getErrorForSelector( 'getGoals', [] ) ||
				store.getErrorForSelector( 'getReport', [ args ] ),
			loading: isLoading,
			serviceURL: store.getServiceReportURL(
				'conversions-goals-overview',
				{
					...generateDateRangeArgs( {
						startDate,
						endDate,
						compareStartDate,
						compareEndDate,
					} ),
				}
			),
		};
	} );

	const goals = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getGoals()
	);

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( args )
	);

	const totalUsers = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( totalUsersArgs )
	);

	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/1032415',
			hash: 'create_or_edit_goals',
		} )
	);

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics" error={ error } />;
	}

	if ( loading || isGatheringData === undefined ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	if ( isGatheringData && isZeroReport( totalUsers ) ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	if ( ! goals?.items?.length ) {
		return (
			<CTA
				title={ __(
					'Use goals to measure success',
					'google-site-kit'
				) }
				description={ __(
					'Goals measure how well your site or app fulfills your target objectives',
					'google-site-kit'
				) }
				ctaLink={ supportURL }
				ctaLabel={ __( 'Create a new goal', 'google-site-kit' ) }
				ctaLinkExternal
			/>
		);
	}

	const sparkLineData = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Bounce Rate' },
		],
	];

	const { totals = [], rows = [] } = report?.[ 0 ]?.data || {};

	// We only want half the date range, having a comparison date range in the query doubles the range.
	for ( let i = Math.ceil( rows.length / 2 ); i < rows.length; i++ ) {
		const { values } = rows[ i ].metrics[ 0 ];
		const dateString = rows[ i ].dimensions[ 0 ];
		const date = parseDimensionStringToDate( dateString );
		sparkLineData.push( [ date, values[ 0 ] ] );
	}

	const lastMonth = totals[ 0 ]?.values || [];
	const previousMonth = totals[ 1 ]?.values || [];
	const goalCompletions = lastMonth[ 0 ] || 0;
	const goalCompletionsChange = calculateChange(
		previousMonth[ 0 ] || 0,
		lastMonth[ 0 ] || 0
	);

	return (
		<DataBlock
			className="overview-goals-completed"
			title={ __( 'Goals Completed', 'google-site-kit' ) }
			datapoint={ goalCompletions }
			change={ goalCompletionsChange }
			changeDataUnit="%"
			source={ {
				name: _x( 'Analytics', 'Service name', 'google-site-kit' ),
				link: serviceURL,
				external: true,
			} }
			sparkline={
				<Sparkline
					data={ sparkLineData }
					change={ goalCompletionsChange }
					gatheringData={ isGatheringData }
				/>
			}
			gatheringData={ isGatheringData }
		/>
	);
}

export default whenActive( {
	moduleName: 'analytics',
	FallbackComponent: ( { WidgetActivateModuleCTA } ) => (
		<WidgetActivateModuleCTA moduleSlug="analytics" />
	),
	IncompleteComponent: ( { WidgetCompleteModuleActivationCTA } ) => (
		<WidgetCompleteModuleActivationCTA moduleSlug="analytics" />
	),
} )( DashboardGoalsWidget );
