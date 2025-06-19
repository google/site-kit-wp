/**
 * Analytics Setup form.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import PropTypes from 'prop-types';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';

/**
 * Internal dependencies
 */
import ConnectAnalyticsStep from './ConnectAnalyticsStep';
import SetupKeyMetricsStep from './SetupKeyMetricsStep';

export default function SetupForm( { finishSetup } ) {
	return (
		<HashRouter>
			<Switch>
				<Route path="/connect-analytics">
					<ConnectAnalyticsStep />
				</Route>
			</Switch>
			<Route path="/setup-key-metrics">
				<SetupKeyMetricsStep finishSetup={ finishSetup } />
			</Route>
			<Redirect from="/" to="/connect-analytics" exact />
		</HashRouter>
	);
}

SetupForm.propTypes = {
	finishSetup: PropTypes.func,
};

SetupForm.defaultProps = {
	finishSetup: () => {},
};
