/**
 * AdSenseDashboardOutro component.
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
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SvgIcon from '../../../util/svg-icon';
import Button from '../../../components/button';

class AdSenseDashboardOutro extends Component {
	render() {
		const { accountURL } = global.googlesitekit.modules.adsense;

		return (
			<section className="googlesitekit-module-outro">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-12
						">
							<div className="googlesitekit-module-outro__logo">
								<SvgIcon id="adsense" height="36" width="42" />
								<SvgIcon id="plus" height="13" width="13" />
								<SvgIcon id="analytics" height="36" width="34" />
							</div>
							<h3 className="
								googlesitekit-heading-3
								googlesitekit-module-outro__title
							">
								{ __( 'Connect Analytics with AdSense to create a powerful team that shows robust metrics for your site.', 'google-site-kit' ) }
							</h3>
							<div className="googlesitekit-module-outro__button">
								<Button href={ accountURL } target="_blank">
									{ __( 'Connect Accounts', 'google-site-kit' ) }
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}
}

export default AdSenseDashboardOutro;
