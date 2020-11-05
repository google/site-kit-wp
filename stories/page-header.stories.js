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
import AnalyticsIcon from '../assets/svg/analytics.svg';
import PageHeader from '../assets/js/components/PageHeader';

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
					icon={
						<AnalyticsIcon
							className="googlesitekit-page-header__icon"
							width={ 23 }
							height={ 26 }
						/>
					}
					status="not-connected"
					statusText="Analytics is not connected"
				/>
			</p>
		</div>;
	} );
