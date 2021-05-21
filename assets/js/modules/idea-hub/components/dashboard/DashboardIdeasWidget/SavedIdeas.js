/**
 * SavedIdeas component
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
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	IDEA_HUB_BUTTON_CREATE,
	IDEA_HUB_BUTTON_UNPIN,
	IDEA_HUB_IDEAS_PER_PAGE,
	STORE_NAME,
} from '../../../datastore/constants';
import EmptyIcon from '../../../../../../svg/idea-hub-empty-saved-ideas.svg';
import PreviewTable from '../../../../../components/PreviewTable';
import Idea from './Idea';
import Empty from './Empty';
import Footer from './Footer';
const { useSelect } = Data;

const SavedIdeas = ( { active, WidgetReportError } ) => {
	const [ page, setPage ] = useState( 1 );
	const args = {
		offset: ( ( page - 1 ) * IDEA_HUB_IDEAS_PER_PAGE ),
		length: IDEA_HUB_IDEAS_PER_PAGE,
	};
	const totalSavedIdeas = useSelect( ( select ) => select( STORE_NAME ).getSavedIdeas()?.length );
	const savedIdeas = useSelect( ( select ) => select( STORE_NAME ).getSavedIdeas( args ) );
	const hasFinishedResolution = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getSavedIdeas', [ args ] ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getSavedIdeas', [ args ] ) );

	const handlePrev = useCallback( () => {
		if ( page > 1 ) {
			setPage( page - 1 );
		}
	}, [ page, setPage ] );

	const handleNext = useCallback( () => {
		if ( page < Math.ceil( totalSavedIdeas / IDEA_HUB_IDEAS_PER_PAGE ) ) {
			setPage( page + 1 );
		}
	}, [ page, setPage, totalSavedIdeas ] );

	if ( ! active ) {
		return null;
	}

	if ( ! hasFinishedResolution ) {
		return (
			<PreviewTable rows={ 5 } rowHeight={ 70 } />
		);
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="idea-hub" error={ error } />;
	}

	if ( ! totalSavedIdeas ) {
		return (
			<Empty
				sideLayout={ false }
				Icon={ <EmptyIcon /> }
				title={ __( 'No saved ideas', 'google-site-kit' ) }
				subtitle={ __( 'Ideas you saved from the New tab will appear here', 'google-site-kit' ) }
			/>
		);
	}

	return (
		<Fragment>
			<div className="googlesitekit-idea-hub__saved-ideas">
				{ savedIdeas.map( ( idea, key ) => (
					<Idea
						key={ key }
						name={ idea.name }
						text={ idea.text }
						topics={ idea.topics }
						buttons={ [ IDEA_HUB_BUTTON_UNPIN, IDEA_HUB_BUTTON_CREATE ] }
					/>
				) ) }
			</div>

			<Footer
				page={ page }
				totalIdeas={ totalSavedIdeas }
				handlePrev={ handlePrev }
				handleNext={ handleNext }
			/>
		</Fragment>
	);
};

SavedIdeas.propTypes = {
	active: PropTypes.bool.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
};

export default SavedIdeas;
