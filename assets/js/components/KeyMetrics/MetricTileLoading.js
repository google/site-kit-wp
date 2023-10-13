/**
 * MetricTileLoading component.
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
 * Internal dependencies
 */
import MetricTileHeader from './MetricTileHeader';
import PreviewBlock from '../PreviewBlock';

export default function MetricTileLoading( { infoTooltip, title } ) {
	return (
		<div className="googlesitekit-km-widget-tile">
			<MetricTileHeader title={ title } infoTooltip={ infoTooltip } />
			<div className="googlesitekit-km-widget-tile__body">
				<div className="googlesitekit-km-widget-tile__loading">
					<PreviewBlock
						className="googlesitekit-km-widget-tile__loading-header"
						width="100%"
						height="14px"
					/>
					<PreviewBlock
						className="googlesitekit-km-widget-tile__loading-body"
						width="100%"
						height="53px"
					/>
				</div>
			</div>
		</div>
	);
}
