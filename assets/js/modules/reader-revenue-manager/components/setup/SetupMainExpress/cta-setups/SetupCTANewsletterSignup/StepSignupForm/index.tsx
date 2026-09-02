/**
 * Reader Revenue Manager newsletter signup form step.
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
import { FC, FormEvent, useMemo, useState } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import DocumentationLink from '@/js/components/DocumentationLink';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import useFormValue from '@/js/hooks/useFormValue';
import { ExpressSetupStepHeadline } from '@/js/modules/reader-revenue-manager/components/common';
import { NEWSLETTER_SIGNUP_FORM } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTANewsletterSignup/constants';
import Preview from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTANewsletterSignup/Preview';
import CTAsPlacementFormSection from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/CTAsPlacementFormSection';
import { useStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_CTA_FORMS,
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CTA_TYPES } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import CTASettings from './CTASettings';
import FormText from './FormText';
import GeneralDetails from './GeneralDetails';

const StepSignupForm: FC = () => {
	const [ , setStep ] = useStep();
	const [ isPublishing, setIsPublishing ] = useState( false );

	const { createCTA, submitChanges } = useDispatch(
		MODULES_READER_REVENUE_MANAGER
	);

	const [ displayName ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME
	);
	const [ ctaTitle ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CTA_TITLE
	);
	const [ ctaBody ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CTA_BODY
	);
	const [ nameRequired ] = useFormValue< boolean >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.NAME_REQUIRED
	);
	const [ consentEnabled ] = useFormValue< boolean >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CONSENT_ENABLED
	);
	const [ consentText ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CONSENT_TEXT
	);

	const createCTAParams = useMemo( () => {
		const trimmedTitle = ( ctaTitle || '' ).trim();
		const trimmedBody = ( ctaBody || '' ).trim();
		const trimmedConsentText = ( consentText || '' ).trim();

		const config = {
			...( trimmedTitle && { title: trimmedTitle } ),
			...( trimmedBody && { customMessage: trimmedBody } ),
			nameRequired: !! nameRequired,
			...( consentEnabled &&
				trimmedConsentText && {
					customConsentText: trimmedConsentText,
				} ),
		};

		return {
			data: {
				displayName: ( displayName || '' ).trim(),
				type: CTA_TYPES.NEWSLETTER_SIGNUP,
				config,
			},
		};
	}, [
		consentEnabled,
		consentText,
		ctaBody,
		ctaTitle,
		displayName,
		nameRequired,
	] );

	const isDoingSubmitChanges = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).isDoingSubmitChanges(),
		[]
	);

	const isFetchingCreateCTA = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).isFetchingCreateCTA(
				createCTAParams
			),
		[ createCTAParams ]
	);

	const publishChanges = useCallback( async () => {
		setIsPublishing( true );

		const { error: submitError } = await submitChanges();

		if ( submitError ) {
			setIsPublishing( false );
			return;
		}

		const { error: createError } = await createCTA( createCTAParams );

		if ( createError ) {
			setIsPublishing( false );
			return;
		}

		setIsPublishing( false );
		setStep( EXPRESS_SETUP_STEPS.SETUP_COMPLETE );
	}, [ createCTA, createCTAParams, setStep, submitChanges ] );

	const onSubmit = useCallback(
		async ( event: FormEvent< HTMLFormElement > ) => {
			event.preventDefault();
			await publishChanges();
		},
		[ publishChanges ]
	);

	const description = createInterpolateElement(
		__(
			'Set up your form to start capturing reader emails for your mailing list. <a>Learn more</a>',
			'google-site-kit'
		),
		{
			a: <DocumentationLink slug="rrm-newsletter-signup" />,
		}
	);

	const isSaving =
		isPublishing || isDoingSubmitChanges || isFetchingCreateCTA;

	const isPublishDisabled =
		! ( displayName || '' ).trim() ||
		( !! consentEnabled && ! ( consentText || '' ).trim() ) ||
		isSaving;

	return (
		<div className="googlesitekit-rrm-express-setup-step googlesitekit-rrm-express-setup-step--cta-setup googlesitekit-rrm-newsletter-signup-setup">
			<form
				className="googlesitekit-rrm-express-setup-step__form"
				onSubmit={ onSubmit }
			>
				<div className="googlesitekit-rrm-express-setup-step__form-content">
					<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
						{ __( 'Set up your sign-up form', 'google-site-kit' ) }
					</ExpressSetupStepHeadline>

					<StoreErrorNotices
						moduleSlug={ MODULE_SLUG_READER_REVENUE_MANAGER }
						storeName={ MODULES_READER_REVENUE_MANAGER }
						hasButton
					/>

					<P
						className="googlesitekit-rrm-express-setup-step__description"
						size={ SIZE_MEDIUM }
					>
						{ description }
					</P>

					<div className="googlesitekit-rrm-express-setup-step__cta-setup-columns">
						<div className="googlesitekit-rrm-express-setup-step__cta-setup-fields">
							<div className="googlesitekit-rrm-express-setup-step__cta-setup-fields-primary">
								<GeneralDetails />
								<FormText />
							</div>
							<div className="googlesitekit-rrm-express-setup-step__cta-setup-fields-secondary">
								<CTAsPlacementFormSection />
								<CTASettings />
							</div>
						</div>

						<Preview />
					</div>
				</div>
				{ /* @ts-expect-error - The `SpinnerButton` component is not typed yet. */ }
				<SpinnerButton
					disabled={ isPublishDisabled }
					isSaving={ isSaving }
					type="submit"
				>
					{ __( 'Publish to your site', 'google-site-kit' ) }
				</SpinnerButton>
			</form>
		</div>
	);
};

export default StepSignupForm;
