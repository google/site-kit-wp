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
import { __ } from '@wordpress/i18n';
import {
	createInterpolateElement,
	useState,
	useCallback,
	useEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import InfoTooltip from '@/js/components/InfoTooltip';
import Link from '@/js/components/Link';
import InviteUserList from './InviteUserList';
import InviteSearchInput from './InviteSearchInput';

const SEARCH_THRESHOLD = 6;

export default function InviteOthersToSubscribe() {
	const hasManageOptionsCapability = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);

	const isSelectionPanelOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
	);

	const eligibleSubscribers = useSelect( ( select ) =>
		select( CORE_SITE ).getEligibleSubscribers()
	);

	const isLoading = useSelect(
		( select ) =>
			! select( CORE_SITE ).hasFinishedResolution(
				'getEligibleSubscribers'
			)
	);

	const dashboardSharingDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'dashboard-sharing' )
	);

	const emailReportingDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'email-reporting' )
	);

	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ inviteResults, setInviteResults ] = useState( {} );

	// Reset state when panel opens so layout changes happen while
	// the panel is still off-screen, avoiding visible shifts during
	// the closing transition.
	useEffect( () => {
		if ( ! hasManageOptionsCapability ) {
			return;
		}

		if ( isSelectionPanelOpen ) {
			setSearchTerm( '' );
			setInviteResults( {} );
		}
	}, [ isSelectionPanelOpen, hasManageOptionsCapability ] );

	const handleInviteResult = useCallback( ( userID, result ) => {
		setInviteResults( ( previousResults ) => ( {
			...previousResults,
			[ userID ]: result,
		} ) );
	}, [] );

	if ( ! hasManageOptionsCapability ) {
		return null;
	}

	// Filter out already-subscribed users.
	const invitableUsers =
		eligibleSubscribers?.filter( ( user ) => ! user.subscribed ) || [];

	const showSearch = invitableUsers.length > SEARCH_THRESHOLD;

	const tooltipContent = createInterpolateElement(
		__(
			'You can only invite users who have access to the dashboard. Use the <sharingLink>dashboard sharing</sharingLink> feature to grant access. <learnMoreLink>Learn more</learnMoreLink>',
			'google-site-kit'
		),
		{
			sharingLink: <Link href={ dashboardSharingDocumentationURL } />,
			learnMoreLink: <Link href={ emailReportingDocumentationURL } />,
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
				users={ invitableUsers }
				searchTerm={ searchTerm }
				inviteResults={ inviteResults }
				onInviteResult={ handleInviteResult }
				isLoading={ isLoading }
			/>
		</div>
	);
}
