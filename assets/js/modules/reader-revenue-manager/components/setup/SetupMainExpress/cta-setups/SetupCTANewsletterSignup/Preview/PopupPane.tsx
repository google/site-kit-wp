/**
 * Reader Revenue Manager Newsletter CTA preview - Popup pane.
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

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import DisclaimerText from './DisclaimerText';

interface Props {
	ctaTitle?: string;
	ctaBody?: string;
	consentEnabled?: boolean;
	consentText?: string;
}

export default function PopupPane( {
	ctaTitle,
	ctaBody,
	consentEnabled,
	consentText,
}: Props ) {
	return (
		<div className="googlesitekit-rrm-newsletter-preview googlesitekit-rrm-newsletter-preview--popup">
			<Typography
				as="p"
				type="body"
				size="small"
				className="googlesitekit-rrm-newsletter-preview__publication-name"
			>
				{ __( 'Publication name', 'google-site-kit' ) }
			</Typography>
			{ ctaTitle && (
				<Typography
					as="h4"
					type="title"
					size="large"
					className="googlesitekit-rrm-newsletter-preview__title"
				>
					{ ctaTitle }
				</Typography>
			) }
			{ ctaBody && (
				<Typography
					as="p"
					type="label"
					size="small"
					className="googlesitekit-rrm-newsletter-preview__body"
				>
					{ ctaBody }
				</Typography>
			) }
			{ consentEnabled && (
				<div className="googlesitekit-rrm-newsletter-preview__consent">
					<input
						type="checkbox"
						className="googlesitekit-rrm-newsletter-preview__consent-checkbox"
						readOnly
						disabled
					/>
					<Typography
						as="span"
						type="body"
						size="small"
						className="googlesitekit-rrm-newsletter-preview__consent-text"
					>
						{ consentText ||
							__(
								'Your consent text will show here',
								'google-site-kit'
							) }
					</Typography>
				</div>
			) }
			<DisclaimerText />
			<div className="googlesitekit-rrm-newsletter-preview__actions">
				<button
					className="googlesitekit-rrm-newsletter-preview__button"
					disabled
				>
					{ __( 'Continue with email', 'google-site-kit' ) }
				</button>
				<Typography
					as="p"
					type="body"
					size="small"
					className="googlesitekit-rrm-newsletter-preview__or"
				>
					{ __( 'or', 'google-site-kit' ) }
				</Typography>
				<button
					className="googlesitekit-rrm-newsletter-preview__button"
					disabled
				>
					{ __( 'Continue with Google', 'google-site-kit' ) }
				</button>
			</div>
		</div>
	);
}
