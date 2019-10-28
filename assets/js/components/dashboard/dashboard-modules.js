/**
 * DashboardModules component.
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
 * Internal dependencies
 */
import DashboardModule from './dashboard-module';
/**
 * External dependencies
 */
import HelpLink from 'GoogleComponents/help-link';
import { Fragment } from 'react';
/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class DashboardModules extends Component {
	render() {
		return (
			<Fragment>
				<DashboardModule
					key={ 'googlesitekit-dashboard-module' }
				/>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
					mdc-layout-grid__cell--align-right
				">
					<HelpLink />
				</div>
			</Fragment>
		);
	}
}

export default DashboardModules;
