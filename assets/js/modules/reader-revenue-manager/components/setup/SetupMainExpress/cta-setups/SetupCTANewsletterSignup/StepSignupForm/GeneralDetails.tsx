/**
 * Reader Revenue Manager newsletter signup general details section.
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
import { useMount } from 'react-use';

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

const GeneralDetails: FC = () => {
	const [ displayName, setDisplayName ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME
	);

	const onDisplayNameChange = useCallback(
		( { currentTarget }: ChangeEvent< HTMLInputElement > ) => {
			setDisplayName( currentTarget.value );
		},
		[ setDisplayName ]
	);

	useMount( () => {
		if ( displayName === undefined ) {
			setDisplayName( __( 'Newsletter signup', 'google-site-kit' ) );
		}
	} );

	return (
		<FormSection title={ __( 'General details', 'google-site-kit' ) }>
			<div className="googlesitekit-rrm-express-setup-step__form-controls">
				<div className="googlesitekit-rrm-express-setup-step__form-input">
					<TextField
						helperText={ __(
							'(internal use only, not visible to readers)',
							'google-site-kit'
						) }
						label={ __( 'CTA name', 'google-site-kit' ) }
						maxLength={ NEWSLETTER_SIGNUP_LIMITS.DISPLAY_NAME }
						name={ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME }
						onChange={ onDisplayNameChange }
						value={ displayName || '' }
						outlined
						showCharacterCounter
					/>
				</div>
			</div>
		</FormSection>
	);
};

export default GeneralDetails;
