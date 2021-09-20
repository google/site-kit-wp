const { __ } = wp.i18n;
const { compose } = wp.compose;
const { PluginDocumentSettingPanel } = wp.editPost;
const { registerPlugin } = wp.plugins;
const { SelectControl, PanelRow } = wp.components;
const { withSelect, withDispatch } = wp.data;

// eslint-disable-next-line no-undef
const e = React.createElement;

function Component( { postType, postMeta, setPostMeta } ) {
	if ( postType !== 'post' ) {
		return null;
	}

	return e(
		PluginDocumentSettingPanel,
		{
			title: __( 'Reader revenue', 'google-site-kit' ),
			initialOpen: true,
			icon: 'money-alt',
		},
		[
			e(
				PanelRow,
				null,
				e( SelectControl, {
					label: __( 'Access', 'google-site-kit' ),
					value: postMeta.sitekit__reader_revenue__product,
					labelPosition: 'side',
					options: [
						{ label: '— Free —', value: 'openaccess' },
						{ label: 'Basic', value: 'basic' },
						{ label: 'Premium', value: 'premium' },
					],
					onChange: ( value ) =>
						setPostMeta( {
							sitekit__reader_revenue__product: value,
						} ),
				} )
			),
			__( 'Preview this in the top admin bar', 'google-site-kit' ),
		]
	);
}

const WrappedComponent = compose( [
	withSelect( ( select ) => {
		return {
			postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
			postType: select( 'core/editor' ).getCurrentPostType(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			setPostMeta( newMeta ) {
				dispatch( 'core/editor' ).editPost( { meta: newMeta } );
			},
		};
	} ),
] )( Component );

registerPlugin( 'sitekit--reader-revenue--gutenberg', {
	render() {
		return e( WrappedComponent );
	},
} );
