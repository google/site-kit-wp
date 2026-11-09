/**
 * Key factor card placeholder.
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
 * Internal dependencies
 */
import PreviewBlock from '@/js/components/PreviewBlock';

// The blocks take the places of a card's parts, at the heights of a card with
// a one-line name and two attributes, so the cards replace the placeholders
// without moving the breakdown below them.
const KeyFactorCardPlaceholder: FC = () => (
	<div className="googlesitekit-traffic-overview__key-factor googlesitekit-traffic-overview__key-factor--loading">
		<div className="googlesitekit-traffic-overview__key-factor-header">
			<PreviewBlock
				className="googlesitekit-traffic-overview__key-factor-title-placeholder"
				width="50%"
				height="24px"
			/>
			<PreviewBlock
				className="googlesitekit-traffic-overview__key-factor-change-badge-placeholder"
				width="80px"
				height="28px"
			/>
		</div>
		<div className="googlesitekit-traffic-overview__key-factor-attributes">
			<PreviewBlock
				className="googlesitekit-traffic-overview__key-factor-attributes-heading-placeholder"
				width="70%"
				height="20px"
			/>
			<div className="googlesitekit-traffic-overview__key-factor-attribute-list">
				{ /* Each attribute is its 16px title over its 24px row. */ }
				<PreviewBlock width="100%" height="40px" />
				<PreviewBlock width="100%" height="40px" />
			</div>
		</div>
	</div>
);

export default KeyFactorCardPlaceholder;
