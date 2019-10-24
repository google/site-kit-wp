/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
import PageHeader from 'GoogleComponents/page-header';

storiesOf( 'Global', module )
	.add( 'Page Headers', () => (
		<div>
			<p>
				<PageHeader
					title="Module Page Title"
					status="connected"
					statusText="Analytics is connected"
				/>
			</p>
			<p>
				<PageHeader
					title="Module Page Title with Icon"
					icon
					iconWidth="23"
					iconHeight="26"
					iconID="analytics"
					status="not-connected"
					statusText="Analytics is not connected"
				/>
			</p>
		</div>
	) );
