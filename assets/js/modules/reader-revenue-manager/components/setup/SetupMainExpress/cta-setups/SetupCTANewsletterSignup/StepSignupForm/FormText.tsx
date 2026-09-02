/**
 * Reader Revenue Manager newsletter signup form text section.
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
import { TextField } from 'googlesitekit-components';
import useFormValue from '@/js/hooks/useFormValue';
import {
	NEWSLETTER_SIGNUP_FORM,
	NEWSLETTER_SIGNUP_LIMITS,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTANewsletterSignup/constants';
import FormSection from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/FormSection';
import { EXPRESS_SETUP_CTA_FORMS } from '@/js/modules/reader-revenue-manager/datastore/constants';

const FormText: FC = () => {
	const [ ctaTitle, setCTATitle ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CTA_TITLE
	);
	const [ ctaBody, setCTABody ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CTA_BODY
	);

	const onCTATitleChange = useCallback(
		( { currentTarget }: ChangeEvent< HTMLInputElement > ) => {
			setCTATitle( currentTarget.value );
		},
		[ setCTATitle ]
	);

	const onCTABodyChange = useCallback(
		( { currentTarget }: ChangeEvent< HTMLInputElement > ) => {
			setCTABody( currentTarget.value );
		},
		[ setCTABody ]
	);

	return (
		<FormSection
			title={ __( 'Newsletter sign-up form text', 'google-site-kit' ) }
		>
			<div className="googlesitekit-rrm-express-setup-step__form-controls">
				<div className="googlesitekit-rrm-express-setup-step__form-input">
					<TextField
						label={ __( 'Header (optional)', 'google-site-kit' ) }
						maxLength={ NEWSLETTER_SIGNUP_LIMITS.CTA_TITLE }
						name={ NEWSLETTER_SIGNUP_FORM.CTA_TITLE }
						onChange={ onCTATitleChange }
						value={ ctaTitle || '' }
						outlined
						showCharacterCounter
					/>
				</div>
				<div className="googlesitekit-rrm-express-setup-step__form-input">
					<TextField
						inputType="textarea"
						label={ __( 'Body (optional)', 'google-site-kit' ) }
						maxLength={ NEWSLETTER_SIGNUP_LIMITS.CTA_BODY }
						name={ NEWSLETTER_SIGNUP_FORM.CTA_BODY }
						onChange={ onCTABodyChange }
						value={ ctaBody || '' }
						outlined
						showCharacterCounter
						textarea
					/>
				</div>
			</div>
		</FormSection>
	);
};

export default FormText;
