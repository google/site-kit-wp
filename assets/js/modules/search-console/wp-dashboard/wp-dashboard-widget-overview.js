/**
 * WPSearchConsoleDashboardWidgetOverview component.
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

import PreviewBlocks from 'GoogleComponents/preview-blocks';
import DataBlock from 'GoogleComponents/data-block.js';
import withData from 'GoogleComponents/higherorder/withdata';
import { getTimeInSeconds } from 'GoogleUtil';
import {
	extractSearchConsoleDashboardData,
	isDataZeroSearchConsole,
} from '../dashboard/util';
import CTA from 'GoogleComponents/notifications/cta';

const { __ } = wp.i18n;
const { Component, Fragment } = wp.element;

class WPSearchConsoleDashboardWidgetOverview extends Component {

	render() {
		const { data } = this.props;

		if ( ! data || ! data.length ) {
			return null;
		}
		const processedData = extractSearchConsoleDashboardData( data );

		const {
			totalClicks,
			totalImpressions,
			totalClicksChange,
			totalImpressionsChange,
		} = processedData;

		return (
			<Fragment>
				{ ! data.length ?
					<div className="googlesitekit-wp-dashboard-stats__cta">
						<CTA
							title={ __( 'Search Console Data Empty', 'google-site-kit' ) }
							description={ __( 'Search Console data is not yet available, please check back later.', 'google-site-kit' ) }
							ctaLink={ '' }
							ctaLabel={ '' }
						/>
					</div> :
					<Fragment>
						<DataBlock
							className="googlesitekit-wp-dashboard-stats__data-table overview-total-impressions"
							title={ __( 'Total Impressions', 'google-site-kit' ) }
							datapoint={ totalImpressions }
							change={ totalImpressionsChange }
							changeDataUnit='%'
						/>
						<DataBlock
							className="googlesitekit-wp-dashboard-stats__data-table overview-total-clicks"
							title={ __( 'Total Clicks', 'google-site-kit' ) }
							datapoint={ totalClicks }
							change={ totalClicksChange }
							changeDataUnit='%'
						/>
					</Fragment>
				}
			</Fragment>
		);
	}
}

export default withData(
	WPSearchConsoleDashboardWidgetOverview,
	[
		{
			type: 'modules',
			identifier: 'search-console',
			datapoint: 'sc-site-analytics',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'WPDashboard' ],
		}
	],
	<PreviewBlocks
		width='23%'
		height='94px'
		count={ 2 }
	/>,
	{},
	isDataZeroSearchConsole
);
