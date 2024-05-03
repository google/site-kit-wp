/**
 * Key Metrics Selection Panel Footer
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ErrorNotice from '../ErrorNotice';

export default function SelectionPanelFooter( {
	DisplayError = null,
	saveError,
	selectedMetricsCount = 0,
	CancelButton,
	SaveButton,
} ) {
	const className = 'googlesitekit-km-selection-panel-footer';

	return (
		<footer className={ className }>
			{ saveError && <ErrorNotice error={ saveError } /> }
			<div className={ `${ className }__content` }>
				{ DisplayError !== null ? (
					<DisplayError />
				) : (
					<p className={ `${ className }__metric-count` }>
						{ createInterpolateElement(
							sprintf(
								/* translators: 1: Number of selected metrics. 2: Maximum number of metrics that can be selected. */
								__(
									'%1$d selected <MaxCount>(up to %2$d)</MaxCount>',
									'google-site-kit'
								),
								selectedMetricsCount,
								4
							),
							{
								MaxCount: (
									<span
										className={ `${ className }__metric-count--max-count` }
									/>
								),
							}
						) }
					</p>
				) }
				<div className={ `${ className }__actions` }>
					<CancelButton />
					<SaveButton />
				</div>
			</div>
		</footer>
	);
}

SelectionPanelFooter.propTypes = {
	savedMetrics: PropTypes.array,
	onNavigationToOAuthURL: PropTypes.func,
};
