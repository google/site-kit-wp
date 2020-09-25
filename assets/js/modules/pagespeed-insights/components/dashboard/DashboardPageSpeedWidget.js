/**
 * Dashboard PageSpeed Widget component.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Widgets from 'googlesitekit-widgets';
import { STORE_NAME as MODULES_STORE } from '../../../../googlesitekit/modules/datastore/constants';
import DashboardPageSpeedCTA from './DashboardPageSpeedCTA';
import DashboardPageSpeed from './DashboardPageSpeed';
const { useSelect } = Data;
const { Widget } = Widgets.components;

function DashboardPageSpeedWidget() {
	const pagespeedInsightsModule = useSelect( ( select ) => select( MODULES_STORE ).getModule( 'pagespeed-insights' ) );
	if ( ! pagespeedInsightsModule ) {
		return null;
	}

	const { active, connected } = pagespeedInsightsModule;
	if ( ! active || ! connected ) {
		return <DashboardPageSpeedCTA />;
	}

	// Pass class to omit regular widget padding and legacy widget class to use original styles.
	return (
		<Widget
			slug="pagespeedInsightsWebVitals"
			className="googlesitekit-widget--no-padding googlesitekit-pagespeed-widget"
		>
			<DashboardPageSpeed />
		</Widget>
	);
}

export default DashboardPageSpeedWidget;
