/**
 * NewIdeas component
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
	IDEA_HUB_BUTTON_DELETE,
	IDEA_HUB_BUTTON_PIN,
	IDEA_HUB_IDEAS_PER_PAGE,
	MODULES_IDEA_HUB,
} from '../../../datastore/constants';
import EmptyIcon from '../../../../../../svg/idea-hub-empty-new-ideas.svg';
import PreviewTable from '../../../../../components/PreviewTable';
import Idea from './Idea';
import Empty from './Empty';
import Footer from './Footer';
const { useSelect } = Data;

const NewIdeas = ( { WidgetReportError } ) => {
	const [ page, setPage ] = useState( 1 );

	const totalNewIdeas = useSelect(
		( select ) => select( MODULES_IDEA_HUB ).getNewIdeas()?.length
	);
	const hasFinishedResolution = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).hasFinishedResolution( 'getNewIdeas' )
	);
	const error = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getErrorForSelector( 'getNewIdeas' )
	);

	const newIdeas = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getNewIdeasSlice( {
			offset: ( page - 1 ) * IDEA_HUB_IDEAS_PER_PAGE,
			length: IDEA_HUB_IDEAS_PER_PAGE,
		} )
	);

	const handlePrev = useCallback( () => {
		if ( page > 1 ) {
			setPage( page - 1 );
		}
	}, [ page, setPage ] );

	const handleNext = useCallback( () => {
		if ( page < Math.ceil( totalNewIdeas / IDEA_HUB_IDEAS_PER_PAGE ) ) {
			setPage( page + 1 );
		}
	}, [ page, setPage, totalNewIdeas ] );

	if ( ! hasFinishedResolution ) {
		return <PreviewTable rows={ 5 } rowHeight={ 70 } />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="idea-hub" error={ error } />;
	}

	if ( ! totalNewIdeas ) {
		return (
			<Empty
				Icon={ <EmptyIcon /> }
				title={ __(
					'Idea Hub is generating ideas',
					'google-site-kit'
				) }
				subtitle={ __(
					'This could take 24 hours.',
					'google-site-kit'
				) }
			/>
		);
	}

	return (
		<Fragment>
			<div className="googlesitekit-idea-hub__new-ideas">
				{ newIdeas.map( ( idea, key ) => (
					<Idea
						key={ key }
						name={ idea.name }
						text={ idea.text }
						topics={ idea.topics }
						buttons={ [
							IDEA_HUB_BUTTON_DELETE,
							IDEA_HUB_BUTTON_PIN,
							IDEA_HUB_BUTTON_CREATE,
						] }
					/>
				) ) }
			</div>

			<Footer
				page={ page }
				totalIdeas={ totalNewIdeas }
				handlePrev={ handlePrev }
				handleNext={ handleNext }
			/>
		</Fragment>
	);
};

NewIdeas.propTypes = {
	WidgetReportError: PropTypes.elementType.isRequired,
};

export default NewIdeas;
