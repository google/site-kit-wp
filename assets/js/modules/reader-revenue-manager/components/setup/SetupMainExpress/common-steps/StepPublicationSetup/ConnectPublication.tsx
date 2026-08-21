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
import { FC, FormEvent, MouseEvent, useEffect } from 'react';

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
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import TroubleshootingLink from '@/js/components/TroubleshootingLink';
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_BODY,
	TYPE_HEADLINE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import {
	BREAKPOINT_DESKTOP,
	BREAKPOINT_XLARGE,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import useQueryArg from '@/js/hooks/useQueryArg';
import { PublicationSelect } from '@/js/modules/reader-revenue-manager/components/common';
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
	const breakpoint = useBreakpoint();

	const { findMatchedPublication, selectPublication, submitChanges } =
		useDispatch( MODULES_READER_REVENUE_MANAGER );

	const [ cta ] = useQueryArg( 'cta', 'default' );
	const [ , setStep ] = useQueryArg( 'step' );

	const canSubmitChanges = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).canSubmitChanges(),
		[]
	);

	const isDoingSubmitChanges = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).isDoingSubmitChanges(),
		[]
	);

	const publication = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublication() as
				| Publication
				| undefined,
		[]
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

	const onRetry = useCallback(
		( event: MouseEvent< HTMLButtonElement > ) => {
			event.preventDefault();
			connectPublication();
		},
		[ connectPublication ]
	);

	const onSubmit = useCallback(
		( event: FormEvent< HTMLFormElement > ) => {
			event.preventDefault();
			connectPublication();
		},
		[ connectPublication ]
	);

	const isDisabled =
		! canSubmitChanges || isDoingSubmitChanges || ! publication;

	useEffect( () => {
		if ( ! publication ) {
			( async () => {
				const matchedPublication = await findMatchedPublication();

				if ( matchedPublication ) {
					selectPublication( matchedPublication );
				}
			} )();
		}
	}, [ findMatchedPublication, publication, selectPublication ] );

	return (
		<form
			className="googlesitekit-rrm-publication-setup__form"
			onSubmit={ onSubmit }
		>
			<div className="googlesitekit-rrm-publication-setup__form-content">
				<Typography
					as="h1"
					className="googlesitekit-rrm-publication-setup__heading"
					size={
						breakpoint === BREAKPOINT_DESKTOP ||
						breakpoint === BREAKPOINT_XLARGE
							? SIZE_MEDIUM
							: SIZE_SMALL
					}
					type={ TYPE_HEADLINE }
				>
					{ __( 'Connect your publication', 'google-site-kit' ) }
				</Typography>

				{ submitChangesError ? (
					<Notice
						ctaButton={
							! isDisabled
								? {
										label: __( 'Retry', 'google-site-kit' ),
										onClick: onRetry,
								  }
								: undefined
						}
						description={ createInterpolateElement(
							__(
								'Try again or <a>get help</a>',
								'google-site-kit'
							),
							{
								a: (
									<TroubleshootingLink
										error={ submitChangesError }
									/>
								),
							}
						) }
						title={ __(
							'Connecting your publication failed',
							'google-site-kit'
						) }
						type={ NOTICE_TYPES.ERROR }
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

					{ publication && (
						<dl className="googlesitekit-rrm-publication-setup__details">
							{ publication.languageCode ? (
								<div className="googlesitekit-rrm-publication-setup__details-item">
									<Typography
										as="dt"
										className="googlesitekit-rrm-publication-setup__details-term"
										size={ SIZE_SMALL }
										type={ TYPE_BODY }
									>
										{ __(
											'Primary language',
											'google-site-kit'
										) }
									</Typography>
									<Typography
										as="dd"
										className="googlesitekit-rrm-publication-setup__details-description"
										size={ SIZE_MEDIUM }
										type={ TYPE_BODY }
									>
										{ languageCodeFormat(
											publication.languageCode
										) }
									</Typography>
								</div>
							) : null }
							{ publication.regionCode ? (
								<div className="googlesitekit-rrm-publication-setup__details-item">
									<Typography
										as="dt"
										className="googlesitekit-rrm-publication-setup__details-term"
										size={ SIZE_SMALL }
										type={ TYPE_BODY }
									>
										{ __(
											'Home country',
											'google-site-kit'
										) }
									</Typography>
									<Typography
										as="dd"
										className="googlesitekit-rrm-publication-setup__details-description"
										size={ SIZE_MEDIUM }
										type={ TYPE_BODY }
									>
										{ regionCodeFormat(
											publication.regionCode
										) }
									</Typography>
								</div>
							) : null }
						</dl>
					) }
				</div>
			</div>
			{ /* @ts-expect-error - The `SpinnerButton` component is not typed yet. */ }
			<SpinnerButton
				disabled={ isDisabled }
				isSaving={ isDoingSubmitChanges }
				type="submit"
			>
				{ __( 'Connect existing publication', 'google-site-kit' ) }
			</SpinnerButton>
		</form>
	);
};

export default ConnectPublication;
