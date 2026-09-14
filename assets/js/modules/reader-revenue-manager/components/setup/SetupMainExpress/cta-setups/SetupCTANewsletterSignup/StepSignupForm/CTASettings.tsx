/**
 * Reader Revenue Manager newsletter signup CTA settings section.
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
import { ChangeEvent, FC, useCallback } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Checkbox, TextField } from 'googlesitekit-components';
import useFormValue from '@/js/hooks/useFormValue';
import {
	NEWSLETTER_SIGNUP_FORM,
	NEWSLETTER_SIGNUP_LIMITS,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTANewsletterSignup/constants';
import CTASettingsFormSection from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/CTASettingsFormSection';
import { EXPRESS_SETUP_CTA_FORMS } from '@/js/modules/reader-revenue-manager/datastore/constants';

const CTASettings: FC = () => {
	const [ nameRequired, setNameRequired ] = useFormValue< boolean >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.NAME_REQUIRED
	);
	const [ consentEnabled, setConsentEnabled ] = useFormValue< boolean >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CONSENT_ENABLED
	);
	const [ consentText, setConsentText ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CONSENT_TEXT
	);

	const onNameRequiredChange = useCallback(
		( { currentTarget }: ChangeEvent< HTMLInputElement > ) => {
			setNameRequired( currentTarget.checked );
		},
		[ setNameRequired ]
	);

	const onConsentEnabledChange = useCallback(
		( { currentTarget }: ChangeEvent< HTMLInputElement > ) => {
			setConsentEnabled( currentTarget.checked );
		},
		[ setConsentEnabled ]
	);

	const onConsentTextChange = useCallback(
		( { currentTarget }: ChangeEvent< HTMLInputElement > ) => {
			setConsentText( currentTarget.value );
		},
		[ setConsentText ]
	);

	return (
		<CTASettingsFormSection
			note={ __(
				'You can always change your sign-up form settings in Publisher center',
				'google-site-kit'
			) }
		>
			<div className="googlesitekit-rrm-newsletter-signup-setup__checkboxes">
				<div className="googlesitekit-rrm-express-setup-step__form-input">
					<Checkbox
						checked={ !! nameRequired }
						id="googlesitekit-rrm-newsletter-signup-name-required"
						name={ NEWSLETTER_SIGNUP_FORM.NAME_REQUIRED }
						onChange={ onNameRequiredChange }
						value="1"
					>
						{ __(
							'Require name before signing up',
							'google-site-kit'
						) }
					</Checkbox>
				</div>
				<div className="googlesitekit-rrm-express-setup-step__form-input">
					<Checkbox
						checked={ !! consentEnabled }
						id="googlesitekit-rrm-newsletter-signup-consent-enabled"
						name={ NEWSLETTER_SIGNUP_FORM.CONSENT_ENABLED }
						onChange={ onConsentEnabledChange }
						value="1"
					>
						{ __(
							'Require consent before signing up',
							'google-site-kit'
						) }
					</Checkbox>
				</div>
			</div>
			{ consentEnabled && (
				<div className="googlesitekit-rrm-express-setup-step__form-input">
					<TextField
						label={ __( 'Reader consent text', 'google-site-kit' ) }
						maxLength={ NEWSLETTER_SIGNUP_LIMITS.CONSENT_TEXT }
						name={ NEWSLETTER_SIGNUP_FORM.CONSENT_TEXT }
						onChange={ onConsentTextChange }
						value={ consentText || '' }
						outlined
						showCharacterCounter
					/>
				</div>
			) }
		</CTASettingsFormSection>
	);
};

export default CTASettings;
