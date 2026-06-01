/**
 * TopAuthorsZeroState component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export interface TopAuthorsZeroStateProps {
	hasMissingCustomDimensions: boolean;
	isGatheringData: boolean | null | undefined;
	customDimensionsLoading: boolean;
	onCreateCustomDimensions: () => void;
}

const TopAuthorsZeroState: FC< TopAuthorsZeroStateProps > = ( {
	hasMissingCustomDimensions,
	isGatheringData,
	customDimensionsLoading,
	onCreateCustomDimensions,
} ) => {
	if ( hasMissingCustomDimensions ) {
		return (
			<div className="googlesitekit-table-tile__custom-dimensions-missing">
				<p className="googlesitekit-table-tile__custom-dimensions-missing-title">
					{ __( 'No data to show', 'google-site-kit' ) }
				</p>

				<p className="googlesitekit-table-tile__custom-dimensions-missing-description">
					{ __(
						'Update Analytics to track metric',
						'google-site-kit'
					) }
				</p>

				<div className="googlesitekit-table-tile__custom-dimensions-missing-actions">
					<button
						type="button"
						className="googlesitekit-table-tile__custom-dimensions-missing-button"
						onClick={ onCreateCustomDimensions }
						disabled={ customDimensionsLoading }
					>
						{ __( 'Update', 'google-site-kit' ) }
					</button>
				</div>
			</div>
		);
	}

	if ( isGatheringData ) {
		return (
			<span>
				{ __(
					'Setup successful: Analytics is gathering data for this metric',
					'google-site-kit'
				) }
			</span>
		);
	}

	return null;
};

export default TopAuthorsZeroState;
