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
import { STORE_NAME as CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/data-block';
import Sparkline from '../../../../components/Sparkline';
import CTA from '../../../../components/notifications/cta';
import AnalyticsInactiveCTA from '../../../../components/AnalyticsInactiveCTA';
import { readableLargeNumber, changeToPercent } from '../../../../util';
import parseDimensionStringToDate from '../../util/parseDimensionStringToDate';
import { isZeroReport } from '../../util';
import ReportError from '../../../../components/ReportError';
import ReportZero from '../../../../components/ReportZero';

const { useSelect } = Data;

export default function DashboardGoalsWidget() {
	const analyticsModule = useSelect( ( select ) => select( CORE_MODULES ).getModule( 'analytics' ) );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );
	const internalWebPropertyID = useSelect( ( select ) => select( STORE_NAME ).getInternalWebPropertyID() );

	const args = {
		dateRange,
		multiDateRange: 1,
		dimensions: 'ga:date',
		metrics: [ {
			expression: 'ga:goalCompletionsAll',
			alias: 'Goal Completions',
		} ],
	};

	const resolvedReport = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ args ] ) );
	const resolvedGoals = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getGoals', [] ) );
	const { data, error, serviceURL, goals } = useSelect( ( select ) => {
		if ( ! analyticsModule || ! analyticsModule.active || ! analyticsModule.connected ) {
			return {};
		}

		return {
			serviceURL: select( STORE_NAME ).getServiceURL( { path: `/report/conversions-goals-overview/a${ accountID }w${ internalWebPropertyID }p${ profileID }/` } ),
			data: select( STORE_NAME ).getReport( args ),
			goals: select( STORE_NAME ).getGoals(),
			error: select( STORE_NAME ).getErrorForSelector( 'getReport', [ args ] ) ||
				select( STORE_NAME ).getErrorForSelector( 'getGoals', [] ),
		};
	} );

	if ( ! analyticsModule ) {
		return null;
	}

	if ( ! analyticsModule.active || ! analyticsModule.connected ) {
		return <AnalyticsInactiveCTA />;
	}

	if ( ! resolvedReport || ! resolvedGoals ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
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

	if ( isZeroReport( data ) ) {
		return <ReportZero moduleSlug="analytics" />;
	}

	const sparkLineData = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Bounce Rate' },
		],
	];

	const dataRows = data[ 0 ].data.rows;
	// We only want half the date range, having `multiDateRange` in the query doubles the range.
	for ( let i = Math.ceil( dataRows.length / 2 ); i < dataRows.length; i++ ) {
		const { values } = dataRows[ i ].metrics[ 0 ];
		const dateString = dataRows[ i ].dimensions[ 0 ];
		const date = parseDimensionStringToDate( dateString );
		sparkLineData.push( [
			date,
			values[ 0 ],
		] );
	}

	const { totals } = data[ 0 ].data;
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
				link: serviceURL,
				external: true,
			} }
			sparkline={
				sparkLineData &&
				<Sparkline
					data={ sparkLineData }
					change={ goalCompletionsChange }
				/>
			}
		/>
	);
}
