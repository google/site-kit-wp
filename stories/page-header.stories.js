/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { removeAllFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import PageHeader from '../assets/js/components/page-header';

storiesOf( 'Global', module )
	.add( 'Page Headers', () => {
		removeAllFilters( 'googlesitekit.showDateRangeSelector-analytics' );
		return <div>
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
		</div>;
	} );
