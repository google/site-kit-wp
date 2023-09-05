/**
 * AdSense Setup Account Pending component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../../../../components/Link';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { ErrorNotices } from '../common';
const { useSelect } = Data;

export default function SetupAccountPending() {
	const accountSiteURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceAccountManageSiteURL()
	);

	if ( ! accountSiteURL ) {
		return null;
	}

	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ __( 'Your account is getting ready', 'google-site-kit' ) }
			</h3>

			<ErrorNotices />

			<p>
				{ __(
					'Site Kit has placed AdSense code on every page across your site. After you’ve finished setting up your account, we’ll let you know when your site is ready to show ads. This usually takes less than a day, but it can sometimes take a bit longer.',
					'google-site-kit'
				) }
			</p>

			<div className="googlesitekit-setup-module__action">
				<Link href={ accountSiteURL } external>
					{ __(
						'Go to your AdSense account to check on your site’s status or to complete setting up',
						'google-site-kit'
					) }
				</Link>
			</div>
		</Fragment>
	);
}
