/**
 * Idea component
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../../../../components/Button';
import { Grid, Cell, Row } from '../../../../../material-components';
import {
	IDEA_HUB_BUTTON_CREATE,
	IDEA_HUB_BUTTON_PIN,
	IDEA_HUB_BUTTON_UNPIN,
	IDEA_HUB_BUTTON_DELETE,
	IDEA_HUB_BUTTON_VIEW,
} from '../../../datastore/constants';
import DeleteIcon from '../../../../../../svg/idea-hub-delete.svg';
import CreateIcon from '../../../../../../svg/idea-hub-create.svg';
import PinIcon from '../../../../../../svg/idea-hub-pin.svg';
import UnpinIcon from '../../../../../../svg/idea-hub-unpin.svg';

const Idea = ( { postEditURL, name, text, topics, buttons } ) => {
	const handleDelete = useCallback( () => {
		// @TODO: Implement callback.
		global.console.log( `Deleted: ${ name }` );
	}, [ name ] );

	const handlePin = useCallback( () => {
		// @TODO: Implement callback.
		global.console.log( `Pinned: ${ name }` );
	}, [ name ] );

	const handleUnpin = useCallback( () => {
		// @TODO: Implement callback.
		global.console.log( `Unpinned: ${ name }` );
	}, [ name ] );

	const handleCreate = useCallback( () => {
		// @TODO: Implement callback.
		global.console.log( `Created: ${ name }` );
	}, [ name ] );

	return (
		<Grid className="googlesitekit-idea-hub__idea--single">
			<Row>
				<Cell smSize={ 4 } mdSize={ 5 } lgSize={ 9 } className="googlesitekit-idea-hub__idea--details">
					<div className="googlesitekit-idea-hub__idea--topics">
						{ topics.map( ( topic, key ) => (
							<span className="googlesitekit-idea-hub__idea--topic" key={ key }>{ topic.display_name }</span>
						) ) }
					</div>

					<p className="googlesitekit-idea-hub__idea--text">{ text }</p>
				</Cell>
				<Cell smSize={ 4 } mdSize={ 3 } lgSize={ 3 } className="googlesitekit-idea-hub__idea--actions">
					{ buttons.includes( IDEA_HUB_BUTTON_DELETE ) && (
						<Button
							onClick={ handleDelete }
							icon={ <DeleteIcon /> }
							className="googlesitekit-idea-hub__actions--delete"
						/>
					) }

					{ buttons.includes( IDEA_HUB_BUTTON_PIN ) && (
						<Button
							onClick={ handlePin }
							icon={ <PinIcon /> }
							className="googlesitekit-idea-hub__actions--pin"
						/>
					) }

					{ buttons.includes( IDEA_HUB_BUTTON_UNPIN ) && (
						<Button
							onClick={ handleUnpin }
							icon={ <UnpinIcon /> }
							className="googlesitekit-idea-hub__actions--unpin"
						/>
					) }

					{ buttons.includes( IDEA_HUB_BUTTON_CREATE ) && (
						<Button
							onClick={ handleCreate }
							icon={ <CreateIcon /> }
						/>
					) }

					{ buttons.includes( IDEA_HUB_BUTTON_VIEW ) && postEditURL && (
						<Button href={ postEditURL } className="googlesitekit-idea-hub__actions--view">
							{ __( 'View draft', 'google-site-kit' ) }
						</Button>
					) }
				</Cell>
			</Row>
		</Grid>
	);
};

Idea.propTypes = {
	postID: PropTypes.number,
	postEditURL: PropTypes.string,
	postURL: PropTypes.string,
	name: PropTypes.string.isRequired,
	text: PropTypes.string.isRequired,
	topics: PropTypes.arrayOf(
		PropTypes.shape( {
			display_name: PropTypes.string,
			mid: PropTypes.string,
		} )
	).isRequired,
	buttons: PropTypes.arrayOf( PropTypes.string ).isRequired,
};

export default Idea;
