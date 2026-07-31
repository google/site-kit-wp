/**
 * Reader Revenue Manager Newsletter CTA preview - disclaimer text.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { __ } from '@wordpress/i18n';

export default function DisclaimerText() {
	return (
		<p className="googlesitekit-rrm-newsletter-preview__disclaimer">
			{ __(
				'By continuing, you agree to provide your email and name (if applicable) to ',
				'google-site-kit'
			) }
			<em>{ __( 'YourSite', 'google-site-kit' ) }</em>
			{ __(
				' Test Publication through a Google service. Google delivers your information under its ',
				'google-site-kit'
			) }
			<span className="googlesitekit-rrm-newsletter-preview__link">
				{ __( 'Terms of Service', 'google-site-kit' ) }
			</span>{ ' ' }
			{ __( 'and', 'google-site-kit' ) }{ ' ' }
			<span className="googlesitekit-rrm-newsletter-preview__link">
				{ __( 'Privacy Policy', 'google-site-kit' ) }
			</span>
			{ '. ' }
			<em>{ __( 'YourSite', 'google-site-kit' ) }</em>
			{ __(
				" Test Publication's use of your data is subject to their own ",
				'google-site-kit'
			) }
			<span className="googlesitekit-rrm-newsletter-preview__link">
				{ __( 'terms', 'google-site-kit' ) }
			</span>{ ' ' }
			{ __( 'and', 'google-site-kit' ) }{ ' ' }
			<span className="googlesitekit-rrm-newsletter-preview__link">
				{ __( 'privacy policy', 'google-site-kit' ) }
			</span>
			.
		</p>
	);
}
