import { useEffect, useRef } from '@wordpress-core/element';

import Data from 'googlesitekit-data';

const { subscribe, select } = Data;

const withBlockTracking = ( WrappedComponent, blocksToTrack = [] ) => {
	return function BlockTrackingWrapper( props ) {
		const previousBlocksRef = useRef( [] );

		useEffect( () => {
			const trackEvent = ( eventName, details ) => {
				// eslint-disable-next-line no-console
				console.log( `[Block Tracking] ${ eventName }:`, details );
			};

			const trackBlockChanges = () => {
				const currentBlocks = select( 'core/block-editor' ).getBlocks();
				const isEditorReady =
					select( 'core/editor' ).__unstableIsEditorReady();

				if (
					! isEditorReady ||
					( isEditorReady && ! currentBlocks.length )
				) {
					return;
				}

				if ( previousBlocksRef.current.length ) {
					currentBlocks.forEach( ( block ) => {
						if (
							blocksToTrack.includes( block.name ) &&
							! previousBlocksRef.current.some(
								// eslint-disable-next-line sitekit/acronym-case
								( prev ) => prev.clientId === block.clientId
							)
						) {
							trackEvent( 'block_inserted', {
								name: block.name,
							} );
						}
					} );
				}

				previousBlocksRef.current = currentBlocks;
			};

			const unsubscribe = subscribe( trackBlockChanges );

			return () => unsubscribe();
		}, [] );

		return <WrappedComponent { ...props } />;
	};
};

export default withBlockTracking;
