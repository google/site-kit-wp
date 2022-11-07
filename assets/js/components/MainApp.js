/**
 * MainApp component.
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
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_SETTINGS,
	VIEW_CONTEXT_SPLASH,
} from '../googlesitekit/constants';
import DashboardMainApp from './DashboardMainApp';
import DashboardSplashApp from './dashboard-splash/DashboardSplashApp';
import Root from './Root';
import SettingsApp from './settings/SettingsApp';
import DashboardEntityApp from './DashboardEntityApp';

function MainApp() {
	return (
		<HashRouter>
			<Switch>
				<Route path="/splash">
					<Root viewContext={ VIEW_CONTEXT_SPLASH }>
						<DashboardSplashApp />
					</Root>
				</Route>

				<Route path="/dashboard/:permaLink">
					<Root viewContext={ VIEW_CONTEXT_ENTITY_DASHBOARD }>
						<DashboardEntityApp />
					</Root>
				</Route>

				<Route path="/dashboard">
					<Root viewContext={ VIEW_CONTEXT_MAIN_DASHBOARD }>
						<DashboardMainApp />
					</Root>
				</Route>

				<Route path="/settings">
					<Root viewContext={ VIEW_CONTEXT_SETTINGS }>
						<SettingsApp />
					</Root>
				</Route>

				<Redirect to="/dashboard" />
			</Switch>
		</HashRouter>
	);
}

export default MainApp;
