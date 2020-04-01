/**
 * PageSpeedInsightsDashboardWidgetHomepageSpeedColumn component.
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
 * External dependencies
 */
import withData from 'GoogleComponents/higherorder/withdata';
import getDataErrorComponent from 'GoogleComponents/notifications/data-error';
import { TYPE_MODULES } from 'GoogleComponents/data';
import { getTimeInSeconds } from 'GoogleUtil';
import {
	getDataTableFromData,
	TableOverflowContainer,
} from 'GoogleComponents/data-table';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getScoreCategoryLabel,
	PageSpeedReportScoreCategoryWrapper,
	PageSpeedReportScoreGauge,
} from './util';

const hasData = ( data ) => {
	return !! get( data, 'categories.performance.score' );
};

class PageSpeedInsightsDashboardWidgetHomepageSpeedColumn extends Component {
	componentDidMount() {
		const {
			data,
			handleDataLoaded,
		} = this.props;

		if ( data && handleDataLoaded ) {
			handleDataLoaded();
		}
	}

	render() {
		const { data, title } = this.props;

		// Waiting for withData resolution.
		if ( ! data || data.error ) {
			return null;
		}

		if ( ! hasData( data ) ) {
			return getDataErrorComponent(
				_x( 'PageSpeed Insights', 'Service name', 'google-site-kit' ),
				__( 'An unknown error occurred while trying to fetch PageSpeed Insights data. Please try again later.', 'google-site-kit' ),
				true
			);
		}

		const headers = [];
		const options = {
			hideHeader: true,
			disableListMode: true,
			chartsEnabled: false,
			links: [],
		};

		const score = data.categories.performance.score;
		const scoreCategory = getScoreCategoryLabel( score );
		const interactive = data.audits.interactive.displayValue;

		const dataTable = getDataTableFromData(
			[
				[
					__( 'Real user speed data', 'google-site-kit' ),
					<PageSpeedReportScoreCategoryWrapper key="0" score={ score }>{ scoreCategory }</PageSpeedReportScoreCategoryWrapper>,
				],
				[
					__( 'Time to become fully interactive', 'google-site-kit' ),
					<PageSpeedReportScoreCategoryWrapper key="0" score={ score }>{ interactive }</PageSpeedReportScoreCategoryWrapper>,
				],
			],
			headers,
			options
		);

		return (
			<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-4-phone
				mdc-layout-grid__cell--span-4-tablet
				mdc-layout-grid__cell--span-6-desktop
			">
				<div className="googlesitekit-pagespeed-report__heading-wrapper">
					<h3 className="
						googlesitekit-subheading-1
					">
						{ title }
					</h3>
					<PageSpeedReportScoreGauge score={ score } />
				</div>
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			</div>
		);
	}
}

export const PageSpeedInsightsDashboardWidgetHomepageSpeedMobile = withData(
	PageSpeedInsightsDashboardWidgetHomepageSpeedColumn,
	[
		{
			type: TYPE_MODULES,
			identifier: 'pagespeed-insights',
			datapoint: 'pagespeed',
			data: {
				url: global.googlesitekit.permaLink,
				strategy: 'mobile',
				dateRange: null,
			},
			priority: 10,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
	],
	null,
	{
		inGrid: true,
	},
);

export const PageSpeedInsightsDashboardWidgetHomepageSpeedDesktop = withData(
	PageSpeedInsightsDashboardWidgetHomepageSpeedColumn,
	[
		{
			type: TYPE_MODULES,
			identifier: 'pagespeed-insights',
			datapoint: 'pagespeed',
			data: {
				url: global.googlesitekit.permaLink,
				strategy: 'desktop',
				dateRange: null,
			},
			priority: 10,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
	],
	null,
	{
		inGrid: true,
	},
);
