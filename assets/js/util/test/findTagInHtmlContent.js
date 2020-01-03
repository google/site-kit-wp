/**
 * Internal dependencies
 */
import { findTagInHtmlContent } from '../';

const valuesToTest = [
	[
		'<script> window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date; ga(\'create\', \'UA-XXXXX-Y\', \'auto\'); ga(\'send\', \'pageview\'); </script><script async src=\'https://www.google-analytics.com/analytics.js\'></script>',
		'analytics',
		'UA-XXXXX-Y',
	],
	[
		'<script> (function(i,s,o,g,r,a,m){i[\'GoogleAnalyticsObject\']=r;i[r]=i[r]||function(){ (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o), m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m) })(window,document,\'script\',\'https://www.google-analytics.com/analytics.js\',\'ga\'); ga(\'create\', \'UA-XXXXX-Y\', \'auto\'); ga(\'send\', \'pageview\'); </script>',
		'analytics',
		'UA-XXXXX-Y',
	],
	[
		'<meta charset="UTF-8"><title>Site Kit for WordPress</title><link rel="dns-prefetch" href="//fonts.googleapis.com"></link>',
		'analytics',
		false,
	],
	[
		'<meta charset="UTF-8"><title>Site Kit for WordPress</title><link rel="dns-prefetch" href="//fonts.googleapis.com"></link>',
		'adsense',
		false,
	],
	[
		'<script data-ad-client="ca-pub-1234567890" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>',
		'adsense',
		'ca-pub-1234567890',
	],
	[
		'<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" async data-ad-client="ca-pub-1234567890"></script>',
		'adsense',
		'ca-pub-1234567890',
	],
	[
		'<script async src="http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script> <script> (adsbygoogle = window.adsbygoogle || []).push({ google_ad_client: "ca-pub-123456789", enable_page_level_ads: true }); </script>',
		'adsense',
		'ca-pub-123456789',
	],
	[
		'<script>(window,document,\'script\',\'//www.google-analytics.com/analytics.js\',\'ga\');ga(\'create\', \'UA-12345-1\', \'auto\');ga(\'send\', \'pageview\');</script>',
		'analytics',
		'UA-12345-1',
	],
	[
		'<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX"></script>',
		'tagmanager',
		'GTM-XXXXXXX',
	],
	[
		'<amp-analytics config="https://www.googletagmanager.com/amp.json?id=GTM-XXXXXXX" data-credentials="include" class="i-amphtml-element i-amphtml-layout-fixed i-amphtml-layout-size-defined i-amphtml-layout" i-amphtml-layout="fixed" aria-hidden="true" style="width: 1px; height: 1px;" hidden=""></amp-analytics>',
		'tagmanager',
		'GTM-XXXXXXX',
	],
	[
		'<meta charset="UTF-8"><title>Site Kit for WordPress</title><link rel="dns-prefetch" href="//fonts.googleapis.com"></link>',
		'tagmanager',
		false,
	],
	[
		[
			'<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':',
			'new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],',
			'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=',
			'\'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);',
			'})(window,document,\'script\',\'dataLayer\',\'GTM-XXXXXXX\');</script>',
		].join( '\n' ),
		'tagmanager',
		'GTM-XXXXXXX',
	],
	[
		[
			'<script data-cfasync="false">//<![CDATA[',
			'(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':',
			'new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],',
			'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=',
			'\'//www.googletagmanager.com/gtm.\'+\'js?id=\'+i+dl;f.parentNode.insertBefore(j,f);',
			'})(window,document,\'script\',\'dataLayer\',\'GTM-XXXXXXX\');//]]>',
			'</script>',
		].join( '\n' ),
		'tagmanager',
		'GTM-XXXXXXX',
	],
];

describe( 'findTagInHtmlContent', () => {
	it.each( valuesToTest )( 'for HTML %s and module %s should find tag %s', ( html, module, expected ) => {
		expect( findTagInHtmlContent( html, module ) ).toStrictEqual( expected );
	} );
} );
