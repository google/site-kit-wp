/**
 * Selection Panel Header
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '../Link';
import CloseIcon from '../../../svg/icons/close.svg';

function SelectionPanelHeader( {
	onCloseClick,
	onSettingsClick,
	heading,
	headerText,
	isSavingSettings,
	isViewOnly,
} ) {
	const className = 'googlesitekit-km-selection-panel-header';

	return (
		<header className={ className }>
			<div className={ `${ className }__row` }>
				<h3>{ heading }</h3>
				<Link
					className={ `${ className }__close` }
					onClick={ onCloseClick }
					linkButton
				>
					<CloseIcon width="15" height="15" />
				</Link>
			</div>
			{ ! isViewOnly && (
				<p>
					{ createInterpolateElement(
						// eslint-disable-next-line @wordpress/i18n-no-variables
						__( `${ headerText }`, 'google-site-kit' ),
						{
							link: (
								<Link
									secondary
									onClick={ onSettingsClick }
									disabled={ isSavingSettings }
								/>
							),
							strong: <strong />,
						}
					) }
				</p>
			) }
		</header>
	);
}

export default SelectionPanelHeader;
