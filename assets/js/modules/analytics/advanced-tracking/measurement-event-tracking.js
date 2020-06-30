let config;
for ( config of eventConfigurations ) {
	const thisConfig = config;
	document.addEventListener( config.on, function( e ) {
		if ( e.target.matches( thisConfig.selector ) ) {
			//alert( 'Got an event called: '.concat( thisConfig.action ) );
			//record event with gtag here
		} else if ( e.target.matches( thisConfig.selector.concat( ' *' ) ) ) {
			//alert( 'Got an event called: '.concat( thisConfig.action ) );
			//record event with gtag here
		}
	}, true );
}
