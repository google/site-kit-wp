/**
 * Reader Revenue Manager express setup terms of service step.
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
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar, SpinnerButton } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import ErrorNotice, { ErrorNoticeProps } from '@/js/components/ErrorNotice';
import Link from '@/js/components/Link';
import Checkbox from '@/js/googlesitekit/components-gm2/Checkbox';
import Radio from '@/js/googlesitekit/components-gm2/Radio';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { sanitizeHTML } from '@/js/util';

const PUBLICATION_TYPE_FOR_PROFIT = 'FOR_PROFIT';
const PUBLICATION_TYPE_NON_PROFIT = 'NON_PROFIT';

interface Publication {
	rrmProduct?: {
		// eslint-disable-next-line sitekit/acronym-case -- `Url` is the normalized API field name.
		productTosUrl?: string;
	};
}

interface UpdatePublicationParams {
	organizationID?: string;
	publicationID?: string;
	data: {
		publicationType: string;
		rrmProduct: {
			tosAcceptance: {
				emailOptIn: boolean;
				userAccepted: boolean;
			};
		};
	};
}

interface ReaderRevenueManagerStore {
	getSettings():
		| { organizationID?: string; publicationID?: string }
		| undefined;
	getPublication( params: {
		organizationID?: string;
		publicationID?: string;
	} ): Publication | undefined;
	getTermsOfService( params: { tosURL: string } ): string | undefined;
	getErrorForSelector(
		name: string,
		args: Array< unknown >
	): ErrorNoticeProps[ 'error' ];
	isFetchingUpdatePublication( params: UpdatePublicationParams ): boolean;
	getErrorForAction(
		name: string,
		args: Array< unknown >
	): ErrorNoticeProps[ 'error' ];
}
interface ReaderRevenueManagerActions {
	updatePublication(
		params: UpdatePublicationParams
	): Promise< { error?: ErrorNoticeProps[ 'error' ] } >;
}

function getReaderRevenueManagerStore( select: Select ) {
	return select(
		MODULES_READER_REVENUE_MANAGER
	) as unknown as ReaderRevenueManagerStore;
}

export default function StepTermsOfService() {
	const [ publicationType, setPublicationType ] = useState(
		PUBLICATION_TYPE_FOR_PROFIT
	);
	const [ emailOptIn, setEmailOptIn ] = useState( false );
	const [ , setStep ] = useQueryArg( 'step' );

	const settings = useSelect(
		( select: Select ) =>
			getReaderRevenueManagerStore( select ).getSettings(),
		[]
	);
	const organizationID = settings?.organizationID;
	const publicationID = settings?.publicationID;
	const publication = useSelect(
		( select: Select ) =>
			getReaderRevenueManagerStore( select ).getPublication( {
				organizationID,
				publicationID,
			} ),
		[ organizationID, publicationID ]
	);
	// eslint-disable-next-line sitekit/acronym-case -- `Url` is the normalized API field name.
	const tosURL = publication?.rrmProduct?.productTosUrl;
	const termsOfService = useSelect(
		( select: Select ) =>
			tosURL
				? getReaderRevenueManagerStore( select ).getTermsOfService( {
						tosURL,
				  } )
				: undefined,
		[ tosURL ]
	);
	const tosError = useSelect(
		( select: Select ) =>
			tosURL
				? getReaderRevenueManagerStore( select ).getErrorForSelector(
						'getTermsOfService',
						[ { tosURL } ]
				  )
				: undefined,
		[ tosURL ]
	);
	const learnMoreURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL(
				'rrm-publication-tos'
			),
		[]
	);
	const isDoingUpdatePublication = useSelect(
		( select: Select ) =>
			getReaderRevenueManagerStore( select ).isFetchingUpdatePublication(
				{
					organizationID,
					publicationID,
					data: {
						publicationType,
						rrmProduct: {
							tosAcceptance: {
								emailOptIn,
								userAccepted: true,
							},
						},
					},
				}
			),
		[ organizationID, publicationID, publicationType, emailOptIn ]
	);
	const updatePublicationError = useSelect(
		( select: Select ) =>
			getReaderRevenueManagerStore( select ).getErrorForAction(
				'updatePublication',
				[
					{
						organizationID,
						publicationID,
						data: {
							publicationType,
							rrmProduct: {
								tosAcceptance: {
									emailOptIn,
									userAccepted: true,
								},
							},
						},
					},
				]
			),
		[ organizationID, publicationID, publicationType, emailOptIn ]
	);
	const { updatePublication } = useDispatch(
		MODULES_READER_REVENUE_MANAGER
	) as unknown as ReaderRevenueManagerActions;

	const handlePublicationTypeChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			setPublicationType( event.target.value );
		},
		[]
	);

	const handleEmailOptInChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			setEmailOptIn( event.target.checked );
		},
		[]
	);

	const handleSubmit = useCallback( async () => {
		const { error } = await updatePublication( {
			organizationID,
			publicationID,
			data: {
				publicationType,
				rrmProduct: {
					tosAcceptance: {
						emailOptIn,
						userAccepted: true,
					},
				},
			},
		} );

		if ( ! error ) {
			setStep( EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES );
		}
	}, [
		emailOptIn,
		organizationID,
		publicationID,
		publicationType,
		setStep,
		updatePublication,
	] );

	if ( ! termsOfService && ! tosError ) {
		return <ProgressBar />;
	}

	return (
		<div className="googlesitekit-rrm-terms-of-service-step">
			<h2>{ __( 'Terms of service', 'google-site-kit' ) }</h2>
			<p className="googlesitekit-rrm-terms-of-service-step__description">
				{ __(
					'To create a publication, you need to accept the Reader Revenue Manager Terms of Service.',
					'google-site-kit'
				) }{ ' ' }
				<Link href={ learnMoreURL } external hideExternalIndicator>
					{ __( 'Learn more', 'google-site-kit' ) }
				</Link>
			</p>

			{ tosError && (
				<ErrorNotice
					className="googlesitekit-rrm-terms-of-service-step__error"
					error={ tosError }
					noPrefix
				/>
			) }

			{ termsOfService && (
				<div
					className="googlesitekit-rrm-terms-of-service-step__content"
					dangerouslySetInnerHTML={ sanitizeHTML( termsOfService ) }
				/>
			) }

			<div className="googlesitekit-rrm-terms-of-service-step__publication-status">
				<h3>{ __( 'Publication status', 'google-site-kit' ) }</h3>
				<p>
					{ __(
						"Reader Revenue Manager doesn't offer subscription or contribution features for non-profit publishers.",
						'google-site-kit'
					) }
				</p>
				<div className="googlesitekit-rrm-terms-of-service-step__publication-status-options">
					<Radio
						id="googlesitekit-rrm-publication-type-for-profit"
						name="googlesitekit-rrm-publication-type"
						value={ PUBLICATION_TYPE_FOR_PROFIT }
						checked={
							publicationType === PUBLICATION_TYPE_FOR_PROFIT
						}
						onChange={ handlePublicationTypeChange }
					>
						{ __( 'For profit', 'google-site-kit' ) }
					</Radio>
					<Radio
						id="googlesitekit-rrm-publication-type-non-profit"
						name="googlesitekit-rrm-publication-type"
						value={ PUBLICATION_TYPE_NON_PROFIT }
						checked={
							publicationType === PUBLICATION_TYPE_NON_PROFIT
						}
						onChange={ handlePublicationTypeChange }
					>
						{ __( 'Non-profit', 'google-site-kit' ) }
					</Radio>
				</div>
			</div>

			<Checkbox
				id="googlesitekit-rrm-email-opt-in"
				name="googlesitekit-rrm-email-opt-in"
				value="1"
				checked={ emailOptIn }
				onChange={ handleEmailOptInChange }
			>
				{ __(
					'Yes, send me customized help, performance suggestions and product updates for Reader Revenue Manager',
					'google-site-kit'
				) }
			</Checkbox>

			{ updatePublicationError && (
				<ErrorNotice
					className="googlesitekit-rrm-terms-of-service-step__error"
					error={ updatePublicationError }
					noPrefix
				/>
			) }

			{ /* @ts-expect-error `SpinnerButton` component type does not include children yet. */ }
			<SpinnerButton
				className="googlesitekit-rrm-terms-of-service-step__submit"
				disabled={ ! termsOfService || isDoingUpdatePublication }
				isSaving={ isDoingUpdatePublication }
				onClick={ handleSubmit }
			>
				{ __( 'I agree', 'google-site-kit' ) }
			</SpinnerButton>
		</div>
	);
}
