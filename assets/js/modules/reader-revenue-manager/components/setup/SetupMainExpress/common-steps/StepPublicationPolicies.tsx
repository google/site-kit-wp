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
import classnames from 'classnames';
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import {
	createElement,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton, TextField } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

interface PublicationPolicyURLs {
	[ key: string ]: string | undefined;
}

const PUBLICATION_TOS_URL_KEY = 'publicationTosUrl';
const PUBLICATION_PRIVACY_POLICY_URL_KEY = 'publicationPrivacyPolicyUrl';

function isValidPolicyURL( value: string ) {
	if ( ! value ) {
		return false;
	}

	try {
		const parsedURL = new URL( value );

		return [ 'http:', 'https:' ].includes( parsedURL.protocol );
	} catch {
		return false;
	}
}

const FIELD_ERROR_MESSAGE = __( 'A valid link is required', 'google-site-kit' );

interface StepPublicationPoliciesProps {
	onSetStep: ( step: string ) => void;
	nextStep?: string;
}

const StepPublicationPolicies: FC< StepPublicationPoliciesProps > = ( {
	onSetStep,
	nextStep = EXPRESS_SETUP_STEPS.SETUP_CTA,
} ) => {
	const [ termsOfServiceURL, setTermsOfServiceURL ] = useState( '' );
	const [ privacyPolicyURL, setPrivacyPolicyURL ] = useState(
		global._googlesitekitBaseData.wpPrivacyURL || ''
	);
	const [ termsOfServiceTouched, setTermsOfServiceTouched ] =
		useState( false );
	const [ privacyPolicyTouched, setPrivacyPolicyTouched ] = useState( false );
	const [ didAttemptSubmit, setDidAttemptSubmit ] = useState( false );
	const [ showSubmissionFieldError, setShowSubmissionFieldError ] =
		useState( false );
	const [ submitError, setSubmitError ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );

	const documentationLinkURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL(
				'rrm-publication-policies'
			),
		[]
	);

	const publicationID = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublicationID(),
		[]
	);

	const organizationID = useSelect( ( select: Select ) => {
		const store = select( MODULES_READER_REVENUE_MANAGER );

		if ( typeof store.getOrganizationID === 'function' ) {
			return store.getOrganizationID();
		}

		return store.getSettings()?.organizationID;
	}, [] );

	const publication = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublication( {
				organizationID,
				publicationID,
			} ) as PublicationPolicyURLs | undefined,
		[ organizationID, publicationID ]
	);

	const { updatePublication } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	useEffect( () => {
		if ( ! publication ) {
			return;
		}

		if ( ! termsOfServiceTouched ) {
			setTermsOfServiceURL(
				publication[ PUBLICATION_TOS_URL_KEY ] || ''
			);
		}

		if ( ! privacyPolicyTouched ) {
			setPrivacyPolicyURL(
				publication[ PUBLICATION_PRIVACY_POLICY_URL_KEY ] ||
					global._googlesitekitBaseData.wpPrivacyURL ||
					''
			);
		}
	}, [ publication, privacyPolicyTouched, termsOfServiceTouched ] );

	const termsOfServiceValid = isValidPolicyURL( termsOfServiceURL );
	const privacyPolicyValid = isValidPolicyURL( privacyPolicyURL );

	const canSubmit = termsOfServiceValid && privacyPolicyValid;

	const showTermsError =
		showSubmissionFieldError ||
		( ( termsOfServiceTouched || didAttemptSubmit ) &&
			! termsOfServiceValid );

	const showPrivacyError =
		showSubmissionFieldError ||
		( ( privacyPolicyTouched || didAttemptSubmit ) &&
			! privacyPolicyValid );

	const submitPoliciesButton = createElement(
		SpinnerButton as unknown as (
			props: Record< string, unknown >
		) => JSX.Element,
		{
			disabled: ! canSubmit || isSaving,
			isSaving,
		},
		__( 'Submit policies', 'google-site-kit' )
	);

	const onChangeTermsOfServiceURL = useCallback( ( { currentTarget } ) => {
		setTermsOfServiceURL( currentTarget.value );
		setTermsOfServiceTouched( true );
		setSubmitError( '' );
		setShowSubmissionFieldError( false );
	}, [] );

	const onChangePrivacyPolicyURL = useCallback( ( { currentTarget } ) => {
		setPrivacyPolicyURL( currentTarget.value );
		setPrivacyPolicyTouched( true );
		setSubmitError( '' );
		setShowSubmissionFieldError( false );
	}, [] );

	const onSubmit = useCallback(
		async ( event ) => {
			event.preventDefault();
			setDidAttemptSubmit( true );
			setSubmitError( '' );

			if ( ! canSubmit ) {
				return;
			}

			setIsSaving( true );

			const { error } = await updatePublication( {
				organizationID,
				publicationID,
				data: {
					[ PUBLICATION_TOS_URL_KEY ]: termsOfServiceURL,
					[ PUBLICATION_PRIVACY_POLICY_URL_KEY ]: privacyPolicyURL,
				},
			} );

			setIsSaving( false );

			if ( error ) {
				setShowSubmissionFieldError( true );
				setSubmitError( error.message || FIELD_ERROR_MESSAGE );

				return;
			}

			setShowSubmissionFieldError( false );
			onSetStep( nextStep );
		},
		[
			canSubmit,
			nextStep,
			onSetStep,
			organizationID,
			privacyPolicyURL,
			publicationID,
			termsOfServiceURL,
			updatePublication,
		]
	);

	return (
		<div className="googlesitekit-rrm-publication-policies">
			<h2 className="googlesitekit-rrm-publication-policies__title">
				{ __( 'Publication policies', 'google-site-kit' ) }
			</h2>
			<p className="googlesitekit-rrm-publication-policies__description">
				{ __(
					'To set up a newsletter using Reader Revenue Manager, you will need to add links to your publication’s policies.',
					'google-site-kit'
				) }{ ' ' }
				<Link
					href={ documentationLinkURL }
					external
					hideExternalIndicator
				>
					{ __( 'Learn more', 'google-site-kit' ) }
				</Link>
			</p>

			{ !! submitError && (
				<Notice
					className="googlesitekit-rrm-publication-policies__notice"
					type={ NOTICE_TYPES.ERROR }
					description={ submitError }
				/>
			) }

			<form
				className="googlesitekit-rrm-publication-policies__form"
				onSubmit={ onSubmit }
			>
				<div className="googlesitekit-rrm-publication-policies__field">
					<p className="googlesitekit-rrm-publication-policies__field-label">
						{ __(
							'Add your site’s term’s of service link:',
							'google-site-kit'
						) }
					</p>
					<TextField
						label={ __( 'Terms of service', 'google-site-kit' ) }
						className={ classnames( {
							'mdc-text-field--error': showTermsError,
						} ) }
						helperText={
							showTermsError ? FIELD_ERROR_MESSAGE : undefined
						}
						inputType="url"
						value={ termsOfServiceURL }
						onChange={ onChangeTermsOfServiceURL }
						outlined
					/>
				</div>

				<div className="googlesitekit-rrm-publication-policies__field">
					<p className="googlesitekit-rrm-publication-policies__field-label">
						{ __(
							'Add your site’s privacy policy link:',
							'google-site-kit'
						) }
					</p>
					<TextField
						label={ __( 'Privacy policy', 'google-site-kit' ) }
						className={ classnames( {
							'mdc-text-field--error': showPrivacyError,
						} ) }
						helperText={
							showPrivacyError ? FIELD_ERROR_MESSAGE : undefined
						}
						inputType="url"
						value={ privacyPolicyURL }
						onChange={ onChangePrivacyPolicyURL }
						outlined
					/>
				</div>

				<div className="googlesitekit-rrm-publication-policies__actions">
					{ submitPoliciesButton }
				</div>
			</form>
		</div>
	);
};

export default StepPublicationPolicies;
