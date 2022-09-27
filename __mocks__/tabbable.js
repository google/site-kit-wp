const lib = jest.requireActual( 'focus-trap-react/node_modules/tabbable' );

const tabbable = {
	...lib,
	isFocusable: ( node, options ) =>
		lib.isFocusable( node, { ...options, displayCheck: 'none' } ),
	isTabbable: ( node, options ) =>
		lib.isTabbable( node, { ...options, displayCheck: 'none' } ),
	tabbable: ( node, options ) =>
		lib.tabbable( node, { ...options, displayCheck: 'none' } ),
	focusable: ( node, options ) =>
		lib.focusable( node, { ...options, displayCheck: 'none' } ),
};

module.exports = tabbable;
