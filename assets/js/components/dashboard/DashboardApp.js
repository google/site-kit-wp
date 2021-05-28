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
import DashboardHeader from './DashboardHeader';
import DashboardFooter from './DashboardFooter';
import DashboardNotifications from './dashboard-notifications';
import Header from '../Header';
import DateRangeSelector from '../DateRangeSelector';
import HelpMenu from '../help/HelpMenu';
import { useFeature } from '../../hooks/useFeature';

export default function DashboardApp() {
	const helpVisibilityEnabled = useFeature( 'helpVisibility' );

	return (
		<Fragment>
			<Header>
				{ helpVisibilityEnabled && <HelpMenu /> }
				<DateRangeSelector />
			</Header>

			<DashboardNotifications />

			<WidgetContextRenderer
				slug="dashboard"
				className="googlesitekit-module-page googlesitekit-dashboard"
				Header={ DashboardHeader }
				Footer={ DashboardFooter }
			/>

		</Fragment>
	);
}
