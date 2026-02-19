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
 * External dependencies
 */
import PropTypes from 'prop-types';

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
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { useFeature } from '@/js/hooks/useFeature';
import InfoTooltip from '@/js/components/InfoTooltip';
import Link from '@/js/components/Link';
import InviteUserList from './InviteUserList';
import InviteSearchInput from './InviteSearchInput';

const SEARCH_THRESHOLD = 6;

export default function InviteOthersToSubscribe( { isOpen } ) {
	const isEnabled = useFeature( 'proactiveUserEngagement' );

	const hasManageOptionsCapability = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
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

	const dashboardSharingURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'dashboard-sharing' )
	);

	const emailReportingURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'email-reporting' )
	);

	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ inviteResults, setInviteResults ] = useState( {} );

	// Reset state when panel closes.
	useEffect( () => {
		if ( ! hasManageOptionsCapability ) {
			return;
		}

		if ( ! isOpen ) {
			setSearchTerm( '' );
			setInviteResults( {} );
		}
	}, [ isOpen, hasManageOptionsCapability ] );

	const handleInviteResult = useCallback( ( userID, result ) => {
		setInviteResults( ( prev ) => ( {
			...prev,
			[ userID ]: result,
		} ) );
	}, [] );

	if ( ! isEnabled || ! hasManageOptionsCapability ) {
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
			sharingLink: <Link href={ dashboardSharingURL } />,
			learnMoreLink: <Link href={ emailReportingURL } />,
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

InviteOthersToSubscribe.propTypes = {
	isOpen: PropTypes.bool,
};
