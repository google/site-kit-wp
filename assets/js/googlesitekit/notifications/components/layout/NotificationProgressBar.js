/**
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
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../../../../material-components';
import { ProgressBar } from 'googlesitekit-components';

export default function NotificationProgressBar() {
	// Wrap in the googlesitekit-publisher-win class to ensure the output is treated in the same way as BannerNotification,
	// with only one instance visible on the screen at a time.
	return (
		<div className="googlesitekit-publisher-win">
			<Grid>
				<Row>
					<Cell size={ 12 }>
						<ProgressBar />
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}
