/**
 * AdSenseInProcessStatus component.
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
import Link from 'GoogleComponents/link';
import Error from 'GoogleComponents/notifications/error';
import ProgressBar from 'GoogleComponents/progress-bar';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

class AdSenseInProcessStatus extends Component {
	render() {
		const {
			ctaLink,
			ctaLinkText,
			header,
			incomplete,
			loadingMessage,
			subHeader,
			required,
		} = this.props;
		const siteURL = new URL( googlesitekit.admin.siteURL );
		const adsenseURL = `https://www.google.com/adsense/new/sites?url=${ siteURL.hostname }&source=site-kit`;
		const actionableItems = [
			{
				id: 1,

				/* translators: %s: Site URL */
				text: sprintf( __( 'Added your site %s in ', 'google-site-kit' ), siteURL.hostname ),
				linkText: __( 'Sites', 'google-site-kit' ),
				linkURL: adsenseURL,
			},
			{
				id: 2,
				text: __( 'Enabled ads in', 'google-site-kit' ),
				linkText: __( 'Ads', 'google-site-kit' ),
				linkURL: 'https://www.google.com/adsense/new/myads/auto-ads',
			},
		];

		return (
			<div className="googlesitekit-setup-module
				googlesitekit-setup-module--adsense">
				{ required && <Error /> }

				{ loadingMessage && (
					<Fragment>
						{ loadingMessage }
						<ProgressBar />
					</Fragment>
				) }

				{ header && (
					<h3 className="
						googlesitekit-heading-4
						googlesitekit-setup-module__title
					">
						{ header }
					</h3> ) }
				{ subHeader && <p>{ subHeader }</p> }

				{ incomplete && (
					<div className="googlesitekit-setup-module__list-wrapper">
						<ol className="googlesitekit-setup-module__list">
							{ actionableItems.map( ( item ) => (
								<li
									className="googlesitekit-setup-module__list-item"
									key={ item.id }
								>
									{ item.text } <Link href={ item.linkURL } external inherit>
										{ item.linkText }
									</Link>
								</li>
							) ) }
						</ol>
					</div>
				) }

				{ ctaLink && ctaLinkText && (
					<div className="googlesitekit-setup-module__cta">
						<Link
							className="googlesitekit-setup-module__cta-link"
							href={ ctaLink }
							external
						>
							{ ctaLinkText }
						</Link>
					</div>
				) }
			</div>
		);
	}
}

export default AdSenseInProcessStatus;
