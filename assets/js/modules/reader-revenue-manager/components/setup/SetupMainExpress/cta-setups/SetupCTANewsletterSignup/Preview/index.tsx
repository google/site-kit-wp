/**
 * Reader Revenue Manager Newsletter CTA preview pane.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_SMALL,
	TYPE_LABEL,
	TYPE_TITLE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';

interface PreviewProps {
	consentEnabled?: boolean;
	consentText?: string;
	ctaBody?: string;
	ctaTitle?: string;
	publicationName?: string;
}

const Preview: FC< PreviewProps > = ( {
	consentEnabled,
	consentText,
	ctaBody,
	ctaTitle,
	publicationName,
} ) => {
	const instanceID = useInstanceId(
		Preview,
		'googlesitekit-rrm-cta-preview-pane'
	);

	return (
		<div className="googlesitekit-rrm-cta-preview-pane">
			<div className="googlesitekit-rrm-cta-preview-pane__header">
				<P
					className="googlesitekit-rrm-cta-preview-pane__publication"
					size={ SIZE_SMALL }
				>
					{ publicationName ||
						__( 'Publication name', 'google-site-kit' ) }
				</P>
				{ ctaTitle && (
					<Typography as="h4" size={ SIZE_LARGE } type={ TYPE_TITLE }>
						{ ctaTitle }
					</Typography>
				) }
				{ ctaBody && (
					<P size={ SIZE_SMALL } type={ TYPE_LABEL }>
						{ ctaBody }
					</P>
				) }
			</div>
			<div className="googlesitekit-rrm-cta-preview-pane__newsletter">
				{ consentEnabled && (
					<label
						className="googlesitekit-rrm-cta-preview-pane__newsletter-consent"
						htmlFor={ `${ instanceID }` }
					>
						<input
							className="googlesitekit-rrm-cta-preview-pane__checkbox"
							id={ `${ instanceID }` }
							name={ `${ instanceID }` }
							type="checkbox"
							disabled
							readOnly
						/>
						{ consentText ||
							__(
								'Your consent text will show here',
								'google-site-kit'
							) }
					</label>
				) }
				<div className="googlesitekit-rrm-cta-preview-pane__legal">
					{ createInterpolateElement(
						sprintf(
							/* translators: %1$s is the publication name. */
							__(
								'By continuing, you agree to provide your email and name (if applicable) to %1$s through a Google service. Google delivers your information under its <a>Terms of Service</a> and <a>Privacy Policy</a>. %1$s’s use of your data is subject to their own <a>terms</a> and <a>privacy policy</a>.',
								'google-site-kit'
							),
							publicationName ||
								__( 'Publication name', 'google-site-kit' )
						),
						{
							a: (
								<span className="googlesitekit-rrm-cta-preview-pane__link" />
							),
						}
					) }
				</div>
			</div>
			<div className="googlesitekit-rrm-cta-preview-pane__actions">
				<button
					className="googlesitekit-rrm-cta-preview-pane__button"
					type="button"
					disabled
				>
					{ __( 'Continue with email', 'google-site-kit' ) }
				</button>
				{ __( 'or', 'google-site-kit' ) }
				<button
					className="googlesitekit-rrm-cta-preview-pane__button"
					type="button"
					disabled
				>
					{ __( 'Continue with Google', 'google-site-kit' ) }
				</button>
			</div>
		</div>
	);
};

export default Preview;
