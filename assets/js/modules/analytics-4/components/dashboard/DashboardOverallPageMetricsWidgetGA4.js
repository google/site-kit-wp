/**
 * DashboardOverallPageMetricsWidgetGA4 component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { _x, sprintf, _n } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { Grid, Cell } from '../../../../material-components/layout';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
import SourceLink from '../../../../components/SourceLink';
import whenActive from '../../../../util/when-active';
import { calculateOverallPageMetricsData } from '../../utils/overall-page-metrics';
import { getURLPath } from '../../../../util';
import WidgetHeaderTitle from '../../../../googlesitekit/widgets/components/WidgetHeaderTitle';
import useViewOnly from '../../../../hooks/useViewOnly';
import DataBlockGroup from '../../../../components/DataBlockGroup';

function DashboardOverallPageMetricsWidgetGA4( { Widget, WidgetReportError } ) {
	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
	);

	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const url = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const args = {
		...dates,
		dimensions: [ 'date' ],
		metrics: [
			{
				name: 'screenPageViews',
			},
			{
				name: 'sessions',
			},
			{
				name: 'engagementRate',
			},
			{
				name: 'averageSessionDuration',
			},
		],
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
		url,
	};

	const reportArgs = {
		dates,
		// eslint-disable-next-line sitekit/acronym-case
		otherArgs: { collectionId: 'life-cycle' },
	};

	if ( isURL( url ) ) {
		reportArgs.filters = {
			unifiedPagePathScreen: getURLPath( url ),
		};
	}

	const isLoading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ args ]
			)
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			args,
		] )
	);

	const serviceURL = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getServiceReportURL(
			'all-pages-and-screens',
			reportArgs
		);
	} );

	const report = useInViewSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getReport( args ),
		[ args ]
	);

	const currentDayCount = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);

	function Header() {
		return (
			<WidgetHeaderTitle
				title={ sprintf(
					/* translators: %s: number of days */
					_n(
						'Overall page metrics over the last %s day',
						'Overall page metrics over the last %s days',
						currentDayCount,
						'google-site-kit'
					),
					currentDayCount
				) }
			/>
		);
	}

	function Footer() {
		return (
			<SourceLink
				className="googlesitekit-data-block__source"
				name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
				href={ serviceURL }
				external
			/>
		);
	}

	if ( isLoading || isGatheringData === undefined ) {
		return (
			<Widget Footer={ Footer }>
				<PreviewBlock width="100%" height="222px" />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Footer={ Footer }>
				<WidgetReportError moduleSlug="analytics-4" error={ error } />
			</Widget>
		);
	}

	const data = calculateOverallPageMetricsData( report, dates.startDate );

	return (
		<Widget Header={ Header } Footer={ Footer }>
			<Grid>
				<DataBlockGroup className="mdc-layout-grid__inner">
					{ data.map(
						( {
							metric,
							title,
							sparkLineData,
							datapointUnit,
							total,
							change,
						} ) => (
							<Cell key={ metric } smSize={ 2 } lgSize={ 3 }>
								<DataBlock
									title={ title }
									datapoint={ total }
									datapointUnit={ datapointUnit }
									change={ change }
									changeDataUnit="%"
									gatheringData={ isGatheringData }
									sparkline={
										<Sparkline
											data={ sparkLineData }
											change={ change }
											gatheringData={ isGatheringData }
										/>
									}
								/>
							</Cell>
						)
					) }
				</DataBlockGroup>
			</Grid>
		</Widget>
	);
}

export default whenActive( { moduleName: 'analytics-4' } )(
	DashboardOverallPageMetricsWidgetGA4
);
