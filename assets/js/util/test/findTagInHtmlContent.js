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
];

describe( 'findTagInHtmlContent', () => {
	it.each( valuesToTest )( 'for HTML %s and module %s should find tag %s', ( html, module, expected ) => {
		expect( findTagInHtmlContent( html, module ) ).toStrictEqual( expected );
	} );
} );
