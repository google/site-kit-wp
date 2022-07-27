/**
 * Thank with Google Main Setup component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_THANK_WITH_GOOGLE,
	STATE_ACTIVE,
	STATE_ACTION_REQUIRED,
	STATE_PENDING_VERIFICATION,
} from '../../datastore/constants';
import { useRefocus } from '../../../../hooks/useRefocus';
import { Grid, Row, Cell } from '../../../../material-components';
import ProgressBar from '../../../../components/ProgressBar';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import SetupCreatePublication from './SetupCreatePublication';
import SetupCustomize from './SetupCustomize';
import SetupPublicationActive from './SetupPublicationActive';
import SetupPublicationActionRequired from './SetupPublicationActionRequired';
import SetupPublicationPendingVerification from './SetupPublicationPendingVerification';
import SetupHeader from './SetupHeader';
const { useDispatch, useSelect } = Data;

export default function SetupMain( { finishSetup } ) {
	const hasErrors = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).hasErrors()
	);
	const publicationID = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getPublicationID()
	);
	const currentPublication = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getCurrentPublication()
	);

	const { resetPublications } = useDispatch( MODULES_THANK_WITH_GOOGLE );

	const reset = useCallback( () => {
		// Reset if the publication ID hasn't been set yet.
		if ( ! publicationID ) {
			resetPublications();
		}
	}, [ publicationID, resetPublications ] );

	// Reset all fetched data when user re-focuses window.
	useRefocus( reset, 15000 );

	let viewComponent;

	if ( hasErrors ) {
		viewComponent = (
			<Cell size={ 12 }>
				<SetupHeader />
				<StoreErrorNotices
					moduleSlug="thank-with-google"
					storeName={ MODULES_THANK_WITH_GOOGLE }
				/>
			</Cell>
		);
	} else if ( currentPublication === undefined ) {
		viewComponent = (
			<Cell size={ 12 }>
				<SetupHeader />
				<ProgressBar height={ 210 } />
			</Cell>
		);
	} else if ( currentPublication === null ) {
		viewComponent = <SetupCreatePublication />;
	} else if ( currentPublication.state === STATE_ACTION_REQUIRED ) {
		viewComponent = <SetupPublicationActionRequired />;
	} else if ( currentPublication.state === STATE_PENDING_VERIFICATION ) {
		viewComponent = <SetupPublicationPendingVerification />;
	} else if ( currentPublication.state === STATE_ACTIVE && ! publicationID ) {
		viewComponent = (
			<SetupPublicationActive
				// eslint-disable-next-line sitekit/acronym-case
				currentPublicationID={ currentPublication.publicationId }
			/>
		);
	} else if ( currentPublication.state === STATE_ACTIVE && publicationID ) {
		viewComponent = <SetupCustomize finishSetup={ finishSetup } />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--thank-with-google">
			<Grid>
				<Row className="googlesitekit-setup__content">
					{ viewComponent }
				</Row>
			</Grid>
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};
