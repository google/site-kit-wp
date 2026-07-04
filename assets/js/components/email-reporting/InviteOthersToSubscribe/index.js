/**
 * InviteOthersToSubscribe component.
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
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import InfoTooltip from '@/js/components/InfoTooltip';
import Link from '@/js/components/Link';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { useDebounce } from '@/js/hooks/useDebounce';
import InviteSearchInput from './InviteSearchInput';
import InviteUserList from './InviteUserList';

const SEARCH_THRESHOLD = 6;

export default function InviteOthersToSubscribe() {
	const hasManageOptionsCapability = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);

	const isSelectionPanelOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
	);

	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ debouncedSearchTerm, setDebouncedSearchTerm ] = useState( '' );
	const [ inviteResults, setInviteResults ] = useState( {} );
	const [ hasOpenedSelectionPanel, setHasOpenedSelectionPanel ] =
		useState( isSelectionPanelOpen );
	const debouncedSetSearchTerm = useDebounce( setDebouncedSearchTerm, 300 );

	useEffect( () => {
		debouncedSetSearchTerm( searchTerm );
	}, [ searchTerm, debouncedSetSearchTerm ] );

	useEffect( () => {
		if ( isSelectionPanelOpen ) {
			setHasOpenedSelectionPanel( true );
		}
	}, [ isSelectionPanelOpen ] );

	const eligibleSubscribers = useInViewSelect(
		( select ) => {
			if ( ! hasOpenedSelectionPanel ) {
				return null;
			}

			return select( CORE_SITE ).getEligibleSubscribers( {
				search: debouncedSearchTerm,
			} );
		},
		[ debouncedSearchTerm, hasOpenedSelectionPanel ]
	);

	const allEligibleSubscribers = useInViewSelect(
		( select ) => {
			if ( ! hasOpenedSelectionPanel ) {
				return null;
			}

			return select( CORE_SITE ).getEligibleSubscribers( {
				search: '',
			} );
		},
		[ hasOpenedSelectionPanel ]
	);

	const isLoading = useInViewSelect(
		( select ) => {
			if ( ! hasOpenedSelectionPanel ) {
				return false;
			}

			return ! select( CORE_SITE ).hasFinishedResolution(
				'getEligibleSubscribers',
				[ { search: debouncedSearchTerm } ]
			);
		},
		[ debouncedSearchTerm, hasOpenedSelectionPanel ]
	);

	const dashboardSharingDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'dashboard-sharing' )
	);

	const emailReportingDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'email-reporting-inviting-others'
		)
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
			// Clear both immediate input state and debounced query state so the panel
			// reopens unfiltered without waiting for debounce.
			setSearchTerm( '' );
			setDebouncedSearchTerm( '' );
			setInviteResults( {} );
		}
	}, [
		isSelectionPanelOpen,
		hasManageOptionsCapability,
		debouncedSetSearchTerm,
	] );

	const handleInviteResult = useCallback( ( userID, result ) => {
		setInviteResults( ( previousResults ) => ( {
			...previousResults,
			[ userID ]: result,
		} ) );
	}, [] );

	if ( ! hasManageOptionsCapability ) {
		return null;
	}

	const users = eligibleSubscribers?.users || [];
	const showSearch =
		( allEligibleSubscribers?.total || 0 ) > SEARCH_THRESHOLD;

	const tooltipContent = createInterpolateElement(
		__(
			'You can only invite users who have access to the dashboard. Use the <sharingLink>dashboard sharing</sharingLink> feature to grant access. <learnMoreLink>Learn more</learnMoreLink>',
			'google-site-kit'
		),
		{
			sharingLink: (
				<Link
					href={ dashboardSharingDocumentationURL }
					external
					hideExternalIndicator
				/>
			),
			learnMoreLink: (
				<Link
					href={ emailReportingDocumentationURL }
					external
					hideExternalIndicator
				/>
			),
		}
	);

	return (
		<div className="googlesitekit-invite-others-to-subscribe">
			<div className="googlesitekit-invite-others-to-subscribe__header">
				<span className="googlesitekit-invite-others-to-subscribe__title">
					{ __( 'Invite others to subscribe', 'google-site-kit' ) }
				</span>
				<InfoTooltip title={ tooltipContent } />
			</div>

			{ showSearch && (
				<InviteSearchInput
					value={ searchTerm }
					onChange={ setSearchTerm }
				/>
			) }

			<InviteUserList
				users={ users }
				searchTerm={ debouncedSearchTerm }
				inviteResults={ inviteResults }
				onInviteResult={ handleInviteResult }
				isLoading={ isLoading }
			/>
		</div>
	);
}
