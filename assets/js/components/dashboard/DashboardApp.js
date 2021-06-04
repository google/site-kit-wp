/**
 * DashboardApp component.
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
import WidgetContextRenderer from '../../googlesitekit/widgets/components/WidgetContextRenderer';
import LegacyDashboardModule from './LegacyDashboardModule';
import DashboardHeader from './DashboardHeader';
import DashboardFooter from './DashboardFooter';
import DashboardNotifications from './dashboard-notifications';
import Header from '../Header';
import DateRangeSelector from '../DateRangeSelector';
import { Grid, Row, Cell } from '../../material-components/layout';
import HelpMenu from '../help/HelpMenu';
import { useFeature } from '../../hooks/useFeature';
import SurveyViewTrigger from '../surveys/SurveyViewTrigger';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export default function DashboardApp() {
	const dashboardWidgetsEnabled = useFeature( 'widgets.dashboard' );
	const helpVisibilityEnabled = useFeature( 'helpVisibility' );
	const userFeedbackEnabled = useFeature( 'userFeedback' );

	return (
		<Fragment>
			<Header>
				{ helpVisibilityEnabled && <HelpMenu /> }
				<DateRangeSelector />
			</Header>

			<DashboardNotifications />

			{ dashboardWidgetsEnabled && (
				<WidgetContextRenderer
					slug="dashboard"
					className="googlesitekit-module-page googlesitekit-dashboard"
					Header={ DashboardHeader }
					Footer={ DashboardFooter }
				/>
			) }

			{ ! dashboardWidgetsEnabled && (
				<div className="googlesitekit-module-page googlesitekit-dashboard">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<DashboardHeader />
							</Cell>
							<LegacyDashboardModule
								key={ 'googlesitekit-dashboard-module' }
							/>
							<Cell size={ 12 }>
								<DashboardFooter />
							</Cell>
						</Row>
					</Grid>
				</div>
			) }
			{ userFeedbackEnabled && <SurveyViewTrigger triggerID="view_dashboard" ttl={ ONE_HOUR_IN_MS } /> }
		</Fragment>
	);
}
