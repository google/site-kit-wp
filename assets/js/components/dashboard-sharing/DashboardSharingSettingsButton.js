/**
 * DashboardSharingSettingsButton component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import Dialog, { DialogContent, DialogFooter } from '@material/react-dialog';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, arrowLeft } from '@wordpress/icons';
import {
	createInterpolateElement,
	Fragment,
	useCallback,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Link from '../Link';
import Button from '../Button';
import Portal from '../Portal';
import ShareIcon from '../../../svg/icons/share.svg';
import { BREAKPOINT_SMALL, useBreakpoint } from '../../hooks/useBreakpoint';

export default function DashboardSharingSettingsButton() {
	const breakpoint = useBreakpoint();
	const [ dialogOpen, setDialogOpen ] = useState( false );

	const openDialog = useCallback( () => {
		setDialogOpen( true );
	}, [] );

	const closeDialog = useCallback( () => {
		setDialogOpen( false );
	}, [] );

	return (
		<Fragment>
			<Link
				aria-label={ __( 'Open sharing settings', 'google-site-kit' ) }
				onClick={ openDialog }
			>
				<ShareIcon width={ 21 } height={ 21 } />
			</Link>

			<Portal>
				<Dialog open={ dialogOpen } className="googlesitekit-dialog">
					<div
						className="googlesitekit-dialog__back-wrapper"
						aria-hidden={
							breakpoint === BREAKPOINT_SMALL ? false : true
						}
					>
						<Button
							aria-label={ __( 'Back', 'google-site-kit' ) }
							className="googlesitekit-dialog__back"
							onClick={ closeDialog }
						>
							<Icon icon={ arrowLeft } />
						</Button>
					</div>

					<DialogContent className="googlesitekit-dialog__content">
						<div className="googlesitekit-dialog__titles">
							<h2 className="googlesitekit-dialog__title">
								{ __(
									'Dashboard sharing & permissions',
									'google-site-kit'
								) }
							</h2>

							<p className="googlesitekit-dialog__subtitle">
								{ createInterpolateElement(
									__(
										'Share a view-only version of your Site Kit dashboard with other WordPress roles. <a>Learn more</a>',
										'google-site-kit'
									),
									{
										a: (
											<Link
												aria-label={ __(
													'Learn more about dashboard sharing',
													'google-site-kit'
												) }
												href="https://sitekit.withgoogle.com/documentation/using-site-kit/dashboard-sharing/"
												external
												hideExternalIndicator
												inherit
											/>
										),
									}
								) }
							</p>
						</div>
					</DialogContent>

					<DialogFooter className="googlesitekit-dialog__footer">
						<Link onClick={ closeDialog }>
							{ __( 'Cancel', 'google-site-kit' ) }
						</Link>

						{ /* @TODO: Update Apply button behaviour */ }
						<Button onClick={ closeDialog }>
							{ __( 'Apply', 'google-site-kit' ) }
						</Button>
					</DialogFooter>
				</Dialog>
			</Portal>
		</Fragment>
	);
}
