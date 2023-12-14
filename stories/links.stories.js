/**
 * Link Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import PencilIcon from '../assets/svg/icons/pencil-alt.svg';
import Link from '../assets/js/components/Link';
import VisuallyHidden from '../assets/js/components/VisuallyHidden';

storiesOf( 'Global', module ).add(
	'Links',
	() => {
		return (
			<div>
				<p>
					<Link href="http://google.com">Default Link</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						className="googlesitekit-cta-link--hover"
					>
						VRT: Default Link Hovered
					</Link>
				</p>
				<p>
					<Link href="http://google.com" secondary>
						Secondary Link
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						className="googlesitekit-cta-link--hover"
						secondary
					>
						VRT: Secondary Link Hovered
					</Link>
				</p>
				<p>
					<Link onClick={ () => {} }>Default Link Button</Link>
				</p>
				<p>
					<Link
						onClick={ () => {} }
						className="googlesitekit-cta-link--hover"
					>
						Default Link Button Hovered
					</Link>
				</p>
				<p>
					<Link onClick={ () => {} }>
						<PencilIcon width={ 18 } height={ 18 } />
						Default Link Button With Icon
					</Link>
				</p>
				<p>
					<Link
						onClick={ () => {} }
						className="googlesitekit-cta-link--hover"
					>
						<PencilIcon width={ 18 } height={ 18 } />
						VRT: Default Link Button With Icon Hovered
					</Link>
				</p>
				<p>
					<Link onClick={ () => {} } secondary>
						Secondary Link Button
					</Link>
				</p>
				<p>
					<Link
						onClick={ () => {} }
						className="googlesitekit-cta-link--hover"
						secondary
					>
						VRT: Secondary Link Button Hovered
					</Link>
				</p>
				<p>
					<Link onClick={ () => {} } secondary>
						<PencilIcon width={ 18 } height={ 18 } />
						Secondary Link Button With Icon
					</Link>
				</p>
				<p>
					<Link
						onClick={ () => {} }
						className="googlesitekit-cta-link--hover"
						secondary
					>
						<PencilIcon width={ 18 } height={ 18 } />
						VRT: Secondary Link Button With Icon Hovered
					</Link>
				</p>
				<p>
					<Link href="http://google.com" small>
						Small Link
					</Link>
				</p>
				<p>
					<Link href="http://google.com" inverse>
						Inverse Link
					</Link>
				</p>
				<p>
					<Link href="http://google.com" back>
						Back Link
					</Link>
				</p>
				<p>
					<Link href="http://google.com" external>
						External Link
					</Link>
				</p>
				<p>
					<Link href="http://google.com" external>
						External <VisuallyHidden>I am hiding </VisuallyHidden>
						Link with VisuallyHidden content
					</Link>
				</p>
				<p>
					<Link href="http://google.com" caps>
						All Caps Link
					</Link>
				</p>
				<p>
					<Link href="http://google.com" caps arrow>
						All Caps Link with Arrow
					</Link>
				</p>
				<p>
					<Link href="http://google.com" caps arrow inverse>
						Inverse All Caps Link with Arrow
					</Link>
				</p>
				<p>
					<Link href="http://google.com" danger>
						Danger Link
					</Link>
				</p>
				<p>
					<Link href="http://google.com" disabled>
						Disabled Link
					</Link>
				</p>
			</div>
		);
	},
	{
		options: {
			hoverSelector: '.googlesitekit-cta-link--hover',
			onReadyScript: 'mouse.js',
		},
	}
);
