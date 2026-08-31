/**
 * Reader Revenue Manager publication setup component.
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
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { SIZE_SMALL, TYPE_LABEL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import useFormValue from '@/js/hooks/useFormValue';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import PlusIcon from '@/svg/icons/plus.svg';
import ConnectPublication from './ConnectPublication';

interface StepPublicationSetupProps {
	connectDescription?: string;
	onComplete: ( hasAcceptedTerms: boolean ) => void;
}

const StepPublicationSetup: FC< StepPublicationSetupProps > = ( {
	connectDescription,
	onComplete,
} ) => {
	const [ showPublicationCreate, setShowPublicationCreate ] =
		useFormValue< boolean >(
			READER_REVENUE_MANAGER_SETUP_FORM,
			SHOW_PUBLICATION_CREATE
		);

	const getPublicationsError: object | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getErrorForSelector(
				'getPublications',
				[]
			),
		[]
	);

	const hasResolvedPublications: boolean = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).hasFinishedResolution(
				'getPublications'
			),
		[]
	);

	const publications: Publication[] | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublications(),
		[]
	);

	const hasPublications = hasResolvedPublications && publications?.length;
	const hasNoPublications = hasResolvedPublications && ! publications?.length;

	// Show the publication create form if no publications exist.
	useEffect( () => {
		if (
			! showPublicationCreate &&
			! getPublicationsError &&
			hasNoPublications
		) {
			setShowPublicationCreate( true );
		}
	}, [
		getPublicationsError,
		hasNoPublications,
		setShowPublicationCreate,
		showPublicationCreate,
	] );

	if ( ! hasResolvedPublications ) {
		return <ProgressBar />;
	}

	return (
		<div className="googlesitekit-rrm-express-setup-step">
			{ showPublicationCreate ? (
				'RRM express setup placeholder: publication setup step.' // TODO: Implement <CreatePublication />.
			) : (
				<ConnectPublication
					description={ connectDescription }
					onComplete={ onComplete }
				/>
			) }

			{ hasPublications || getPublicationsError ? (
				<P size={ SIZE_SMALL } type={ TYPE_LABEL }>
					<Link
						className="googlesitekit-rrm-express-setup-step__cta-link"
						leadingIcon={
							showPublicationCreate ? undefined : (
								<PlusIcon width={ 12 } height={ 12 } />
							)
						}
						onClick={ () =>
							setShowPublicationCreate( ! showPublicationCreate )
						}
						type="button"
					>
						{ showPublicationCreate
							? __(
									'Use existing publication',
									'google-site-kit'
							  )
							: __(
									'Create new publication',
									'google-site-kit'
							  ) }
					</Link>
				</P>
			) : null }
		</div>
	);
};

export default StepPublicationSetup;
