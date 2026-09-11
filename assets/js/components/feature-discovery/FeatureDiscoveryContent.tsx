/**
 * Feature Discovery routed content.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { DEFAULT_TAB_PATH, FEATURE_DISCOVERY_TABS } from './constants';

const FeatureDiscoveryContent: FC = () => (
	<Switch>
		{ FEATURE_DISCOVERY_TABS.map(
			( { path, tabID, panelID, Component } ) => (
				<Route key={ path } path={ path } exact>
					<div
						aria-labelledby={ tabID }
						id={ panelID }
						role="tabpanel"
						tabIndex={ 0 }
					>
						<Component />
					</div>
				</Route>
			)
		) }
		<Redirect to={ DEFAULT_TAB_PATH } />
	</Switch>
);

export default FeatureDiscoveryContent;
