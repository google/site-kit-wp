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
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import ErrorText from '../../../../components/error-text';
import PreviewBlock from '../../../../components/preview-block';
import DataBlock from '../../../../components/data-block';
import Sparkline from '../../../../components/sparkline';
import { siteAnalyticsReportDataDefaults, extractAnalyticsDashboardSparklineData } from '../../util';
import { extractForSparkline, getSiteKitAdminURL, readableLargeNumber, changeToPercent } from '../../../../util';
const { useSelect } = Data;

function DashboardGoalsWidget() {
	const {
		sparkData,
		sparkDataError,
		goalsData,
		goalsDataError,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const args = {
			dateRange: select( CORE_USER ).getDateRange(),
		};

		const url = select( CORE_SITE ).getCurrentEntityURL();
		if ( url ) {
			args.url = url;
		}

		const sparkDataArgs = {
			...siteAnalyticsReportDataDefaults,
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
			sparkData: store.getReport( sparkDataArgs ),
			sparkDataError: store.getErrorForSelector( 'getReport', [ sparkDataArgs ] ),
			goalsData: store.getReport( goalsDataArgs ),
			goalsDataError: store.getErrorForSelector( 'getReport', [ goalsDataArgs ] ),
		};
	} );

	if ( goalsDataError || sparkDataError ) {
		return (
			<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
				<ErrorText message={ ( goalsDataError || sparkDataError ).message } />
			</div>
		);
	}

	if ( ! goalsData || ! sparkData ) {
		return <PreviewBlock width="100%" height="202px" />;
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

export default whenActive( { moduleName: 'analytics' } )( DashboardGoalsWidget );
