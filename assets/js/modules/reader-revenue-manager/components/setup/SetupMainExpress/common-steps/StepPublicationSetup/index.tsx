/**
 * Reader Revenue Manager StepPublicationSetup component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import TroubleshootingLink from '@/js/components/TroubleshootingLink';
import useFormValue from '@/js/hooks/useFormValue';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import PlusIcon from '@/svg/icons/plus.svg';
import ConnectPublication from './ConnectPublication';

const StepPublicationSetup: FC = () => {
	const { resetPublications } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const [ showPublicationCreate, setShowPublicationCreate ] =
		useFormValue< boolean >(
			READER_REVENUE_MANAGER_SETUP_FORM,
			SHOW_PUBLICATION_CREATE
		);

	const getPublicationsError = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getErrorForSelector(
				'getPublications'
			) as { message?: string } | undefined,
		[]
	);

	const hasResolvedPublications = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).hasFinishedResolution(
				'getPublications'
			),
		[]
	);

	const publications = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublications() as
				| unknown[]
				| undefined,
		[]
	);

	const hasPublications = hasResolvedPublications && publications?.length;
	const hasNoPublications = hasResolvedPublications && ! publications?.length;
	const isCreatingPublication = hasNoPublications || showPublicationCreate;

	useEffect( () => {
		if ( hasNoPublications ) {
			setShowPublicationCreate( true );
		}
	}, [ hasNoPublications, showPublicationCreate, setShowPublicationCreate ] );

	if ( ! hasResolvedPublications ) {
		return <ProgressBar />;
	}

	if ( getPublicationsError ) {
		return (
			<Notice
				ctaButton={ {
					label: __( 'Retry', 'google-site-kit' ),
					onClick: resetPublications,
				} }
				description={ createInterpolateElement(
					__( 'Try again or <a>get help</a>', 'google-site-kit' ),
					{
						a: (
							<TroubleshootingLink
								error={ getPublicationsError }
							/>
						),
					}
				) }
				title={ __(
					'Getting your publications failed',
					'google-site-kit'
				) }
				type={ NOTICE_TYPES.ERROR }
			/>
		);
	}

	return (
		<div className="googlesitekit-rrm-publication-setup">
			{ isCreatingPublication ? (
				'RRM express setup placeholder: publication setup step.' // TODO: Implement <CreatePublication />.
			) : (
				<ConnectPublication />
			) }

			{ hasPublications ? (
				<div className="googlesitekit-rrm-publication-setup__footer">
					{ isCreatingPublication ? (
						<Link
							onClick={ () => setShowPublicationCreate( false ) }
							type="button"
						>
							{ __(
								'Use existing publication',
								'google-site-kit'
							) }
						</Link>
					) : (
						<Link
							leadingIcon={
								<PlusIcon width={ 12 } height={ 12 } />
							}
							onClick={ () => setShowPublicationCreate( true ) }
							type="button"
						>
							{ __(
								'Create new publication',
								'google-site-kit'
							) }
						</Link>
					) }
				</div>
			) : null }
		</div>
	);
};

export default StepPublicationSetup;
