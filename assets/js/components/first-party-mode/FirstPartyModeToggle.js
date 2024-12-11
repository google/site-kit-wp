/**
 * First Party Mode Toggle component.
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
 * External dependencies
 */
import classnames from 'classnames';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar, Switch } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import Badge from '../Badge';
import SubtleNotification from '../notifications/SubtleNotification';

export default function FirstPartyModeToggle( { className } ) {
	const isFirstPartyModeEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isFirstPartyModeEnabled()
	);
	const isLoading = useSelect( ( select ) =>
		select( CORE_SITE ).isFetchingGetFPMServerRequirementStatus()
	);
	const hasMetServerRequirements = useSelect( ( select ) => {
		const { isFPMHealthy, isScriptAccessEnabled } = select( CORE_SITE );

		return isFPMHealthy() !== false && isScriptAccessEnabled() !== false;
	} );

	const { fetchGetFPMServerRequirementStatus, setFirstPartyModeEnabled } =
		useDispatch( CORE_SITE );

	// Fetch the server requirement status on mount.
	useMount( fetchGetFPMServerRequirementStatus );

	const handleClick = useCallback( () => {
		setFirstPartyModeEnabled( ! isFirstPartyModeEnabled );
	}, [ isFirstPartyModeEnabled, setFirstPartyModeEnabled ] );

	return (
		<div
			className={ classnames(
				'googlesitekit-first-party-mode-toggle',
				className
			) }
		>
			{ isLoading && (
				<ProgressBar
					small
					className="googlesitekit-first-party-mode-toggle__progress"
				/>
			) }
			{ ! isLoading && (
				<div className="googlesitekit-module-settings-group__switch">
					<Switch
						label={ __( 'First-party mode', 'google-site-kit' ) }
						checked={
							!! isFirstPartyModeEnabled &&
							hasMetServerRequirements
						}
						disabled={ ! hasMetServerRequirements }
						onClick={ handleClick }
						hideLabel={ false }
					/>
					<div className="googlesitekit-first-party-mode-toggle__switch-badge">
						<Badge
							className="googlesitekit-badge--beta"
							hasLeftSpacing
							label={ __( 'Beta', 'google-site-kit' ) }
						/>
					</div>
				</div>
			) }
			<p className="googlesitekit-module-settings-group__helper-text">
				{ __(
					'Your tag data will be sent through your own domain to improve data quality and help you recover measurement signals.',
					'google-site-kit'
				) }
			</p>
			{ ! isLoading && ! hasMetServerRequirements && (
				<SubtleNotification
					title={ __(
						'Your server’s current settings prevent first-party mode from working. To enable it, please contact your hosting provider and request access to external resources and plugin files.',
						'google-site-kit'
					) }
					variant="warning"
				/>
			) }
		</div>
	);
}
