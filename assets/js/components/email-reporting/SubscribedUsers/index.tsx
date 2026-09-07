/**
 * SubscribedUsers component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import {
	SEARCH_THRESHOLD,
	USER_SETTINGS_SELECTION_PANEL_OPENED_KEY,
} from '@/js/components/email-reporting/constants';
import UserSearchInput from '@/js/components/email-reporting/UserList/UserSearchInput';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { useDebounce } from '@/js/hooks/useDebounce';
import SubscribedUserList from './SubscribedUserList';
import { SubscribedUser } from './SubscribedUserRow';

// `getJustUnsubscribedUsers` entries carry the index they were removed
// from, so their row can be reinserted where it used to be.
type PendingDismissalUser = SubscribedUser & { index?: number };

const SubscribedUsers: FC = () => {
	const hasManageOptionsCapability = useSelect(
		( select: Select ) =>
			select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ),
		[]
	);

	const isSelectionPanelOpen = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue(
				USER_SETTINGS_SELECTION_PANEL_OPENED_KEY
			),
		[]
	);

	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ debouncedSearchTerm, setDebouncedSearchTerm ] = useState( '' );
	const [ unfilteredTotal, setUnfilteredTotal ] = useState<
		number | undefined
	>( undefined );
	const [ hasOpenedSelectionPanel, setHasOpenedSelectionPanel ] = useState(
		!! isSelectionPanelOpen
	);
	// `useDebounce` is plain JS with no `.d.ts`, so TS only infers a bare
	// `Function` return type from its JSDoc. It actually returns a Lodash
	// debounced function, which also carries a `.cancel()` method.
	const debouncedSetSearchTerm = useDebounce(
		setDebouncedSearchTerm,
		300
	) as ( ( value: string ) => void ) & { cancel: () => void };

	useEffect( () => {
		debouncedSetSearchTerm( searchTerm );
	}, [ searchTerm, debouncedSetSearchTerm ] );

	useEffect( () => {
		if ( isSelectionPanelOpen ) {
			setHasOpenedSelectionPanel( true );
		}
	}, [ isSelectionPanelOpen ] );

	const subscribedUsers = useInViewSelect(
		( select: Select ) => {
			if ( ! hasOpenedSelectionPanel ) {
				return null;
			}

			return select( CORE_SITE ).getSubscribedUsers( {
				search: debouncedSearchTerm,
			} );
		},
		[ debouncedSearchTerm, hasOpenedSelectionPanel ]
	);

	// The unfiltered total (used to decide whether to show the search input
	// at all) only needs to be captured once, whenever an unfiltered result
	// happens to be the one in view — no need for a second, permanently-live
	// subscription just to read one count.
	useEffect( () => {
		if (
			debouncedSearchTerm === '' &&
			subscribedUsers?.total !== undefined
		) {
			setUnfilteredTotal( subscribedUsers.total );
		}
	}, [ debouncedSearchTerm, subscribedUsers?.total ] );

	const isLoading = useInViewSelect(
		( select: Select ) => {
			if ( ! hasOpenedSelectionPanel ) {
				return false;
			}

			return ! select( CORE_SITE ).hasFinishedResolution(
				'getSubscribedUsers',
				[ { search: debouncedSearchTerm } ]
			);
		},
		[ debouncedSearchTerm, hasOpenedSelectionPanel ]
	);

	// `unsubscribeUser` snapshots each successfully-unsubscribed user in the
	// store instead of just dropping them, so their row can keep showing as
	// unsubscribed until dismissed — see `getJustUnsubscribedUsers`.
	const justUnsubscribedUsers = useInViewSelect(
		( select: Select ) => select( CORE_SITE ).getJustUnsubscribedUsers(),
		[]
	);

	// Reset state when panel opens so layout changes happen while
	// the panel is still off-screen, avoiding visible shifts during
	// the closing transition.
	useEffect( () => {
		if ( ! hasManageOptionsCapability ) {
			return;
		}

		if ( isSelectionPanelOpen ) {
			debouncedSetSearchTerm.cancel();
			setSearchTerm( '' );
			setDebouncedSearchTerm( '' );
		}
	}, [
		isSelectionPanelOpen,
		hasManageOptionsCapability,
		debouncedSetSearchTerm,
	] );

	if ( ! hasManageOptionsCapability ) {
		return null;
	}

	const liveUsers = subscribedUsers?.users || [];
	const liveUserIDs = new Set(
		liveUsers.map( ( user: SubscribedUser ) => user.id )
	);
	// A user unsubscribed while a search is active must still show its
	// confirmation row, so pending-dismiss rows aren't filtered by the
	// current search term — only by whether they're still undismissed.
	const pendingDismissalUsers = (
		Object.values( justUnsubscribedUsers || {} ) as PendingDismissalUser[]
	 ).filter( ( user ) => ! liveUserIDs.has( user.id ) );
	// Reinsert each pending-dismissal row at the index it was unsubscribed
	// from, so its "User unsubscribed" confirmation stays where the row
	// was instead of jumping to the end of the list.
	const users: PendingDismissalUser[] = [ ...liveUsers ];
	pendingDismissalUsers
		.slice()
		.sort( ( userA, userB ) => ( userA.index ?? 0 ) - ( userB.index ?? 0 ) )
		.forEach( ( user ) => {
			const insertAt = Math.min(
				user.index ?? users.length,
				users.length
			);
			users.splice( insertAt, 0, user );
		} );
	const showSearch = ( unfilteredTotal ?? 0 ) > SEARCH_THRESHOLD;

	return (
		<div className="googlesitekit-subscribed-users">
			{ showSearch && (
				<UserSearchInput
					value={ searchTerm }
					onChange={ setSearchTerm }
				/>
			) }

			<SubscribedUserList
				users={ users }
				searchTerm={ debouncedSearchTerm }
				isLoading={ !! isLoading }
			/>
		</div>
	);
};

export default SubscribedUsers;
