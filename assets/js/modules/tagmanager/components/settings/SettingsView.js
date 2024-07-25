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
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import DisplaySetting from '../../../../components/DisplaySetting';
import Link from '../../../../components/Link';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import { escapeURI } from '../../../../util/escape-uri';

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

	return (
		<Fragment>
			<StoreErrorNotices
				moduleSlug="tagmanager"
				storeName={ MODULES_TAGMANAGER }
			/>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Account', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ accountID } />
					</p>
				</div>

				{ ( ! isAMP || isSecondaryAMP ) && (
					<Fragment>
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
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
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								<DisplaySetting value={ containerID } />
							</p>
						</div>
						{ editWebContainerURL && (
							<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
								<p className="googlesitekit-settings-module__meta-item-data googlesitekit-settings-module__meta-item-data--tiny">
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
								</p>
							</div>
						) }
					</Fragment>
				) }

				{ isAMP && (
					<Fragment>
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
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
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								<DisplaySetting value={ ampContainerID } />
							</p>
						</div>
						{ editAMPContainerURL && (
							<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
								<p className="googlesitekit-settings-module__meta-item-data googlesitekit-settings-module__meta-item-data--tiny">
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
								</p>
							</div>
						) }
					</Fragment>
				) }
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Tag Manager Code Snippet', 'google-site-kit' ) }
					</h5>

					<p className="googlesitekit-settings-module__meta-item-data">
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
					</p>

					{ hasExistingTag && (
						<p>
							{ __(
								'Placing two tags at the same time is not recommended.',
								'google-site-kit'
							) }
						</p>
					) }
				</div>
			</div>
		</Fragment>
	);
}
