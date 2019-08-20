/**
 * SettingsOverlay component.
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
import SvgIcon from 'GoogleUtil/svg-icon';
import PropTypes from 'prop-types';

const { Component } = wp.element;
const { __ } = wp.i18n;

class SettingsOverlay extends Component {
	render() {
		const { compress } = this.props;

		return (
			<div className={ `
				googlesitekit-overlay
				${ compress ? 'googlesitekit-overlay--compress' : '' }
			` }>
				<div className="googlesitekit-overlay__wrapper">
					<div className="googlesitekit-overlay__icon">
						<SvgIcon id="lock" width="22" height="30" />
					</div>
					<h3 className="
						googlesitekit-heading-2
						googlesitekit-overlay__title
					">
						{ __( 'Section locked while editing', 'google-site-kit' ) }
					</h3>
				</div>
			</div>
		);
	}
}

SettingsOverlay.propTypes = {
	compress: PropTypes.bool,
};

SettingsOverlay.defaultProps = {
	compress: false,
};

export default SettingsOverlay;
