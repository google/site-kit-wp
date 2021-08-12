import { useState, useCallback } from 'react';
import { useLifecycles } from 'react-use';

export const useHash = () => {
	const [ hash, setHash ] = useState( () => global.location.hash );

	const onHashChange = useCallback( () => {
		setHash( global.location.hash );
	}, [] );

	useLifecycles(
		() => {
			global.addEventListener( 'hashchange', onHashChange );
		},
		() => {
			global.removeEventListener( 'hashchange', onHashChange );
		}
	);

	const _setHash = useCallback(
		( _newHash, replaceInHistory ) => {
			/*
      global.location.hash can be set with or without the # sign
      we do the same here and prepend # if it is missing

      this also avoids refreshing the page if _newHash is '' and replaceInHistory is true
    */
			const newHash = _newHash[ 0 ] === '#' ? _newHash : '#' + _newHash;
			if ( newHash !== hash ) {
				if ( replaceInHistory ) {
					global.location.replace(
						global.location.pathname +
							global.location.search +
							newHash
					);
				} else {
					global.location.hash = newHash;
				}
			}
		},
		[ hash ]
	);

	return [ hash, _setHash ];
};
