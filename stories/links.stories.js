/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Link from '../assets/js/components/link';

storiesOf( 'Global', module )
	.add( 'Links', () => {
		return (
			<div>
				<p>
					<Link
						href="http://google.com"
					>
						Default Link
					</Link>
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
					<Link>
						Default Link Button
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						inherit
					>
						Inherited Link
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						small
					>
						Small Link
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						inverse
					>
						Inverse Link
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						back
					>
						Back Link
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						external
					>
						External Link
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						caps
					>
						All Caps Link
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						caps
						arrow
					>
						All Caps Link with Arrow
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						caps
						arrow
						inverse
					>
						Inverse All Caps Link with Arrow
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						danger
					>
						Danger Link
					</Link>
				</p>
				<p>
					<Link
						href="http://google.com"
						disabled
					>
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
	} );
