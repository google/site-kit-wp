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
import PropTypes from 'prop-types';
import Link from 'GoogleComponents/link';
import Error from 'GoogleComponents/notifications/error';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

class AdSenseInProcessStatus extends Component {
	render() {
		const { status } = this.props;
		const { siteURL } = googlesitekit.admin;
		const siteURLURL = new URL( siteURL );
		const adsenseURL = `https://www.google.com/adsense/new/sites?url=${ siteURLURL.hostname }&source=site-kit`;
		const actionableItems = [
			{
				id: 1,

				/* translators: %s: Site URL */
				text: sprintf( __( 'Added your site %s in ', 'google-site-kit' ), siteURLURL.hostname ),
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

		const headerList = {
			incomplete: __( 'We’re getting your site ready for ads', 'google-site-kit' ),
			requiredAction: __( 'Your site isn’t ready to show ads yet', 'google-site-kit' ),
			adsDisplayPending: __( 'We’re getting your site ready for ads', 'google-site-kit' ),
		};

		const subHeaderList = {
			incomplete: __(
				'AdSense is reviewing your site. Meanwhile, make sure you’ve completed these steps in AdSense.',
				'google-site-kit'
			),
			requiredAction: __(
				'You need to fix some things before we can connect Site Kit to your AdSense account.',
				'google-site-kit'
			),
			adsDisplayPending: __(
				'This usually takes less than a day, but it can sometimes take a bit longer. We’ll let you know when everything’s ready.',
				'google-site-kit'
			),
		};

		const header = (
			<h3 className="
				googlesitekit-heading-4
				googlesitekit-setup-module__title
			">
				{ headerList[ status ] }
			</h3>
		);

		const subHeader = (
			<p>
				{ subHeaderList[ status ] }
			</p>
		);

		const actionList = 'incomplete' === status && (
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
		);

		const ctaList = {
			incomplete: null,

			requiredAction: (
				<Link className="googlesitekit-setup-module__cta-link" href={ adsenseURL } external>
					{ __( 'Go to AdSense to find out how to fix the issue', 'google-site-kit' ) }
				</Link>
			),

			adsDisplayPending: (
				<Link className="googlesitekit-setup-module__cta-link" href={ adsenseURL } external>
					{ __( 'Go to your AdSense account to check on your site’s status', 'google-site-kit' ) }
				</Link>
			),
		};

		const cta = (
			<div className="googlesitekit-setup-module__cta">
				{ ctaList[ status ] }
			</div>
		);

		return (
			<div className="googlesitekit-setup-module
				googlesitekit-setup-module--adsense">
				{ 'required' === status && (
					<Error />
				) }

				{ header }
				{ subHeader }

				{ actionList }
				{ cta }
			</div>
		);
	}
}

AdSenseInProcessStatus.propTypes = {
	status: PropTypes.string,
	module: PropTypes.string,
};

export default AdSenseInProcessStatus;
