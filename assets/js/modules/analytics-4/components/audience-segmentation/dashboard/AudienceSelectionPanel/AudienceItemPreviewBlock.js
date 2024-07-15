/**
 * AudienceItemPreviewBlock component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import PreviewBlock from '../../../../../../components/PreviewBlock';

export default function AudienceItemPreviewBlock() {
	return (
		<div className="googlesitekit-selection-panel__loading">
			<div className="googlesitekit-selection-panel__loading-left">
				<PreviewBlock
					width="90px"
					height="20px"
					className="googlesitekit-selection-panel__loading-item"
				/>
				<PreviewBlock
					width="293px"
					height="15px"
					className="googlesitekit-selection-panel__loading-item"
				/>
			</div>
			<div className="googlesitekit-selection-panel__loading-right">
				<PreviewBlock
					width="43px"
					height="20px"
					className="googlesitekit-selection-panel__loading-item"
				/>
			</div>
		</div>
	);
}
