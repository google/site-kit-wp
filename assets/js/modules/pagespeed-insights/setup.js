/**
 * PageSpeedSetup component.
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
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

class PageSpeedSetup extends Component {
	render() {
		const {
			isEditing,
		} = this.props;

		return (
			<div className="googlesitekit-setup-module googlesitekit-setup-module--pagespeed-insights">
				<div className="googlesitekit-settings-module__meta-items">
					<div className="
							googlesitekit-settings-module__meta-item
						">
						<h5 className="googlesitekit-settings-module__meta-item-data">
							{ __( 'PageSpeed Insights are configured', 'google-site-kit' ) }
						</h5>
						<p>
							{ isEditing &&
                __( 'If you want to remove PageSpeed from your site, you can use the "Disconnect" button below.', 'google-site-kit' ) }
							{ ! isEditing &&
                __( 'If you want to remove PageSpeed from your site, click the "Edit" button below.', 'google-site-kit' ) }
						</p>
					</div>
				</div>
			</div>
		);
	}
}

PageSpeedSetup.propTypes = {
	onSettingsPage: PropTypes.bool,
	isEditing: PropTypes.bool,
};

PageSpeedSetup.defaultProps = {
	onSettingsPage: true,
	isEditing: false,
};

export default PageSpeedSetup;
