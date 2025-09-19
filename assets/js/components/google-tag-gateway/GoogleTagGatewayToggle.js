/**
 * Google Tag Gateway Toggle component.
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar, Switch } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import NewBadge from '@/js/components/NewBadge';
import Link from '@/js/components/Link';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';
import Notice from '@/js/components/Notice';
import GoogleTagGatewayOptOutNotice from './GoogleTagGatewayOptOutNotice';

const SubtleNotificationWithIntersectionObserver =
	withIntersectionObserver( Notice );

export default function GoogleTagGatewayToggle( { className } ) {
	const viewContext = useViewContext();

	const isGoogleTagGatewayEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isGoogleTagGatewayEnabled()
	);
	const isLoading = useSelect( ( select ) =>
		select( CORE_SITE ).isFetchingGetGTGServerRequirementStatus()
	);
	const hasMetServerRequirements = useSelect( ( select ) => {
		const { isGTGHealthy, isScriptAccessEnabled } = select( CORE_SITE );

		return isGTGHealthy() !== false && isScriptAccessEnabled() !== false;
	} );

	const { fetchGetGTGServerRequirementStatus, setGoogleTagGatewayEnabled } =
		useDispatch( CORE_SITE );

	const learnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'google-tag-gateway-introduction'
		);
	} );

	const serverRequirementsLearnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'google-tag-gateway-server-requirements'
		);
	} );

	// Fetch the server requirement status on mount.
	useMount( fetchGetGTGServerRequirementStatus );

	const handleClick = useCallback( () => {
		const action = isGoogleTagGatewayEnabled
			? 'deactivate_google_tag_gateway'
			: 'activate_google_tag_gateway';

		trackEvent( `${ viewContext }_gtg-settings-toggle`, action ).finally(
			() => {
				setGoogleTagGatewayEnabled( ! isGoogleTagGatewayEnabled );
			}
		);
	}, [ isGoogleTagGatewayEnabled, setGoogleTagGatewayEnabled, viewContext ] );

	return (
		<div
			className={ classnames(
				'googlesitekit-google-tag-gateway-toggle',
				className
			) }
		>
			{ isLoading && (
				<ProgressBar
					className="googlesitekit-google-tag-gateway-toggle__progress"
					small
				/>
			) }
			{ ! isLoading && (
				<div className="googlesitekit-module-settings-group__switch">
					<Switch
						label={ __(
							'Google tag gateway for advertisers',
							'google-site-kit'
						) }
						checked={
							!! isGoogleTagGatewayEnabled &&
							hasMetServerRequirements
						}
						disabled={ ! hasMetServerRequirements }
						onClick={ handleClick }
						hideLabel={ false }
					/>
					<div className="googlesitekit-google-tag-gateway-toggle__switch-badge">
						<NewBadge hasLeftSpacing />
					</div>
				</div>
			) }
			<p className="googlesitekit-module-settings-group__helper-text">
				{ createInterpolateElement(
					__(
						'Your tag data will be sent through your own domain to improve data quality and help you recover measurement signals. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: (
							<Link
								href={ learnMoreURL }
								onClick={ () => {
									trackEvent(
										`${ viewContext }_gtg-settings-toggle`,
										'click_learn_more_link'
									);
								} }
								aria-label={ __(
									'Learn more about Google tag gateway for advertisers',
									'google-site-kit'
								) }
								external
							/>
						),
					}
				) }
			</p>
			<GoogleTagGatewayOptOutNotice />
			{ ! isLoading && ! hasMetServerRequirements && (
				<SubtleNotificationWithIntersectionObserver
					type={ Notice.TYPES.WARNING }
					title={ createInterpolateElement(
						__(
							'Your server’s current settings prevent Google tag gateway for advertisers from working. To enable it, please contact your hosting provider and request access to external resources and plugin files. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									href={ serverRequirementsLearnMoreURL }
									onClick={ () => {
										trackEvent(
											`${ viewContext }_gtg-settings-toggle-disabled`,
											'click_learn_more_link'
										);
									} }
									aria-label={ __(
										'Learn more about Google tag gateway for advertisers server requirements',
										'google-site-kit'
									) }
									external
								/>
							),
						}
					) }
					variant="warning"
					onInView={ () => {
						trackEvent(
							`${ viewContext }_gtg-settings-toggle-disabled`,
							'view_notice'
						);
					} }
				/>
			) }
		</div>
	);
}
