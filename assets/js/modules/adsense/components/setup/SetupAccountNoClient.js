/**
 * AdSense Setup Account No Client component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Link from '../../../../components/Link';
import { sanitizeHTML } from '../../../../util/sanitize';
import { ErrorNotices } from '../common';

export default function SetupAccountNoClient() {
	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ __( 'Looks like you have an AdMob account', 'google-site-kit' ) }
			</h3>

			<ErrorNotices />

			<p>
				{ __( 'To start using AdSense, you need to update your account so that you can connect your site to AdSense.', 'google-site-kit' ) }
			</p>

			<div className="googlesitekit-setup-module__action">
				<Link
					href="https://support.google.com/adsense/answer/6023158"
					external
					dangerouslySetInnerHTML={ sanitizeHTML(
						__( 'Learn more<span class="screen-reader-text"> about updating your AdSense account</span>', 'google-site-kit' ),
						{
							ALLOWED_TAGS: [ 'span' ],
							ALLOWED_ATTR: [ 'class' ],
						}
					) }
				/>
			</div>
		</Fragment>
	);
}
