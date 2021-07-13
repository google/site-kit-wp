/**
 * DashboardDetailsApp component.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import WidgetContextRenderer from '../../googlesitekit/widgets/components/WidgetContextRenderer';
import LegacyDashboardDetailsModule from './LegacyDashboardDetailsModule';
import DashboardDetailsHeader from './DashboardDetailsHeader';
import Header from '../Header';
import DateRangeSelector from '../DateRangeSelector';
import { Grid, Row, Cell } from '../../material-components/layout';
import { useFeature } from '../../hooks/useFeature';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import HelpMenu from '../help/HelpMenu';
const { useSelect } = Data;

export default function DashboardDetailsApp() {
	const pageDashboardWidgetsEnabled = useFeature( 'widgets.pageDashboard' );
	const dashboardURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ) );
	const currentEntityURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );

	if ( ! dashboardURL ) {
		return null;
	}

	return (
		<Fragment>
			<Header>
				 <HelpMenu />
				{ currentEntityURL && <DateRangeSelector /> }
			</Header>

			{ pageDashboardWidgetsEnabled && (
				<WidgetContextRenderer
					slug={ currentEntityURL ? 'pageDashboard' : 'pageDashboardNotFound' }
					className="googlesitekit-module-page googlesitekit-dashboard-single-url"
					Header={ DashboardDetailsHeader }
				/>
			) }

			{ ! pageDashboardWidgetsEnabled && (
				<div className="googlesitekit-module-page googlesitekit-dashboard-single-url">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<DashboardDetailsHeader />
							</Cell>
							{ currentEntityURL && (
								<LegacyDashboardDetailsModule
									key={ 'googlesitekit-dashboard-details-module' }
								/>
							) }
						</Row>
					</Grid>
				</div>
			) }
		</Fragment>
	);
}
