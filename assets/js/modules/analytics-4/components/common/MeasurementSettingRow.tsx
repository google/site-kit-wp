/**
 * MeasurementSettingRow component.
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
import classnames from 'classnames';
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import CheckMark from '@/svg/icons/check-2.svg';
import StarFill from '@/svg/icons/star-fill.svg';

interface MeasurementSettingRowProps {
	isEnabled?: boolean;
	loading?: boolean;
	title: string;
	description: ReactNode;
	action?: ReactNode;
}

const MeasurementSettingRow: FC< MeasurementSettingRowProps > = ( {
	isEnabled = false,
	loading = false,
	title,
	description,
	action = null,
} ) => {
	if ( loading ) {
		return (
			<div className="googlesitekit-settings-measurement-row googlesitekit-settings-measurement-row--loading">
				<ProgressBar small compress />
			</div>
		);
	}

	return (
		<div className="googlesitekit-settings-measurement-row">
			<div
				className={ classnames(
					'googlesitekit-settings-measurement-row__icon',
					{
						'googlesitekit-settings-measurement-row__icon--check':
							isEnabled,
					}
				) }
			>
				{ isEnabled ? <CheckMark /> : <StarFill /> }
			</div>

			<div className="googlesitekit-settings-measurement-row__content">
				<div className="googlesitekit-settings-measurement-row__details">
					<p className="googlesitekit-settings-measurement-row__title">
						{ title }
					</p>
					<p className="googlesitekit-module-settings-group__helper-text">
						{ description }
					</p>
				</div>

				{ ! isEnabled && action && (
					<div className="googlesitekit-settings-measurement-row__action">
						{ action }
					</div>
				) }
			</div>
		</div>
	);
};

export default MeasurementSettingRow;
