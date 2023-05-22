import useLatestIntersection from '../../../../hooks/useLatestIntersection';

import Data from 'googlesitekit-data';
import { CORE_UI } from '../../../datastore/ui/constants';
import { useEffect } from '@wordpress/element';
import { useHasBeenViewed } from '../useHasBeenViewed';

const { useDispatch } = Data;

export default function ViewedStateObserver( { id, observeRef, threshold } ) {
	const intersectionEntry = useLatestIntersection( observeRef, {
		threshold,
	} );

	const { setValue } = useDispatch( CORE_UI );
	const isInView = !! intersectionEntry.intersectionRatio;
	const viewed = useHasBeenViewed( id );

	useEffect( () => {
		if ( ! viewed && isInView ) {
			setValue( useHasBeenViewed.getKey( id ), true );
		}
	}, [ viewed, isInView, setValue, id ] );

	return null;
}
