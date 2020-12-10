/**
 * Button Component Stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Button from '../assets/js/components/Button';

storiesOf( 'Global', module )
	.add( 'Buttons', () => {
		return (
			<div>
				<p>
					<Button>
						Default Button
					</Button>
				</p>
				<p>
					<Button className="googlesitekit-button--hover">
						VRT: Default Button Hover
					</Button>
				</p>
				<p>
					<Button
						href="http://google.com"
					>
						Default Button Link
					</Button>
				</p>
				<p>
					<Button
						href="http://google.com"
						danger
					>
						Danger Button
					</Button>
				</p>
				<p>
					<Button
						disabled
					>
						Disabled Button
					</Button>
				</p>
			</div>
		);
	}, {
		options: {
			hoverSelector: '.googlesitekit-button--hover',
			postInteractionWait: 3000, // Wait for shadows to animate.
			onReadyScript: 'mouse.js',
		},
	} );
