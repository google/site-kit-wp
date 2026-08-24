/**
 * Reader Revenue Manager connect publication component.
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
import { FC, Fragment, useEffect } from 'react';

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
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import useQueryArg from '@/js/hooks/useQueryArg';
import PublicationSelect from '@/js/modules/reader-revenue-manager/components/common/PublicationSelect';
import PublicationSetupDetails from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepPublicationSetup/PublicationSetupDetails';
import PublicationSetupErrorNotice from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepPublicationSetup/PublicationSetupErrorNotice';
import PublicationSetupHeadline from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepPublicationSetup/PublicationSetupHeadline';
import {
	EXPRESS_SETUP_CTAS,
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { type Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import { languageCodeFormat, regionCodeFormat } from '@/js/util/i18n';

function getDescription( ctaType: string | undefined ) {
	switch ( ctaType ) {
		case EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP: {
			return __(
				'To set up a newsletter sign-up form using Reader Revenue Manager, connect your publication or create a new one. <a>Learn more</a>',
				'google-site-kit'
			);
		}
		default: {
			return __(
				'To use Reader Revenue Manager, connect your publication or create a new one. <a>Learn more</a>',
				'google-site-kit'
			);
		}
	}
}

const ConnectPublication: FC = () => {
	const { findMatchedPublication, selectPublication, submitChanges } =
		useDispatch( MODULES_READER_REVENUE_MANAGER );

	const [ cta ] = useQueryArg( 'cta', 'default' );
	const [ , setStep ] = useQueryArg( 'step' );

	const canSubmitChanges = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).canSubmitChanges(),
		[]
	);

	const hasResolvedSettings = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).hasFinishedResolution(
				'getSettings'
			),
		[]
	);

	const isDoingSubmitChanges = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).isDoingSubmitChanges(),
		[]
	);

	const publicationID: string | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublicationID(),
		[]
	);

	const publication: Publication | undefined = useSelect(
		( select: Select ) =>
			publicationID
				? select( MODULES_READER_REVENUE_MANAGER ).getPublication( {
						publicationID,
				  } )
				: undefined,
		[ publicationID ]
	);

	const submitChangesError = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getErrorForAction(
				'submitChanges'
			),
		[]
	);

	const connectPublication = useCallback( async () => {
		const { error } = await submitChanges();

		if ( ! error ) {
			const nextStep = publication?.rrmProduct?.tosAcceptance
				?.userAccepted
				? EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES
				: EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE;

			setStep( nextStep );
		}
	}, [ publication, setStep, submitChanges ] );

	const onSubmit = useCallback(
		( event ) => {
			event.preventDefault();
			connectPublication();
		},
		[ connectPublication ]
	);

	const languageCode = publication?.languageCode
		? languageCodeFormat( publication.languageCode )
		: __( 'Unknown', 'google-site-kit' );

	const regionCode = publication?.regionCode
		? regionCodeFormat( publication.regionCode )
		: __( 'Unknown', 'google-site-kit' );

	useEffect( () => {
		if ( hasResolvedSettings && ! publicationID ) {
			( async () => {
				const matchedPublication = await findMatchedPublication();

				if ( matchedPublication ) {
					selectPublication( matchedPublication );
				}
			} )();
		}
	}, [
		findMatchedPublication,
		hasResolvedSettings,
		publicationID,
		selectPublication,
	] );

	return (
		<form
			className="googlesitekit-rrm-publication-setup__form"
			onSubmit={ onSubmit }
		>
			<div className="googlesitekit-rrm-publication-setup__form-content">
				<PublicationSetupHeadline>
					{ __( 'Connect your publication', 'google-site-kit' ) }
				</PublicationSetupHeadline>

				{ submitChangesError ? (
					<PublicationSetupErrorNotice
						error={ submitChangesError }
						onRetry={
							canSubmitChanges ? connectPublication : undefined
						}
						title={ __(
							'Connecting your publication failed',
							'google-site-kit'
						) }
					/>
				) : null }

				<P
					className="googlesitekit-rrm-publication-setup__description"
					size={ SIZE_MEDIUM }
				>
					{ createInterpolateElement( getDescription( cta ), {
						a: (
							<DocumentationLink
								slug="rrm-publication"
								external
							/>
						),
					} ) }
				</P>

				<div className="googlesitekit-rrm-publication-setup__form-controls">
					<PublicationSelect />

					{ publication ? (
						<PublicationSetupDetails>
							{ ( Item ) => (
								<Fragment>
									<Item
										description={ languageCode }
										term={ __(
											'Primary language',
											'google-site-kit'
										) }
									/>
									<Item
										description={ regionCode }
										term={ __(
											'Home country',
											'google-site-kit'
										) }
									/>
								</Fragment>
							) }
						</PublicationSetupDetails>
					) : null }
				</div>
			</div>
			{ /* @ts-expect-error - The `SpinnerButton` component is not typed yet. */ }
			<SpinnerButton
				disabled={ ! canSubmitChanges }
				isSaving={ isDoingSubmitChanges }
				type="submit"
			>
				{ __( 'Connect existing publication', 'google-site-kit' ) }
			</SpinnerButton>
		</form>
	);
};

export default ConnectPublication;
