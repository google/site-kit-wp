/**
 * Reader Revenue Manager express setup publication policies step.
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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton, TextField } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import DocumentationLink from '@/js/components/DocumentationLink';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import { SIZE_MEDIUM, TYPE_LABEL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import ProgressBar from '@/js/googlesitekit/components-gm2/ProgressBar';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useFormValue from '@/js/hooks/useFormValue';
import { ExpressSetupStepHeadline } from '@/js/modules/reader-revenue-manager/components/common';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_POLICIES_FORM,
	READER_REVENUE_MANAGER_SETUP_FORM,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';

function isValidPolicyURL( value: string ) {
	try {
		return [ 'http:', 'https:' ].includes( new URL( value ).protocol );
	} catch {
		return false;
	}
}

interface StepPublicationPoliciesProps {
	description?: string;
	onComplete: () => void;
}

const StepPublicationPolicies: FC< StepPublicationPoliciesProps > = ( {
	description,
	onComplete,
} ) => {
	const [ isSaving, setIsSaving ] = useState( false );

	const defaultDescription = __(
		'To use Reader Revenue Manager, you will need to add links to your publication’s policies.',
		'google-site-kit'
	);

	const descriptionWithLink = createInterpolateElement(
		sprintf(
			/* translators: %s: Connect publication setup step description. */
			__( '%s <a>Learn more</a>', 'google-site-kit' ),
			description || defaultDescription
		),
		{
			a: <DocumentationLink slug="rrm-publication" external />,
		}
	);

	const { updatePublication } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const defaultPrivacyPolicyURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getPrivacyPolicyURL(),
		[]
	);

	const hasResolvedPublication: boolean = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).hasFinishedResolution(
				'getPublication',
				[]
			),
		[]
	);

	const publication: Publication | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublication(),
		[]
	);

	const [ privacyPolicyURL = defaultPrivacyPolicyURL, setPrivacyPolicyURL ] =
		useFormValue< string >(
			READER_REVENUE_MANAGER_SETUP_FORM,
			PUBLICATION_POLICIES_FORM.PRIVACY_POLICY_URL
		);

	const [ termsOfServiceURL, setTermsOfServiceURL ] = useFormValue< string >(
		READER_REVENUE_MANAGER_SETUP_FORM,
		PUBLICATION_POLICIES_FORM.TERMS_OF_SERVICE_URL
	);

	const isTermsOfServiceURLValid =
		termsOfServiceURL && isValidPolicyURL( termsOfServiceURL );

	const isPrivacyPolicyURLValid =
		privacyPolicyURL && isValidPolicyURL( privacyPolicyURL );

	const isDisabled =
		isSaving || ! isPrivacyPolicyURLValid || ! isTermsOfServiceURLValid;

	const onSubmit = useCallback(
		async ( event ) => {
			event.preventDefault();

			if ( ! publication ) {
				return;
			}

			setIsSaving( true );

			const { error } = await updatePublication( {
				/* eslint-disable sitekit/acronym-case */
				data: {
					publicationTosUrl: termsOfServiceURL,
					publicationPrivacyPolicyUrl: privacyPolicyURL,
				},
				/* eslint-enable sitekit/acronym-case */
			} );

			if ( error ) {
				setIsSaving( false );
				return;
			}

			onComplete();
		},
		[
			onComplete,
			privacyPolicyURL,
			publication,
			termsOfServiceURL,
			updatePublication,
		]
	);

	useEffect( () => {
		/* eslint-disable sitekit/acronym-case */
		if ( publication ) {
			if ( publication.publicationPrivacyPolicyUrl ) {
				setPrivacyPolicyURL( publication.publicationPrivacyPolicyUrl );
			}

			if ( publication.publicationTosUrl ) {
				setTermsOfServiceURL( publication.publicationTosUrl );
			}
		}
		/* eslint-enable sitekit/acronym-case */
	}, [ publication, setPrivacyPolicyURL, setTermsOfServiceURL ] );

	if ( ! hasResolvedPublication ) {
		return <ProgressBar />;
	}

	return (
		<div className="googlesitekit-rrm-express-setup-step">
			<form
				className="googlesitekit-rrm-express-setup-step__form"
				onSubmit={ onSubmit }
			>
				<div className="googlesitekit-rrm-express-setup-step__form-content">
					<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
						{ __( 'Publication policies', 'google-site-kit' ) }
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
						{ descriptionWithLink }
					</P>

					<div className="googlesitekit-rrm-express-setup-step__form-controls googlesitekit-rrm-express-setup-step__form-controls--policies">
						<div>
							<P
								className="googlesitekit-rrm-express-setup-step__label"
								size={ SIZE_MEDIUM }
								type={ TYPE_LABEL }
							>
								{ __(
									'Add your site’s terms of service link:',
									'google-site-kit'
								) }
							</P>

							<TextField
								errorMessage={
									termsOfServiceURL &&
									! isTermsOfServiceURLValid
										? __(
												"Please enter a URL beginning with 'http://' or 'https://'.",
												'google-site-kit'
										  )
										: undefined
								}
								label={ __(
									'Terms of service',
									'google-site-kit'
								) }
								onChange={ ( event ) =>
									setTermsOfServiceURL( event.target.value )
								}
								value={ termsOfServiceURL }
								outlined
							/>
						</div>

						<div>
							<P
								className="googlesitekit-rrm-express-setup-step__label"
								size={ SIZE_MEDIUM }
								type={ TYPE_LABEL }
							>
								{ __(
									'Add your site’s privacy policy link:',
									'google-site-kit'
								) }
							</P>

							<TextField
								errorMessage={
									privacyPolicyURL &&
									! isPrivacyPolicyURLValid
										? __(
												"Please enter a URL beginning with 'http://' or 'https://'.",
												'google-site-kit'
										  )
										: undefined
								}
								label={ __(
									'Privacy policy',
									'google-site-kit'
								) }
								onChange={ ( event ) =>
									setPrivacyPolicyURL( event.target.value )
								}
								value={ privacyPolicyURL }
								outlined
							/>
						</div>
					</div>
				</div>

				{ /* @ts-expect-error `SpinnerButton` component is not yet typed. */ }
				<SpinnerButton disabled={ isDisabled } isSaving={ isSaving }>
					{ __( 'Submit policies', 'google-site-kit' ) }
				</SpinnerButton>
			</form>
		</div>
	);
};

export default StepPublicationPolicies;
