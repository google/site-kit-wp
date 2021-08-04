/**
 * Pagination component
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
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../../../../components/Button';
import {
	IDEA_HUB_IDEAS_PER_PAGE,
	MODULES_IDEA_HUB,
} from '../../../datastore/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import Data from 'googlesitekit-data';

const { useSelect } = Data;

const Pagination = ( { tab } ) => {
	const page =
		useSelect( ( select ) =>
			select( CORE_UI ).getValue( `idea-hub-page-${ tab }` )
		) || 1;

	const total = useSelect( ( select ) => {
		if ( tab === 'new-ideas' ) {
			return select( MODULES_IDEA_HUB )?.getNewIdeas().length;
		}
		if ( tab === 'saved-ideas' ) {
			return select( MODULES_IDEA_HUB )?.getSavedIdeas().length;
		}
		if ( tab === 'draft-ideas' ) {
			return select( MODULES_IDEA_HUB )?.getDraftPostIdeas().length;
		}
	} );

	return (
		<div className="googlesitekit-idea-hub__pagination">
			<span className="googlesitekit-idea-hub__pagination--legend">
				{ sprintf(
					/* translators: 1: from, 2: to, 3: total items */
					_x(
						'%1$s - %2$s of %3$s',
						'{from} - {to} of {total}',
						'google-site-kit'
					),
					page === 1
						? page
						: ( page - 1 ) * IDEA_HUB_IDEAS_PER_PAGE + 1,
					total < page * IDEA_HUB_IDEAS_PER_PAGE
						? total
						: page * IDEA_HUB_IDEAS_PER_PAGE,
					total
				) }
			</span>

			<div className="googlesitekit-idea-hub__pagination--buttons">
				<Button
					icon={ <Icon icon={ chevronLeft } /> }
					// onClick={ handlePrev }
					disabled={ page === 1 }
				/>
				<Button
					icon={ <Icon icon={ chevronRight } /> }
					// onClick={ handleNext }
					// disabled={ page * IDEA_HUB_IDEAS_PER_PAGE > total }
				/>
			</div>
		</div>
	);
};

Pagination.propTypes = {
	tab: PropTypes.string,
};

Pagination.defaultProps = {
	tab: 'new-ideas',
};

export default Pagination;
