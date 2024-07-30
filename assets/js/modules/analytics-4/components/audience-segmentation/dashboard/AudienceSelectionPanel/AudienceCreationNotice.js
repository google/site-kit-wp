/**
 * Audience Selection Panel AudienceCreationNotice component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	AUDIENCE_CREATION_NOTICE_SLUG,
	AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG,
} from './constants';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import {
	MODULES_ANALYTICS_4,
	SITE_KIT_AUDIENCE_DEFINITIONS,
} from '../../../../datastore/constants';
import Link from '../../../../../../components/Link';
import CloseIcon from '../../../../../../../svg/icons/close.svg';
import SpinnerButton, {
	SPINNER_POSITION,
} from '../../../../../../googlesitekit/components-gm2/SpinnerButton';

export default function AudienceCreationNotice() {
	const [ isCreatingAudience, setIsCreatingAudience ] = useState( false );

	const siteKitConfigurableAudiences = useSelect( ( select ) => {
		const { getConfigurableAudiences } = select( MODULES_ANALYTICS_4 );

		const audiences = getConfigurableAudiences();

		if ( undefined === audiences ) {
			return undefined;
		}

		if ( ! audiences.length ) {
			return [];
		}

		return audiences.filter(
			( { audienceType } ) => audienceType === 'SITE_KIT_AUDIENCE'
		);
	} );

	const { dismissItem } = useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );

	const isItemDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( AUDIENCE_CREATION_NOTICE_SLUG )
	);

	const onCloseClick = () => {
		dismissItem( AUDIENCE_CREATION_NOTICE_SLUG );
	};

	const { createAudience, syncAvailableAudiences } =
		useDispatch( MODULES_ANALYTICS_4 );

	const handleCreateAudience = async ( audienceSlug ) => {
		setIsCreatingAudience( audienceSlug );

		const { error } = await createAudience(
			SITE_KIT_AUDIENCE_DEFINITIONS[ audienceSlug ]
		);

		await syncAvailableAudiences();

		setIsCreatingAudience( false );

		if ( ! error ) {
			setValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG, true );
		}
	};

	// Show the notice if the user has no site kit audiences, or has
	// created one, and the user has not dismissed it.
	const shouldShowNotice =
		! isItemDismissed && siteKitConfigurableAudiences?.length < 2;

	if ( ! shouldShowNotice ) {
		return null;
	}

	const siteKitAvailableAudiences = Object.keys(
		SITE_KIT_AUDIENCE_DEFINITIONS
	).filter(
		( audienceSlug ) =>
			! siteKitConfigurableAudiences.some(
				( configuredAudience ) =>
					configuredAudience.audienceSlug === audienceSlug
			)
	);

	return (
		<div className="googlesitekit-audience-selection-panel__audience-creation-notice">
			<div className="googlesitekit-audience-selection-panel__audience-creation-notice-header">
				<p className="googlesitekit-audience-selection-panel__audience-creation-notice-title">
					{ __(
						'Create groups suggested by Site Kit.',
						'google-site-kit'
					) }
				</p>

				<Link
					className="googlesitekit-audience-selection-panel__audience-creation-notice-close"
					onClick={ onCloseClick }
					linkButton
				>
					<CloseIcon width="15" height="15" />
				</Link>
			</div>
			<div className="googlesitekit-audience-selection-panel__audience-creation-notice-body">
				{ siteKitAvailableAudiences &&
					siteKitAvailableAudiences.map( ( audienceSlug ) => (
						<div
							key={ audienceSlug }
							className="googlesitekit-audience-selection-panel__audience-creation-notice-audience"
						>
							<div className="googlesitekit-audience-selection-panel__audience-creation-notice-audience-details">
								<h3>
									{
										SITE_KIT_AUDIENCE_DEFINITIONS[
											audienceSlug
										].displayName
									}
								</h3>
								<p className="googlesitekit-audience-selection-panel__audience-creation-notice-audience-description">
									{
										SITE_KIT_AUDIENCE_DEFINITIONS[
											audienceSlug
										].description
									}
								</p>
							</div>
							<div className="googlesitekit-audience-selection-panel__audience-creation-notice-audience-button">
								<SpinnerButton
									spinnerPosition={ SPINNER_POSITION.BEFORE }
									onClick={ () => {
										handleCreateAudience( audienceSlug );
									} }
									isSaving={
										isCreatingAudience === audienceSlug
									}
								>
									{ __( 'Create', 'google-site-kit' ) }
								</SpinnerButton>
							</div>
						</div>
					) ) }
			</div>
		</div>
	);
}
