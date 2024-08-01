/**
 * Reader Revenue Manager SetupMain component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '../../datastore/constants';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { PublicationCreate } from '../common';
import ReaderRevenueManagerIcon from '../../../../../svg/graphics/reader-revenue-manager.svg';
import SetupForm from './SetupForm';

export default function SetupMain( { finishSetup = () => {} } ) {
	const publications = useSelect(
		( select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublications() || []
	);
	const hasResolvedPublications = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).hasFinishedResolution(
			'getPublications'
		)
	);
	const publicationCreateShown = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			READER_REVENUE_MANAGER_SETUP_FORM,
			SHOW_PUBLICATION_CREATE
		)
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { submitChanges } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	// Show the publication create form if no publications exist.
	useEffect( () => {
		if (
			! publicationCreateShown &&
			hasResolvedPublications &&
			! publications.length
		) {
			setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
				[ SHOW_PUBLICATION_CREATE ]: true,
			} );
		}
	}, [
		hasResolvedPublications,
		publicationCreateShown,
		publications.length,
		setValues,
	] );

	const onCompleteSetup = useCallback( async () => {
		const { error } = await submitChanges();

		if ( ! error ) {
			finishSetup();
		}
	}, [ finishSetup, submitChanges ] );

	let viewComponent;

	if ( ! hasResolvedPublications ) {
		viewComponent = <ProgressBar />;
	} else if ( publicationCreateShown ) {
		viewComponent = (
			<PublicationCreate onCompleteSetup={ onCompleteSetup } />
		);
	} else {
		viewComponent = <SetupForm onCompleteSetup={ onCompleteSetup } />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--reader-revenue-manager">
			<div className="googlesitekit-setup-module__step">
				<div className="googlesitekit-setup-module__logo">
					<ReaderRevenueManagerIcon width="40" height="40" />
				</div>

				<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
					{ _x(
						'Reader Revenue Manager',
						'Service name',
						'google-site-kit'
					) }
				</h2>
			</div>

			<div className="googlesitekit-setup-module__step">
				{ viewComponent }
			</div>
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};
