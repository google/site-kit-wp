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
import { FC, Fragment } from 'react';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import DocumentationLink from '@/js/components/DocumentationLink';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import {
	ExpressSetupStepDetails,
	ExpressSetupStepHeadline,
	PublicationSelect,
} from '@/js/modules/reader-revenue-manager/components/common';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { type Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import { languageCodeFormat, regionCodeFormat } from '@/js/util/i18n';

interface ConnectPublicationProps {
	description?: string;
	onComplete: ( hasAcceptedTerms: boolean ) => void;
}

const ConnectPublication: FC< ConnectPublicationProps > = ( {
	description,
	onComplete,
} ) => {
	const { findMatchedPublication, selectPublication, submitChanges } =
		useDispatch( MODULES_READER_REVENUE_MANAGER );

	const defaultDescription = __(
		'To use Reader Revenue Manager, connect your publication or create a new one.',
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

	const publicationID: string | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublicationID(),
		[]
	);

	const publications: Publication[] | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublications(),
		[]
	);

	const publication = publications?.find(
		// eslint-disable-next-line sitekit/acronym-case
		( p ) => p.publicationId === publicationID
	);

	const languageCode = publication?.languageCode
		? languageCodeFormat( publication.languageCode )
		: __( 'Unknown', 'google-site-kit' );

	const regionCode = publication?.regionCode
		? regionCodeFormat( publication.regionCode )
		: __( 'Unknown', 'google-site-kit' );

	const onSubmit = useCallback(
		async ( event ) => {
			event.preventDefault();

			if ( ! publication ) {
				return;
			}

			const { error } = await submitChanges();

			if ( ! error ) {
				const hasAcceptedTerms =
					!! publication.rrmProduct?.tosAcceptance?.userAccepted;

				onComplete( hasAcceptedTerms );
			}
		},
		[ onComplete, publication, submitChanges ]
	);

	useEffect( () => {
		( async () => {
			if ( publications && ! publicationID ) {
				const matchedPublication = await findMatchedPublication();

				if ( matchedPublication ) {
					selectPublication( matchedPublication );
				}
			}
		} )();
	}, [
		findMatchedPublication,
		publicationID,
		publications,
		selectPublication,
	] );

	return (
		<form
			className="googlesitekit-rrm-express-setup-step__form"
			onSubmit={ onSubmit }
		>
			<div className="googlesitekit-rrm-express-setup-step__form-content">
				<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
					{ __( 'Connect your publication', 'google-site-kit' ) }
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

				<div className="googlesitekit-rrm-express-setup-step__form-controls">
					<PublicationSelect />

					{ publication ? (
						<ExpressSetupStepDetails>
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
						</ExpressSetupStepDetails>
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
