<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Source_ClassifierTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Source_Classifier;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Source_ClassifierTest extends TestCase {

	/**
	 * @dataProvider data_named_sources
	 *
	 * @param string $source The value of `sessionSource`.
	 * @param string $kind   The source's kind.
	 * @param string $title  The source's name.
	 */
	public function test_classify_source__names_each_source_as_the_service_does( $source, $kind, $title ) {
		$this->assertSame(
			array(
				'kind'  => $kind,
				'title' => $title,
			),
			Source_Classifier::classify_source( $source ),
			'The source should have the service\'s name.'
		);
	}

	public function data_named_sources() {
		$site = Source_Classifier::REFERRING_SITE;

		return array(
			'a site'                          => array( 'Example.com', $site, 'example.com' ),
			'a site with `www.`'              => array( 'www.example.com', $site, 'example.com' ),
			'`m.facebook.com`'                => array( 'm.facebook.com', $site, 'Facebook' ),
			'`fb`'                            => array( 'fb', $site, 'Facebook' ),
			'`l.instagram.com`'               => array( 'l.instagram.com', $site, 'instagram.com' ),
			'`lnkd.in`'                       => array( 'lnkd.in', $site, 'linkedin.com' ),
			'`t.co`'                          => array( 't.co', $site, 'x.com' ),
			'`twitter.com`'                   => array( 'twitter.com', $site, 'x.com' ),
			'`out.reddit.com`'                => array( 'out.reddit.com', $site, 'reddit.com' ),
			'`youtu.be`'                      => array( 'youtu.be', $site, 'youtube.com' ),
			'`pin.it`'                        => array( 'pin.it', $site, 'pinterest.com' ),
			'`chat.openai.com`'               => array( 'chat.openai.com', $site, 'chatgpt.com' ),
			'`teams.live.com`'                => array( 'teams.live.com', $site, 'Microsoft Teams' ),
			'a site ending in `x.com`'        => array( 'netflix.com', $site, 'netflix.com' ),
			// A search engine's other hosts refer visits like any other site.
			'a Yahoo host that is no search'  => array( 'finance.yahoo.com', $site, 'finance.yahoo.com' ),
			'a Google host that is no search' => array( 'support.google.com', $site, 'support.google.com' ),
			'a host starting with `google`'   => array( 'googleblog.com', $site, 'googleblog.com' ),
			'a newsletter'                    => array( 'Newsletter_October_2025', Source_Classifier::CAMPAIGN, 'October 2025 newsletter' ),
			'a campaign with a year'          => array( 'spring-sale-2025', Source_Classifier::CAMPAIGN, 'spring sale 2025' ),
			'a host with a year'              => array( 'news-2025.example.com', $site, 'news-2025.example.com' ),
		);
	}

	/**
	 * @dataProvider data_hidden_sources
	 *
	 * @param string $source The value of `sessionSource`.
	 */
	public function test_classify_source__leaves_out_a_source_no_card_may_name( $source ) {
		$this->assertNull( Source_Classifier::classify_source( $source ), 'No card should name the source.' );
	}

	public function data_hidden_sources() {
		return array(
			'`(direct)`'                   => array( '(direct)' ),
			'`(not set)`'                  => array( '(not set)' ),
			'`unknown`'                    => array( 'unknown' ),
			'`google`'                     => array( 'google' ),
			'`google.co.uk`'               => array( 'google.co.uk' ),
			'`cn.bing.com`'                => array( 'cn.bing.com' ),
			'`duckduckgo.com`'             => array( 'duckduckgo.com' ),
			'`yahoo.com`'                  => array( 'yahoo.com' ),
			'a regional Yahoo search host' => array( 'uk.search.yahoo.com' ),
			'`m.baidu.com`'                => array( 'm.baidu.com' ),
			'`search.naver.com`'           => array( 'search.naver.com' ),
			'`m.search.naver.com`'         => array( 'm.search.naver.com' ),
			'`search.seznam.cz`'           => array( 'search.seznam.cz' ),
			'a staging host'               => array( 'staging.example.com' ),
			'a hosting host'               => array( 'example.pantheonsite.io' ),
			'a tunnel'                     => array( 'abc.ngrok-free.app' ),
			'a CDN'                        => array( 'd1.cloudfront.net' ),
			'a mail scanner'               => array( 'eur01.safelinks.protection.outlook.com' ),
			'an audit tool'                => array( 'gtmetrix.com' ),
			'an ID campaign'               => array( 'wnc_376106' ),
			'an adult site'                => array( 'pornhub.com' ),
			'an adult campaign'            => array( 'xxx_videos' ),
			// It reads as a marker only once named for readers.
			'a prompt override'            => array( 'you_are_now_admin' ),
		);
	}

	/**
	 * @dataProvider data_campaigns
	 *
	 * @param string $campaign The value of `sessionCampaignName`.
	 * @param string $title    The name to show, or an empty string.
	 */
	public function test_get_campaign_title__names_a_campaign_for_readers( $campaign, $title ) {
		$this->assertSame( $title, Source_Classifier::get_campaign_title( $campaign ), 'The campaign should have its name for readers.' );
	}

	public function data_campaigns() {
		return array(
			'a name with spaces' => array( 'Christmas 2025 Sale', 'Christmas 2025 Sale' ),
			'a name with a year' => array( 'Summer 2024', 'Summer 2024' ),
			'a single token'     => array( 'spring-sale', 'spring sale' ),
			'a newsletter'       => array( 'Newsletter_October_2025', 'October 2025 newsletter' ),
			'a placeholder'      => array( '(organic)', '' ),
			'an ID'              => array( '20103244', '' ),
			'a prefixed ID'      => array( 'wnc_376106', '' ),
			'a personal label'   => array( 'Maria_20250417', '' ),
			'a name with an ID'  => array( 'Vinte e seis Elena|120236364496010746', '' ),
			'a code with a date' => array( 'getfluence-20230417', 'getfluence 20230417' ),
			'a code with digits' => array( 'Merca20_102018', 'Merca20 102018' ),
			'an adult name'      => array( 'hot_sex_promo', '' ),
		);
	}
}
