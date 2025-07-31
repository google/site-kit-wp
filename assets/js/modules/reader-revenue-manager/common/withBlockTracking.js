/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress-core/element';

/**
 * Internal dependencies
 */
import { dispatch, select } from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '../datastore/constants';
import { trackEvent } from '@/js/util';
import { VIEW_CONTEXT_WP_BLOCK_EDITOR } from '@/js/googlesitekit/constants';

/**
 * Wraps a component to add block tracking functionality.
 *
 * This HOC tracks when Reader Revenue Manager blocks are inserted into
 * the block editor. It ensures each block is only tracked once upon insertion.
 *
 * @since n.e.x.t
 *
 * @param {WPComponent} BlockComponent The block component to wrap.
 * @return {WPComponent} The wrapped component with tracking functionality.
 */
export function withBlockTracking( BlockComponent ) {
	return function WrappedBlockComponent( props ) {
		useEffect( () => {
			const canTrackBlock = select(
				MODULES_READER_REVENUE_MANAGER
			).canTrackBlock( props.blockID );

			if ( canTrackBlock ) {
				trackEvent(
					`${ VIEW_CONTEXT_WP_BLOCK_EDITOR }_rrm`,
					'insert_block',
					props.label
				);

				dispatch( MODULES_READER_REVENUE_MANAGER ).setSeenBlockID(
					props.blockID
				);
			}
		}, [ props.blockID, props.label ] );
		return <BlockComponent { ...props } />;
	};
}
