/**
 * DashboardModuleHeader component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class DashboardModuleHeader extends Component {
	render() {
		const { title, description } = this.props;
		return (
			<header className="googlesitekit-dashboard-module-header">
				<div className="mdc-layout-grid__inner">
					{ title &&
					<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12-desktop
								mdc-layout-grid__cell--span-8-tablet
								mdc-layout-grid__cell--span-4-phone
							">
						<h3 className="
									googlesitekit-heading-3
									googlesitekit-dashboard-module-header__title
								">
							{ title }
						</h3>
						{ description &&
						<p className="googlesitekit-dashboard-module-header__description">{ description }</p>
						}
					</div>
					}
				</div>
			</header>
		);
	}
}

DashboardModuleHeader.propTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
};

DashboardModuleHeader.defaultProps = {
	title: '',
	description: '',
};

export default DashboardModuleHeader;
