<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Source_Classifier
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

/**
 * Names the session sources and campaigns a key factor card may show, by the
 * rules of service §5.9.
 *
 * A source that is no site a reader would recognise, such as a placeholder, a
 * staging host or an audit tool, is left out, and so is a search engine, whose
 * visits belong to search. The other sources are named the way the service
 * names them, so a card and the insight's text name a platform the same way:
 * `m.facebook.com` and `fb` are both `Facebook`, `t.co` is `x.com`, and so on.
 * A source shaped like a campaign name is a campaign, named for readers.
 *
 * The service also screens names for sensitive content in many languages. The
 * plugin doesn't port that screen: the service applies it to the cards it
 * receives, and leaves out what it can't narrate.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Source_Classifier {

	/**
	 * The kind of a source that names a site.
	 *
	 * @since n.e.x.t
	 */
	const REFERRING_SITE = 'REFERRING_SITE';

	/**
	 * The kind of a source shaped like a campaign name.
	 *
	 * @since n.e.x.t
	 */
	const CAMPAIGN = 'CAMPAIGN';

	/**
	 * The most characters a campaign name keeps.
	 *
	 * @since n.e.x.t
	 */
	const MAX_CAMPAIGN_LENGTH = 100;

	/**
	 * The search engines, by the names Analytics reports them as.
	 *
	 * @since n.e.x.t
	 */
	const SEARCH_ENGINE_NAMES = array( 'google', 'bing', 'yahoo', 'baidu', 'duckduckgo', 'ecosia', 'yandex', 'naver', 'seznam', 'qwant', 'startpage', 'ask', 'aol' );

	/**
	 * The search engines' own hosts, without `www.`.
	 *
	 * @since n.e.x.t
	 */
	const SEARCH_ENGINE_HOSTS = array( 'google.com', 'bing.com', 'yahoo.com', 'search.yahoo.com', 'baidu.com', 'm.baidu.com', 'duckduckgo.com', 'ecosia.org', 'naver.com', 'seznam.cz', 'qwant.com', 'startpage.com', 'ask.com', 'aol.com' );

	/**
	 * The patterns of the internal, staging, hosting, CDN, mail scanner and
	 * audit tool hosts, whose visits no reader would recognise as a source.
	 *
	 * @since n.e.x.t
	 */
	const HIDDEN_HOST_PATTERNS = array(
		'/(^|\.)corp\.google\.com$/',
		'/^art-analytics\.appspot\.com$/',
		'/^tagassistant\.google\.com$/',
		'/\.internal$/',
		'/sandbox/',
		'/^(dev|stage|staging|test|preview)\./',
		'/(^|\.)instawp\./',
		'/\.pantheonsite\.io$/',
		'/(^|\.)ngrok(-free)?\./',
		'/\.vercel\.app$/',
		'/(^|\.)appspot\.com$/',
		'/^localhost$/',
		'/\.cloudfront\.net$/',
		'/(^|\.)gstatic\.com$/',
		'/\.storage\.googleapis\.com$/',
		'/(^|\.)safelinks\.protection\.outlook\.com$/',
		'/lighthouse|pagespeed|gtmetrix|webpagetest|screamingfrog|semrush|ahrefs/',
	);

	/**
	 * The canonical name of each family of sources, with the patterns of the
	 * sources it covers, matched on the source in lower case without `www.`.
	 * The first family that matches names the source.
	 *
	 * @since n.e.x.t
	 */
	const CANONICAL_SOURCES = array(
		'Google Search Console' => '/^wmx$/',
		'Facebook'              => '/^(fb|facebook|([a-z0-9-]+\.)*facebook\.com)$/',
		'instagram.com'         => '/^(ig|instagram|([a-z0-9-]+\.)*instagram\.com)$/',
		'linkedin.com'          => '/^(linkedin|lnkd\.in|([a-z0-9-]+\.)*linkedin\.com)$/',
		'x.com'                 => '/^(twitter|([a-z0-9-]+\.)*(twitter\.com|x\.com|t\.co))$/',
		'reddit.com'            => '/^(reddit|([a-z0-9-]+\.)*reddit\.com)$/',
		'youtube.com'           => '/^(youtube|youtu\.be|([a-z0-9-]+\.)*youtube\.com)$/',
		'pinterest.com'         => '/^(pinterest|pin\.it|([a-z0-9-]+\.)*pinterest\.[a-z.]+)$/',
		'chatgpt.com'           => '/^(chatgpt|chatgpt\.com|chat\.openai\.com)$/',
		'perplexity.ai'         => '/^(perplexity|perplexity\.ai)$/',
		'copilot.microsoft.com' => '/^(copilot|copilot\.microsoft\.com)$/',
		'gemini.google.com'     => '/^(gemini|gemini\.google\.com)$/',
		'claude.ai'             => '/^(claude|claude\.ai)$/',
		'Microsoft Teams'       => '/^(teams\.microsoft\.com|teams\.live\.com|statics\.teams\.cdn\.office\.net)$/',
	);

	/**
	 * Classifies a session source.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $source The value of `sessionSource`.
	 * @return array|null The source, with `kind`, `REFERRING_SITE` or `CAMPAIGN`, and `title`, the name to show. Null when no card may name it.
	 */
	public static function classify_source( $source ) {
		$source = trim( (string) $source );
		$name   = strtolower( $source );

		if ( Insight_Request_Builder::is_placeholder( $source ) || 'unknown' === $name ) {
			return null;
		}

		$host = preg_replace( '/^www\./', '', $name );

		if ( self::is_search_engine( $host ) || self::is_hidden_host( $host ) ) {
			return null;
		}

		if ( self::is_campaign_shaped( $source ) ) {
			$title = self::get_campaign_title( $source );

			return '' === $title ? null : array(
				'kind'  => self::CAMPAIGN,
				'title' => $title,
			);
		}

		foreach ( self::CANONICAL_SOURCES as $title => $pattern ) {
			if ( preg_match( $pattern, $host ) ) {
				return array(
					'kind'  => self::REFERRING_SITE,
					'title' => $title,
				);
			}
		}

		return array(
			'kind'  => self::REFERRING_SITE,
			'title' => $host,
		);
	}

	/**
	 * Gets the name a card shows for a campaign of the campaign report, or an
	 * empty string when no card may show it.
	 *
	 * Analytics names the visits of no campaign with a placeholder, such as
	 * `(organic)`, which names no campaign. A name made of digits, or with a
	 * long run of them, is an ID or a personal label rather than a name a
	 * reader would recognise: `20103244`, `wnc_376106` and `Maria_20250417`
	 * are left out, and `Summer 2024` is kept. A name of one word is named for
	 * readers, and a name with spaces is kept as typed.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $campaign The value of `sessionCampaignName`.
	 * @return string The name to show, or an empty string.
	 */
	public static function get_campaign_title( $campaign ) {
		$campaign = trim( self::truncate( trim( (string) $campaign ) ) );

		if ( Insight_Request_Builder::is_placeholder( $campaign ) || self::is_opaque_label( $campaign ) ) {
			return '';
		}

		if ( preg_match( '/\s/', $campaign ) ) {
			return $campaign;
		}

		// `Newsletter_October_2025` is "the October 2025 newsletter".
		if ( preg_match( '/^newsletter[_-]+(.+)$/i', $campaign, $matches ) ) {
			return sprintf( 'the %s newsletter', self::replace_separators( $matches[1] ) );
		}

		return self::replace_separators( $campaign );
	}

	/**
	 * Tells whether a source is a search engine, whose visits belong to search.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $host The source in lower case, without `www.`.
	 * @return bool True when it is.
	 */
	private static function is_search_engine( $host ) {
		if ( in_array( $host, self::SEARCH_ENGINE_NAMES, true ) || in_array( $host, self::SEARCH_ENGINE_HOSTS, true ) ) {
			return true;
		}

		// Google and Yandex on a country domain, such as `google.co.uk`, but
		// not a host that only starts with their name, such as `googleblog.com`.
		return (bool) preg_match( '/^(google|yandex)\.[a-z]{2,3}(\.[a-z]{2,3})?$/', $host )
			|| (bool) preg_match( '/\.(search\.yahoo|bing)\.com$/', $host );
	}

	/**
	 * Tells whether a source is an internal, staging, hosting, CDN, mail
	 * scanner or audit tool host.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $host The source in lower case, without `www.`.
	 * @return bool True when it is.
	 */
	private static function is_hidden_host( $host ) {
		foreach ( self::HIDDEN_HOST_PATTERNS as $pattern ) {
			if ( preg_match( $pattern, $host ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Tells whether a source is shaped like a campaign name: it has no host
	 * name suffix, and has an underscore or a year between hyphens, such as
	 * `spring_sale` or `sale-2025`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $source The source.
	 * @return bool True when it is.
	 */
	private static function is_campaign_shaped( $source ) {
		if ( preg_match( '/\.[a-z]{2,}$/i', $source ) ) {
			return false;
		}

		if ( false !== strpos( $source, '_' ) ) {
			return true;
		}

		foreach ( explode( '-', $source ) as $token ) {
			if ( preg_match( '/^(19|20)\d\d$/', $token ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Tells whether a campaign name is an ID or a personal label: it has no
	 * letter, or a run of five digits or more.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $campaign The campaign name.
	 * @return bool True when it is.
	 */
	private static function is_opaque_label( $campaign ) {
		return ! preg_match( '/\p{L}/u', $campaign ) || preg_match( '/\d{5,}/', $campaign );
	}

	/**
	 * Replaces the underscores and hyphens of a name with spaces.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The name.
	 * @return string The name, with one space for each run of them, trimmed.
	 */
	private static function replace_separators( $name ) {
		return trim( preg_replace( '/[_-]+/', ' ', $name ) );
	}

	/**
	 * Truncates a name to `MAX_CAMPAIGN_LENGTH` characters.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The name.
	 * @return string The name, at most `MAX_CAMPAIGN_LENGTH` characters long.
	 */
	private static function truncate( $name ) {
		return function_exists( 'mb_substr' ) ? mb_substr( $name, 0, self::MAX_CAMPAIGN_LENGTH ) : substr( $name, 0, self::MAX_CAMPAIGN_LENGTH );
	}
}
