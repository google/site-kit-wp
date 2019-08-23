/**
 * SettingsModuleHeader component.
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

const { Component } = wp.element;

class SettingsModuleHeader extends Component {
	render() {
		const { title, description } = this.props;
		return (
			<header className="googlesitekit-settings-module-header">
				<h2 className="
					googlesitekit-heading-3
					googlesitekit-settings-module-header__title
				">
					{ title }
				</h2>
				{ description &&
					<p className="googlesitekit-settings-module-header__description">{ description }</p>
				}
			</header>
		);
	}
}

SettingsModuleHeader.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string,
};

SettingsModuleHeader.defaultProps = {
	description: '',
};

export default SettingsModuleHeader;
