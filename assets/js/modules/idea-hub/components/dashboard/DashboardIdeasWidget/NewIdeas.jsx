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
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import EmptyIcon from '../../../../../../svg/graphics/zero-state-yellow.svg';
import PreviewTable from '../../../../../components/PreviewTable';
import Idea from './Idea';
import Empty from './Empty';
const { useSelect, useInViewSelect } = Data;

export default function NewIdeas( { WidgetReportError } ) {
	const page = useSelect( ( select ) =>
		select( CORE_UI ).getValue( 'idea-hub-page-new-ideas' )
	);

	const totalNewIdeas = useInViewSelect(
		( select ) => select( MODULES_IDEA_HUB ).getNewIdeas()?.length
	);
	const hasFinishedResolution = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).hasFinishedResolution( 'getNewIdeas' )
	);
	const error = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getErrorForSelector( 'getNewIdeas' )
	);

	const newIdeas = useInViewSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getNewIdeasSlice( {
			offset: ( page - 1 ) * IDEA_HUB_IDEAS_PER_PAGE,
			length: IDEA_HUB_IDEAS_PER_PAGE,
		} )
	);

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
			/>
		);
	}

	return (
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
	);
}

NewIdeas.propTypes = {
	WidgetReportError: PropTypes.elementType.isRequired,
};
