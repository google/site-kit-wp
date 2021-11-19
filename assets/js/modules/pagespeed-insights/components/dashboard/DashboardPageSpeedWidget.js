/**
 * Dashboard PageSpeed Widget component.
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
 * Internal dependencies
 */
import DashboardPageSpeed from './DashboardPageSpeed';
import whenActive from '../../../../util/when-active';

function DashboardPageSpeedWidget( { Widget } ) {
	// Pass class to omit regular widget padding and legacy widget class to use original styles.
	return (
		<Widget className="googlesitekit-pagespeed-widget" noPadding>
			<DashboardPageSpeed />
		</Widget>
	);
}

export default whenActive( {
	moduleName: 'pagespeed-insights',
} )( DashboardPageSpeedWidget );
