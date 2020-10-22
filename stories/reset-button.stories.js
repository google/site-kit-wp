/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import ResetButton from '../assets/js/components/ResetButton';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Global', module )
	.add( 'Reset Button', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				adminURL: '#',
			} );
		};
		return (
			<WithTestRegistry callback={ setupRegistry } >
				<ResetButton>
					Reset Site Kit Button
				</ResetButton>
			</WithTestRegistry>
		);
	}, {
		options: {
			delay: 1000,
		},
	} );
