/**
 * Header component for SetupUsingProxyWithSignIn.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */

// Rename Header to avoid conflict with the Header component in the setup folder.
import Header from '../../Header';
import HelpMenu from '../../help/HelpMenu';
import BannerNotification from '../../notifications/BannerNotification';

export default function SetupHeader() {
	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>
			{ getQueryArg( location.href, 'notification' ) ===
				'reset_success' && (
				<BannerNotification
					id="reset_success"
					title={ __(
						'Site Kit by Google was successfully reset.',
						'google-site-kit'
					) }
					isDismissible={ false }
				/>
			) }
		</Fragment>
	);
}
