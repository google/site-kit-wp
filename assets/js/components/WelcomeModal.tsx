/**
 * WelcomeModal component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { Button } from 'googlesitekit-components';
import { Dialog, DialogContent, DialogFooter } from '@/js/material-components';
import P from '@/js/components/Typography/P';
import Typography from '@/js/components/Typography';
// @ts-expect-error - We need to add types for imported SVGs.
import CloseIcon from '@/svg/icons/close.svg';
// @ts-expect-error - We need to add types for imported SVGs.
import WelcomeModalGraphic from '@/svg/graphics/welcome-modal-graphic.svg';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type SelectFunction = ( select: any ) => any;

export default function WelcomeModal() {
	const analyticsConnected = useSelect( ( select: SelectFunction ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);

	const analyticsGatheringData = useSelect( ( select: SelectFunction ) => {
		if ( ! analyticsConnected ) {
			return false;
		}
		return select( MODULES_ANALYTICS_4 ).isGatheringData();
	} );

	const searchConsoleGatheringData = useSelect( ( select: SelectFunction ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);

	const showGatheringDataModal = analyticsConnected
		? analyticsGatheringData
		: searchConsoleGatheringData;

	if ( showGatheringDataModal === undefined ) {
		// TODO: Implement a loading state when we have a design for it in phase 3 of the Setup Flow Refresh epic.
		return null;
	}

	const description = showGatheringDataModal
		? createInterpolateElement(
				__(
					'Initial setup complete!<br />Site Kit is gathering data and soon metrics for your site will show on your dashboard',
					'google-site-kit'
				),
				{
					br: <br />,
				}
		  )
		: __(
				'Initial setup complete! Take a look at the special features Site Kit added to your dashboard based on your site goals',
				'google-site-kit'
		  );

	return (
		<Dialog
			onClose={ () => {} }
			className="googlesitekit-dialog googlesitekit-welcome-modal"
			open
		>
			<DialogContent className="googlesitekit-welcome-modal__content">
				<div className="googlesitekit-welcome-modal__graphic">
					<WelcomeModalGraphic />

					<Button
						// @ts-expect-error - The `Button` component is not typed yet.
						className="googlesitekit-welcome-modal__close-button"
						icon={ <CloseIcon width={ 10 } height={ 10 } /> }
						onClick={ () => {} }
						aria-label={ __( 'Close', 'google-site-kit' ) }
						hideTooltipTitle
					/>
				</div>

				<div className="googlesitekit-welcome-modal__text">
					<Typography
						as="h1"
						className="googlesitekit-welcome-modal__title"
						size="large"
						type="headline"
					>
						{ __( 'Welcome to Site Kit', 'google-site-kit' ) }
					</Typography>

					<P
						type="body"
						size="medium"
						className="googlesitekit-welcome-modal__description"
					>
						{ description }
					</P>
				</div>
			</DialogContent>

			<DialogFooter className="googlesitekit-welcome-modal__footer">
				{ showGatheringDataModal ? (
					// @ts-expect-error - The `Button` component is not typed yet.
					<Button onClick={ () => {} }>
						{ __( 'Get started', 'google-site-kit' ) }
					</Button>
				) : (
					<Fragment>
						{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
						<Button onClick={ () => {} } tertiary>
							{ __( 'Maybe later', 'google-site-kit' ) }
						</Button>
						{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
						<Button onClick={ () => {} }>
							{ __( 'Take the tour', 'google-site-kit' ) }
						</Button>
					</Fragment>
				) }
			</DialogFooter>
		</Dialog>
	);
}
