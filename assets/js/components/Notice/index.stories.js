/**
 * Notice stories.
 *
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
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../../material-components';
import Notice from '.';
import Link from '../Link';

function Template() {
	return (
		<Grid className="googlesitekit-widget-area googlesitekit-widget-area--boxes">
			<Row className="googlesitekit-widget-area-widgets">
				<Cell size={ 12 }>
					<h3>Info Notice</h3>

					<Notice
						title="With info notice title"
						description="Use the new settings in the block editor select different product IDs for individual pages or control where CTAs appear."
						dismissButton={ {
							label: 'Got it',
							onClick: () => {},
						} }
						ctaButton={ {
							label: 'Take action',
							onClick: () => {},
						} }
					/>
					<br />
					<Notice
						description={ createInterpolateElement(
							'Use the new settings in the block editor select different product IDs for individual pages or control where CTAs appear on an individual post. You can also configure a different product ID for a group of posts in the <a>Categories</a> or <a>Tags section</a>. <a>Learn more</a>',
							{
								a: <Link href="#" />,
							}
						) }
						dismissButton={ {
							label: 'Got it',
							onClick: () => {},
						} }
					/>
				</Cell>
				<Cell size={ 12 }>
					<h3>Success Notice</h3>
					<Notice
						title="Success! Your Reader Revenue Manager is set up"
						description="You can edit your setting and select which of your site pages will include Reader Revenue Manager CTAs."
						dismissButton={ {
							label: 'Got it',
							onClick: () => {},
						} }
						ctaButton={ {
							label: 'Edit settings',
							onClick: () => {},
						} }
						type="success"
					/>
					<br />
					<Notice
						description="Success! Your Reader Revenue Manager is set up!"
						dismissButton={ {
							label: 'Got it',
							onClick: () => {},
						} }
						ctaButton={ {
							label: 'Edit settings',
							onClick: () => {},
						} }
						type="success"
					/>
				</Cell>
				<Cell size={ 12 }>
					<h3>Warning Notice</h3>
					<Notice
						description="To complete your paywall setup add your products ID in settings"
						dismissButton={ {
							label: 'Got it',
							onClick: () => {},
						} }
						ctaButton={ {
							label: 'Edit settings',
							onClick: () => {},
						} }
						type="warning"
					/>
					<br />
					<Notice
						title="Potential Analytics tracking conflict"
						description="To complete your paywall setup add your products ID in settings"
						dismissButton={ {
							label: 'Got it',
							onClick: () => {},
						} }
						ctaButton={ {
							label: 'Edit settings',
							onClick: () => {},
						} }
						type="warning"
					/>
				</Cell>
				<Cell size={ 12 }>
					<h3>Error Notice</h3>
					<Notice
						title="Potential Analytics tracking loss"
						description={ createInterpolateElement(
							'You need to complete the 2 steps below or you will lose all Analytics tracking. <a>Learn more</a>',
							{
								a: <Link href="#" />,
							}
						) }
						dismissButton={ {
							label: 'Got it',
							onClick: () => {},
						} }
						type="error"
					/>
					<br />
					<Notice
						description={ createInterpolateElement(
							'You need to complete the 2 steps below or you will lose all Analytics tracking. <a>Learn more</a>',
							{
								a: <Link href="#" />,
							}
						) }
						dismissButton={ {
							label: 'Got it',
							onClick: () => {},
						} }
						ctaButton={ {
							label: 'Edit settings',
							onClick: () => {},
						} }
						type="error"
					/>
				</Cell>
				<Cell size={ 12 }>
					<h3>New Notice</h3>
					<Notice
						title="New key metrics were added!"
						description={ createInterpolateElement(
							'We’ve extended your metrics selection with metrics that aren’t available by default in Analytics. Add them to your dashboard to get a better understanding of how users interact with your site. <a>Learn more</a>',
							{
								a: <Link href="#" />,
							}
						) }
						dismissButton={ {
							label: 'Maybe later',
							onClick: () => {},
						} }
						ctaButton={ {
							label: 'Add metrics',
							onClick: () => {},
						} }
						type="new"
					/>
					<br />
					<Notice
						description={ createInterpolateElement(
							'We’ve extended your metrics selection with metrics that aren’t available by default in Analytics!',
							{
								a: <Link href="#" />,
							}
						) }
						dismissButton={ {
							label: 'Got it',
							onClick: () => {},
						} }
						ctaButton={ {
							label: 'Add metrics',
							onClick: () => {},
						} }
						type="new"
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

export const AllNotices = Template.bind( {} );
AllNotices.storyName = 'All Notices';
AllNotices.scenario = {};

export default {
	title: 'Components/Notice',
	decorators: [
		( Story ) => {
			return (
				<div>
					<Story />
				</div>
			);
		},
	],
};
