/**
 * SearchConsoleAdminbarWidgetOverview component.
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
import DataBlock from 'GoogleComponents/data-block';
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';
import { getTimeInSeconds } from 'GoogleUtil';
/**
 * Internal dependencies
 */
import { extractSearchConsoleDashboardData, isDataZeroSearchConsole } from '../dashboard/util';
import PreviewBlock from 'GoogleComponents/preview-block';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

class SearchConsoleAdminbarWidgetOverview extends Component {
	render() {
		const { data } = this.props;

		if ( ! data || data.error ) {
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
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-2-tablet
					mdc-layout-grid__cell--span-3-desktop
				">
					<DataBlock
						className="overview-total-clicks"
						title={ __( 'Total Clicks', 'google-site-kit' ) }
						datapoint={ totalClicks }
						change={ totalClicksChange }
						changeDataUnit="%"
					/>
				</div>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-2-tablet
					mdc-layout-grid__cell--span-3-desktop
				">
					<DataBlock
						className="overview-total-impressions"
						title={ __( 'Total Impressions', 'google-site-kit' ) }
						datapoint={ totalImpressions }
						change={ totalImpressionsChange }
						changeDataUnit="%"
					/>
				</div>
			</Fragment>
		);
	}
}

export default withData(
	SearchConsoleAdminbarWidgetOverview,
	[
		{
			type: TYPE_MODULES,
			identifier: 'search-console',
			datapoint: 'searchanalytics',
			data: {
				url: googlesitekit.permaLink,
				dimensions: 'date',
				compareDateRanges: true,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Adminbar',
		},
	],
	<Fragment>
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-2-tablet
			mdc-layout-grid__cell--span-3-desktop
		">
			<PreviewBlock width="auto" height="59px" />
		</div>
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-2-tablet
			mdc-layout-grid__cell--span-3-desktop
		">
			<PreviewBlock width="auto" height="59px" />
		</div>
	</Fragment>,
	{ inGrid: true },
	isDataZeroSearchConsole
);
