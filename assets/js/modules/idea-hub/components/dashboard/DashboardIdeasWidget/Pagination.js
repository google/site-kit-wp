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
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../../../../components/Button';
import {
	IDEA_HUB_IDEAS_PER_PAGE,
	MODULES_IDEA_HUB,
	IDEA_HUB_TAB_NAMES_NEW,
	IDEA_HUB_TAB_NAMES_SAVED,
	IDEA_HUB_TAB_NAMES_DRAFT,
} from '../../../datastore/constants';
import { trackEvent } from '../../../../../util';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import Data from 'googlesitekit-data';
import useViewContext from '../../../../../hooks/useViewContext';
const { useSelect, useInViewSelect, useDispatch } = Data;

const Pagination = ( { tab } ) => {
	const viewContext = useViewContext();
	const uniqueKey = `idea-hub-page-${ tab }`;
	const page =
		useSelect( ( select ) => select( CORE_UI ).getValue( uniqueKey ) ) || 1;

	const total = useInViewSelect( ( select ) => {
		if ( tab === IDEA_HUB_TAB_NAMES_NEW ) {
			return select( MODULES_IDEA_HUB ).getNewIdeas()?.length || 0;
		}
		if ( tab === IDEA_HUB_TAB_NAMES_SAVED ) {
			return select( MODULES_IDEA_HUB ).getSavedIdeas()?.length || 0;
		}
		if ( tab === IDEA_HUB_TAB_NAMES_DRAFT ) {
			return select( MODULES_IDEA_HUB ).getDraftPostIdeas()?.length || 0;
		}

		return 0;
	} );

	const trackPage = useCallback(
		( direction ) => {
			const eventMap = {
				forward: {
					[ IDEA_HUB_TAB_NAMES_NEW ]: 'new_page_advance',
					[ IDEA_HUB_TAB_NAMES_SAVED ]: 'saved_page_advance',
					[ IDEA_HUB_TAB_NAMES_DRAFT ]: 'draft_page_advance',
				},
				back: {
					[ IDEA_HUB_TAB_NAMES_NEW ]: 'new_page_return',
					[ IDEA_HUB_TAB_NAMES_SAVED ]: 'saved_page_return',
					[ IDEA_HUB_TAB_NAMES_DRAFT ]: 'draft_page_return',
				},
			};
			const event = eventMap[ direction ][ tab ];

			if ( event ) {
				trackEvent( `${ viewContext }_idea-hub-widget`, event, page );
			}
		},
		[ tab, page, viewContext ]
	);

	const { setValue } = useDispatch( CORE_UI );

	const handlePrev = useCallback(
		( shouldTrackEvent = true ) => {
			if ( page > 1 ) {
				setValue( uniqueKey, page - 1 );

				if ( shouldTrackEvent ) {
					trackPage( 'back' );
				}
			}
		},
		[ page, setValue, uniqueKey, trackPage ]
	);

	const handleNext = useCallback( () => {
		if ( page < Math.ceil( total / IDEA_HUB_IDEAS_PER_PAGE ) ) {
			setValue( uniqueKey, page + 1 );
			trackPage( 'forward' );
		}
	}, [ page, setValue, total, uniqueKey, trackPage ] );

	const from = page === 1 ? page : ( page - 1 ) * IDEA_HUB_IDEAS_PER_PAGE + 1;
	const to =
		total < page * IDEA_HUB_IDEAS_PER_PAGE
			? total
			: page * IDEA_HUB_IDEAS_PER_PAGE;

	useEffect( () => {
		// If the last idea on a given pagination page is removed,
		// update the page count to point at the previous page.
		if ( page > 1 && from > to ) {
			// We don't need to track this as a page change, so pass 'false'.
			handlePrev( false );
		}
	}, [ page, from, to, handlePrev ] );

	if ( total < 1 ) {
		return null;
	}

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
					from,
					to,
					total
				) }
			</span>

			<div className="googlesitekit-idea-hub__pagination--buttons">
				<Button
					icon={ <Icon icon={ chevronLeft } /> }
					onClick={ handlePrev }
					disabled={ page === 1 }
				/>
				<Button
					icon={ <Icon icon={ chevronRight } /> }
					onClick={ handleNext }
					disabled={ page * IDEA_HUB_IDEAS_PER_PAGE >= total }
				/>
			</div>
		</div>
	);
};

Pagination.propTypes = {
	tab: PropTypes.oneOf( [
		IDEA_HUB_TAB_NAMES_NEW,
		IDEA_HUB_TAB_NAMES_SAVED,
		IDEA_HUB_TAB_NAMES_DRAFT,
	] ),
};

Pagination.defaultProps = {
	tab: IDEA_HUB_TAB_NAMES_NEW,
};

export default Pagination;
