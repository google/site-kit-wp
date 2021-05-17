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
 * WordPress dependencies
 */
import { Fragment, useCallback, useState } from '@wordpress/element';
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
	STORE_NAME,
} from '../../../datastore/constants';
import { Grid, Cell, Row } from '../../../../../material-components';
import Idea from './Idea';
import Pagination from './Pagination';
const { useSelect } = Data;

const NewIdeas = () => {
	const [ page, setPage ] = useState( 1 );
	const totalNewIdeas = useSelect( ( select ) => select( STORE_NAME ).getNewIdeas() );
	const newIdeas = useSelect( ( select ) => select( STORE_NAME ).getNewIdeas(
		{ offset: ( ( page - 1 ) * IDEA_HUB_IDEAS_PER_PAGE ), length: IDEA_HUB_IDEAS_PER_PAGE }
	) );

	const handlePrev = useCallback( () => {
		setPage( page - 1 );
	}, [ page, setPage ] );

	const handleNext = useCallback( () => {
		setPage( page + 1 );
	}, [ page, setPage ] );

	return (
		<Fragment>
			<div className="googlesitekit-idea-hub__new-ideas">
				{ newIdeas.map( ( idea, key ) => {
					return (
						<Idea
							key={ key }
							name={ idea.name }
							text={ idea.text }
							topics={ idea.topics }
							buttons={ [ IDEA_HUB_BUTTON_DELETE, IDEA_HUB_BUTTON_PIN, IDEA_HUB_BUTTON_CREATE ] }
						/>
					);
				} ) }
			</div>

			<Grid className="googlesitekit-idea-hub__footer">
				<Row>
					<Cell size={ 6 } className="googlesitekit-idea-hub__footer--updated">
						{ __( 'Updated every 2-3 days', 'google-site-kit' ) }
					</Cell>
					<Cell size={ 6 }>
						<Pagination
							ideasPerPage={ IDEA_HUB_IDEAS_PER_PAGE }
							setPage={ setPage }
							total={ totalNewIdeas?.length }
							totalOnPage={ newIdeas?.length }
							page={ page }
							handlePrev={ handlePrev }
							handleNext={ handleNext }
						/>
					</Cell>
				</Row>
			</Grid>
		</Fragment>
	);
};

export default NewIdeas;
