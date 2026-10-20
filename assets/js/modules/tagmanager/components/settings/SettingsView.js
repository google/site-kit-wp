/**
 * Tag Manager Settings View component.
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
 * WordPress dependencies
 */
import { Fragment, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import DisplaySetting from '@/js/components/DisplaySetting';
import Link from '@/js/components/Link';
import SettingsStatuses from '@/js/components/settings/SettingsStatuses';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, SIZE_SMALL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import VisuallyHidden from '@/js/components/VisuallyHidden';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { useFeature } from '@/js/hooks/useFeature';
import { MODULES_TAGMANAGER } from '@/js/modules/tagmanager/datastore/constants';
import { escapeURI } from '@/js/util/escape-uri';

export default function SettingsView() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAccountID()
	);
	const containerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getContainerID()
	);
	const ampContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAMPContainerID()
	);
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getUseSnippet()
	);
	const hasExistingTag = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasExistingTag()
	);
	const isAMP = useSelect( ( select ) => select( CORE_SITE ).isAMP() );
	const isSecondaryAMP = useSelect( ( select ) =>
		select( CORE_SITE ).isSecondaryAMP()
	);
	const internalContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getInternalContainerID()
	);
	const internalAMPContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getInternalAMPContainerID()
	);
	const editWebContainerURL = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getServiceURL( {
			path: escapeURI`/container/accounts/${ accountID }/containers/${ internalContainerID }`,
		} )
	);
	const editAMPContainerURL = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getServiceURL( {
			path: escapeURI`/container/accounts/${ accountID }/containers/${ internalAMPContainerID }`,
		} )
	);

	const googleTagGatewayEnabled = useFeature( 'googleTagGateway' );
	const googleTagGatewayStatuses = useSelect( ( select ) => {
		if ( ! googleTagGatewayEnabled ) {
			return [];
		}
		const {
			isGoogleTagGatewayEnabled,
			isGTGHealthy,
			isScriptAccessEnabled,
		} = select( CORE_SITE );
		const status =
			isGoogleTagGatewayEnabled() &&
			isGTGHealthy() &&
			isScriptAccessEnabled();
		return [
			{
				label: __(
					'Google tag gateway for advertisers',
					'google-site-kit'
				),
				status,
			},
		];
	} );

	return (
		<Fragment>
			<StoreErrorNotices
				moduleSlug="tagmanager"
				storeName={ MODULES_TAGMANAGER }
			/>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<Typography
						as="h5"
						size="medium"
						type="label"
						className="googlesitekit-settings-module__meta-item-type"
					>
						{ __( 'Account', 'google-site-kit' ) }
					</Typography>
					<P
						className="googlesitekit-settings-module__meta-item-data"
						size={ SIZE_MEDIUM }
					>
						<DisplaySetting value={ accountID } />
					</P>
				</div>

				{ ( ! isAMP || isSecondaryAMP ) && (
					<Fragment>
						<div className="googlesitekit-settings-module__meta-item">
							<Typography
								as="h5"
								size="medium"
								type="label"
								className="googlesitekit-settings-module__meta-item-type"
							>
								{ isSecondaryAMP && (
									<span>
										{ __(
											'Web Container ID',
											'google-site-kit'
										) }
									</span>
								) }
								{ ! isSecondaryAMP && (
									<span>
										{ __(
											'Container ID',
											'google-site-kit'
										) }
									</span>
								) }
							</Typography>
							<P
								className="googlesitekit-settings-module__meta-item-data"
								size={ SIZE_MEDIUM }
							>
								<DisplaySetting value={ containerID } />
							</P>
						</div>
						{ editWebContainerURL && (
							<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
								<P
									className="googlesitekit-settings-module__meta-item-data"
									size={ SIZE_SMALL }
								>
									<Link href={ editWebContainerURL } external>
										{ createInterpolateElement(
											sprintf(
												/* translators: %s: Appropriate container term. */
												__(
													'Edit <VisuallyHidden>%s </VisuallyHidden>in Tag Manager',
													'google-site-kit'
												),
												isSecondaryAMP
													? __(
															'web container',
															'google-site-kit'
													  )
													: __(
															'container',
															'google-site-kit'
													  )
											),
											{
												VisuallyHidden: (
													<VisuallyHidden />
												),
											}
										) }
									</Link>
								</P>
							</div>
						) }
					</Fragment>
				) }

				{ isAMP && (
					<Fragment>
						<div className="googlesitekit-settings-module__meta-item">
							<Typography
								as="h5"
								size="medium"
								type="label"
								className="googlesitekit-settings-module__meta-item-type"
							>
								{ isSecondaryAMP && (
									<span>
										{ __(
											'AMP Container ID',
											'google-site-kit'
										) }
									</span>
								) }
								{ ! isSecondaryAMP && (
									<span>
										{ __(
											'Container ID',
											'google-site-kit'
										) }
									</span>
								) }
							</Typography>
							<P
								className="googlesitekit-settings-module__meta-item-data"
								size={ SIZE_MEDIUM }
							>
								<DisplaySetting value={ ampContainerID } />
							</P>
						</div>
						{ editAMPContainerURL && (
							<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
								<P
									className="googlesitekit-settings-module__meta-item-data"
									size={ SIZE_SMALL }
								>
									<Link href={ editAMPContainerURL } external>
										{ createInterpolateElement(
											sprintf(
												/* translators: %s: Appropriate container term. */
												__(
													'Edit <VisuallyHidden>%s </VisuallyHidden>in Tag Manager',
													'google-site-kit'
												),
												isSecondaryAMP
													? __(
															'AMP container',
															'google-site-kit'
													  )
													: __(
															'container',
															'google-site-kit'
													  )
											),
											{
												VisuallyHidden: (
													<VisuallyHidden />
												),
											}
										) }
									</Link>
								</P>
							</div>
						) }
					</Fragment>
				) }
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<Typography
						as="h5"
						size="medium"
						type="label"
						className="googlesitekit-settings-module__meta-item-type"
					>
						{ __( 'Tag Manager Code Snippet', 'google-site-kit' ) }
					</Typography>

					<P
						className="googlesitekit-settings-module__meta-item-data"
						size={ SIZE_MEDIUM }
					>
						{ useSnippet && (
							<span>
								{ __(
									'Snippet is inserted',
									'google-site-kit'
								) }
							</span>
						) }
						{ ! useSnippet && (
							<span>
								{ __(
									'Snippet is not inserted',
									'google-site-kit'
								) }
							</span>
						) }
					</P>

					{ hasExistingTag && (
						<P
							className="googlesitekit-margin-bottom-0"
							size={ SIZE_SMALL }
						>
							{ __(
								'Placing two tags at the same time is not recommended.',
								'google-site-kit'
							) }
						</P>
					) }
				</div>
			</div>

			<SettingsStatuses statuses={ googleTagGatewayStatuses } />
		</Fragment>
	);
}
