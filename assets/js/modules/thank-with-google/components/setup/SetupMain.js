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
import { useCallback, lazy, Suspense } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
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

const ThankWithGoogleSetup = lazy( () =>
	import( '../../../../../svg/graphics/thank-with-google-setup.svg' )
);

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
		// Do not reset if the publication ID has already been set.
		if ( publicationID ) {
			return;
		}

		resetPublications();
	}, [ publicationID, resetPublications ] );

	// Reset all fetched data when user re-focuses window.
	useRefocus( reset, 15000 );

	const svgHeight = 210;
	const progressBar = <ProgressBar height={ svgHeight * 0.75 } />;

	let viewComponent;

	if ( hasErrors ) {
		viewComponent = (
			<StoreErrorNotices
				moduleSlug="thank-with-google"
				storeName={ MODULES_THANK_WITH_GOOGLE }
			/>
		);
	} else if ( currentPublication === undefined ) {
		viewComponent = progressBar;
	} else if ( currentPublication === null ) {
		viewComponent = <SetupCreatePublication />;
	} else if ( currentPublication.state === 'ACTION_REQUIRED' ) {
		viewComponent = <SetupPublicationActionRequired />;
	} else if ( currentPublication.state === 'PENDING_VERIFICATION' ) {
		viewComponent = <SetupPublicationPendingVerification />;
	} else if ( currentPublication.state === 'ACTIVE' && ! publicationID ) {
		viewComponent = (
			<SetupPublicationActive
				// eslint-disable-next-line sitekit/acronym-case
				currentPublicationID={ currentPublication.publicationId }
			/>
		);
	} else if ( currentPublication.state === 'ACTIVE' && publicationID ) {
		viewComponent = <SetupCustomize finishSetup={ finishSetup } />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--thank-with-google">
			<Grid>
				<Row className="googlesitekit-setup__content">
					<Suspense
						fallback={
							<Cell size={ 12 }>
								<SetupHeader />
								{ progressBar }
							</Cell>
						}
					>
						<Cell
							smSize={ 4 }
							mdSize={ 8 }
							lgSize={ 6 }
							lgOrder={ 2 }
							className="googlesitekit-setup__icon"
						>
							<ThankWithGoogleSetup
								width={ 360 }
								height={ svgHeight }
							/>
						</Cell>
						<Cell
							smSize={ 4 }
							mdSize={ 8 }
							lgSize={ 6 }
							lgOrder={ 1 }
						>
							<SetupHeader />
							{ viewComponent }
						</Cell>
					</Suspense>
				</Row>
			</Grid>
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};

SetupMain.defaultProps = {
	finishSetup: () => {},
};
