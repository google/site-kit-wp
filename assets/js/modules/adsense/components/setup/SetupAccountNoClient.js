/**
 * AdSense Setup Account No Client component.
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
import SupportLink from '../../../../components/SupportLink';
import { ErrorNotices } from '../common';

export default function SetupAccountNoClient() {
	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ __(
					'Looks like you have an AdMob account',
					'google-site-kit'
				) }
			</h3>

			<ErrorNotices />

			<p>
				{ __(
					'To start using AdSense, you need to update your account so that you can connect your site to AdSense.',
					'google-site-kit'
				) }
			</p>

			<div className="googlesitekit-setup-module__action">
				<SupportLink
					path="/adsense/answer/6023158"
					external
					aria-label={ __(
						'Learn more about updating your AdSense account',
						'google-site-kit'
					) }
				>
					{ __( 'Learn more', 'google-site-kit' ) }
				</SupportLink>
			</div>
		</Fragment>
	);
}
