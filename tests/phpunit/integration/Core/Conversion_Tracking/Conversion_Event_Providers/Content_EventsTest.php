<?php
/**
 * Content_EventsTest
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Content_Events;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Tests\TestCase;

class Content_EventsTest extends TestCase {

	/**
	 * Every eligible event and its description, on an install without bbPress.
	 *
	 * Spelled out here rather than read back from the provider, so a changed
	 * description or a reordered entry fails the test.
	 */
	const EXPECTED_ELIGIBLE_EVENTS = array(
		'read_article'                                => 'single blog posts',
		'pagination_click'                            => 'posts split into pages',
		'contact_link_click'                          => 'email, phone, SMS and messaging-app links',
		'outbound_link_click'                         => 'external links with rel="sponsored", rel="ugc" or rel="nofollow"',
		'video_start, video_progress, video_complete' => 'Vimeo embeds',
	);

	/**
	 * Content_Events instance.
	 *
	 * @var Content_Events
	 */
	private $content_events;

	public function set_up() {
		parent::set_up();
		$this->content_events = new Content_Events( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function test_is_active() {
		$this->assertTrue( $this->content_events->is_active(), 'Content_Events provider should always be active.' );
	}

	public function test_get_category() {
		$this->assertEquals( Conversion_Events_Provider::CATEGORY_CONTENT, $this->content_events->get_category(), 'Content_Events category should be CATEGORY_CONTENT.' );
	}

	public function test_get_event_names() {
		$this->assertEquals( array(), $this->content_events->get_event_names(), 'Content_Events provider should return an empty array of event names.' );
	}

	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-' . Content_Events::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ), 'Content events script should not be registered initially.' );

		$script = $this->content_events->register_script();
		$this->assertInstanceOf( Script::class, $script, 'Content events provider should return a Script instance.' );
		$this->assertTrue( wp_script_is( $handle, 'registered' ), 'Content events script should be registered.' );
	}

	public function test_register_hooks__attaches_init_tag_listeners_and_no_content_hooks() {
		remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
		remove_all_actions( 'googlesitekit_ads_init_tag' );
		remove_all_actions( 'wp_footer' );

		$this->content_events->register_hooks();

		$this->assertTrue( (bool) has_action( 'googlesitekit_analytics-4_init_tag' ), 'Analytics init-tag action should be registered.' );
		$this->assertTrue( (bool) has_action( 'googlesitekit_ads_init_tag' ), 'Ads init-tag action should be registered.' );
		$this->assertFalse( has_action( 'wp_footer' ), 'wp_footer content hook should not be attached before tag initialization.' );
	}

	/**
	 * @dataProvider data_tag_actions
	 */
	public function test_register_hooks__bootstraps_on_init_tag( $tag_action ) {
		remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
		remove_all_actions( 'googlesitekit_ads_init_tag' );
		remove_all_actions( 'wp_footer' );

		$this->content_events->register_hooks();
		$this->assertFalse( has_action( 'wp_footer' ), 'wp_footer content hook should not be attached before tag initialization.' );

		do_action( $tag_action );

		$this->assertTrue( (bool) has_action( 'wp_footer' ), "wp_footer content hook should be attached after $tag_action fires." );
	}

	public function data_tag_actions() {
		return array(
			'analytics-4' => array( 'googlesitekit_analytics-4_init_tag' ),
			'ads'         => array( 'googlesitekit_ads_init_tag' ),
		);
	}

	public function test_register_hooks__firing_both_tags_bootstraps_once() {
		remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
		remove_all_actions( 'googlesitekit_ads_init_tag' );
		remove_all_actions( 'wp_footer' );

		$this->content_events->register_hooks();

		$count_before = isset( $GLOBALS['wp_filter']['wp_footer'] ) ? count( $GLOBALS['wp_filter']['wp_footer']->callbacks[10] ) : 0;

		do_action( 'googlesitekit_analytics-4_init_tag' );
		$count_after_first = count( $GLOBALS['wp_filter']['wp_footer']->callbacks[10] );

		do_action( 'googlesitekit_ads_init_tag' );
		$count_after_second = count( $GLOBALS['wp_filter']['wp_footer']->callbacks[10] );

		$this->assertEquals( $count_before + 1, $count_after_first, 'First tag init should add one content hook callback.' );
		$this->assertEquals( $count_after_first, $count_after_second, 'Second tag init should not add duplicate content hook callbacks.' );
	}

	public function test_register_hooks__amp_init_tag_does_not_bootstrap() {
		remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
		remove_all_actions( 'googlesitekit_ads_init_tag' );
		remove_all_actions( 'wp_footer' );

		$this->content_events->register_hooks();

		do_action( 'googlesitekit_analytics-4_init_tag_amp' );

		$this->assertFalse( has_action( 'wp_footer' ), 'AMP tag init should not bootstrap content hooks.' );
	}

	public function test_inline_config__single_post() {
		$post_id = $this->factory()->post->create();
		$this->go_to( get_permalink( $post_id ) );

		remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
		remove_all_actions( 'googlesitekit_ads_init_tag' );
		remove_all_actions( 'wp_footer' );

		$this->content_events->register_script();
		$this->content_events->register_hooks();

		do_action( 'googlesitekit_analytics-4_init_tag' );
		do_action( 'wp_footer' );

		$handle        = 'googlesitekit-events-provider-' . Content_Events::CONVERSION_EVENT_PROVIDER_SLUG;
		$inline_script = join( "\n", (array) wp_scripts()->get_data( $handle, 'before' ) );

		$this->assertStringContainsString( '"postID":' . $post_id, $inline_script, 'Inline config on single post should include the post ID.' );
		$this->assertStringContainsString( '"isSinglePost":true', $inline_script, 'Inline config on single post should have isSinglePost true.' );
	}

	public function test_inline_config__home_page() {
		$this->go_to( home_url( '/' ) );

		remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
		remove_all_actions( 'googlesitekit_ads_init_tag' );
		remove_all_actions( 'wp_footer' );

		$this->content_events->register_script();
		$this->content_events->register_hooks();

		do_action( 'googlesitekit_analytics-4_init_tag' );
		do_action( 'wp_footer' );

		$handle        = 'googlesitekit-events-provider-' . Content_Events::CONVERSION_EVENT_PROVIDER_SLUG;
		$inline_script = join( "\n", (array) wp_scripts()->get_data( $handle, 'before' ) );

		$this->assertStringContainsString( '"postID":0', $inline_script, 'Inline config on home page should have postID 0.' );
		$this->assertStringContainsString( '"isSinglePost":false', $inline_script, 'Inline config on home page should have isSinglePost false.' );
	}

	/**
	 * Removes stale hooks, then re-registers the script and action/filter hooks.
	 */
	private function reset_and_register_hooks() {
		remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
		remove_all_actions( 'googlesitekit_ads_init_tag' );
		remove_all_actions( 'wp_footer' );
		remove_all_filters( 'embed_oembed_html' );
		remove_all_filters( 'render_block' );

		$this->content_events->register_script();
		$this->content_events->register_hooks();
	}

	/**
	 * Resets and registers hooks, then bootstraps the content hooks as a real tag-init would.
	 */
	private function bootstrap_content_hooks() {
		$this->reset_and_register_hooks();

		do_action( 'googlesitekit_analytics-4_init_tag' );
	}

	public function test_filter_embed_html__adds_enablejsapi_to_youtube_iframe() {
		$this->bootstrap_content_hooks();

		$html = '<p class="wp-block-embed__wrapper"><iframe width="500" height="281" src="https://www.youtube.com/embed/abc123?feature=oembed" frameborder="0" allowfullscreen></iframe></p>';

		$filtered = apply_filters( 'embed_oembed_html', $html, 'https://youtu.be/abc123' );

		$this->assertSame( 1, substr_count( $filtered, 'enablejsapi=1' ), 'enablejsapi=1 should appear exactly once in the filtered markup.' );
		$this->assertStringContainsString( 'feature=oembed', $filtered, 'Existing query args should be kept.' );
		$this->assertStringContainsString( 'width="500"', $filtered, 'Other iframe attributes should be unchanged.' );
		$this->assertStringContainsString( 'height="281"', $filtered, 'Other iframe attributes should be unchanged.' );
		$this->assertStringContainsString( 'frameborder="0"', $filtered, 'Other iframe attributes should be unchanged.' );
		$this->assertStringContainsString( 'allowfullscreen', $filtered, 'Other iframe attributes should be unchanged.' );
		$this->assertStringContainsString( '<p class="wp-block-embed__wrapper">', $filtered, 'Wrapper markup around the iframe should be unchanged.' );
	}

	public function test_filter_embed_html__preserves_whitespace_before_src() {
		$this->bootstrap_content_hooks();

		$html = '<iframe width="500" height="281" src="https://www.youtube.com/embed/abc123" frameborder="0"></iframe>';

		$filtered = apply_filters( 'embed_oembed_html', $html );

		$this->assertStringContainsString( 'height="281" src="', $filtered, 'The attribute preceding src should stay separated from src by whitespace.' );
		$this->assertStringNotContainsString( '"281"src', $filtered, 'Rewriting src should never merge it into the previous attribute.' );
	}

	/**
	 * @dataProvider data_src_quoting_styles
	 */
	public function test_filter_embed_html__rewrites_src_regardless_of_quoting_style( $iframe_markup ) {
		$this->bootstrap_content_hooks();

		$filtered = apply_filters( 'embed_oembed_html', $iframe_markup );

		$this->assertSame( 1, substr_count( $filtered, 'enablejsapi=1' ), 'enablejsapi=1 should be added regardless of how the src attribute is quoted.' );
	}

	public function data_src_quoting_styles() {
		return array(
			'double-quoted'   => array( '<iframe src="https://www.youtube.com/embed/abc123"></iframe>' ),
			'single-quoted'   => array( "<iframe src='https://www.youtube.com/embed/abc123'></iframe>" ),
			'unquoted'        => array( '<iframe src=https://www.youtube.com/embed/abc123></iframe>' ),
			'unquoted midway' => array( '<iframe width=500 src=https://www.youtube.com/embed/abc123 height=281></iframe>' ),
		);
	}

	public function test_filter_embed_html__matches_uppercase_iframe_tag() {
		$this->bootstrap_content_hooks();

		$html = '<IFRAME SRC="https://www.youtube.com/embed/abc123"></IFRAME>';

		$filtered = apply_filters( 'embed_oembed_html', $html );

		$this->assertStringContainsString( 'enablejsapi=1', $filtered, 'An uppercase iframe tag should still be rewritten.' );
	}

	public function test_filter_embed_html__overwrites_existing_enablejsapi_param() {
		$this->bootstrap_content_hooks();

		$html = '<iframe src="https://www.youtube.com/embed/abc123?enablejsapi=0"></iframe>';

		$filtered = apply_filters( 'embed_oembed_html', $html );

		$this->assertSame( 1, substr_count( $filtered, 'enablejsapi=1' ), 'enablejsapi=1 should appear exactly once.' );
		$this->assertStringNotContainsString( 'enablejsapi=0', $filtered, 'The old enablejsapi=0 value should be overwritten, not appended alongside.' );
	}

	public function test_filter_embed_html__decodes_ampersand_escaped_src() {
		$this->bootstrap_content_hooks();

		$html = '<iframe src="https://www.youtube.com/embed/abc123?feature=oembed&#038;wmode=opaque"></iframe>';

		$filtered = apply_filters( 'embed_oembed_html', $html );

		$this->assertSame( 1, substr_count( $filtered, 'enablejsapi=1' ), 'enablejsapi=1 should appear exactly once.' );
		$this->assertStringContainsString( 'feature=oembed', $filtered, 'Existing query args should survive entity-decoding.' );
		$this->assertStringContainsString( 'wmode=opaque', $filtered, 'Existing query args should survive entity-decoding.' );
	}

	/**
	 * @dataProvider data_youtube_hosts
	 */
	public function test_filter_embed_html__rewrites_every_youtube_host( $host ) {
		$this->bootstrap_content_hooks();

		$html = '<iframe src="https://' . $host . '/embed/abc123"></iframe>';

		$filtered = apply_filters( 'embed_oembed_html', $html );

		$this->assertStringContainsString( 'enablejsapi=1', $filtered, "$host embeds should get enablejsapi=1." );
	}

	public function data_youtube_hosts() {
		return array(
			'youtube.com'     => array( 'youtube.com' ),
			'www.youtube.com' => array( 'www.youtube.com' ),
			'm.youtube.com'   => array( 'm.youtube.com' ),
		);
	}

	/**
	 * @dataProvider data_non_youtube_hosts
	 */
	public function test_filter_embed_html__leaves_non_youtube_hosts_unchanged( $src ) {
		$this->bootstrap_content_hooks();

		$html = '<iframe src="' . $src . '"></iframe>';

		$filtered = apply_filters( 'embed_oembed_html', $html );

		$this->assertSame( $html, $filtered, "$src should pass through unchanged." );
	}

	public function data_non_youtube_hosts() {
		return array(
			'youtube-nocookie.com'      => array( 'https://www.youtube-nocookie.com/embed/abc123' ),
			'notyoutube.com'            => array( 'https://notyoutube.com/embed/abc123' ),
			'youtube.com in query only' => array( 'https://example.com/?u=youtube.com' ),
		);
	}

	public function test_filter_embed_html__leaves_vimeo_iframe_unchanged_but_sets_flag() {
		$this->bootstrap_content_hooks();

		$html = '<iframe src="https://player.vimeo.com/video/12345"></iframe>';

		$filtered = apply_filters( 'embed_oembed_html', $html );

		$this->assertSame( $html, $filtered, 'Vimeo iframe markup should be byte-identical.' );

		do_action( 'wp_footer' );

		$handle        = 'googlesitekit-events-provider-' . Content_Events::CONVERSION_EVENT_PROVIDER_SLUG;
		$inline_script = join( "\n", (array) wp_scripts()->get_data( $handle, 'before' ) );

		$this->assertStringContainsString( '"hasVimeoEmbed":true', $inline_script, 'hasVimeoEmbed should be true after a Vimeo embed was seen.' );
	}

	public function test_filter_embed_html__no_vimeo_embed_reports_false() {
		$this->bootstrap_content_hooks();

		$html = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>';
		apply_filters( 'embed_oembed_html', $html );

		do_action( 'wp_footer' );

		$handle        = 'googlesitekit-events-provider-' . Content_Events::CONVERSION_EVENT_PROVIDER_SLUG;
		$inline_script = join( "\n", (array) wp_scripts()->get_data( $handle, 'before' ) );

		$this->assertStringContainsString( '"hasVimeoEmbed":false', $inline_script, 'hasVimeoEmbed should be false when no Vimeo iframe was seen.' );
	}

	public function test_filter_embed_html__core_embed_block_rewrites_youtube_iframe() {
		$this->bootstrap_content_hooks();

		$block = array( 'blockName' => 'core/embed' );
		$html  = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>';

		$filtered = apply_filters( 'render_block', $html, $block );

		$this->assertStringContainsString( 'enablejsapi=1', $filtered, 'A core/embed block iframe should be rewritten.' );
	}

	public function test_filter_embed_html__core_embed_sub_block_rewrites_youtube_iframe() {
		$this->bootstrap_content_hooks();

		$block = array( 'blockName' => 'core-embed/youtube' );
		$html  = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>';

		$filtered = apply_filters( 'render_block', $html, $block );

		$this->assertStringContainsString( 'enablejsapi=1', $filtered, 'A core-embed/youtube block iframe should be rewritten.' );
	}

	public function test_filter_embed_html__non_embed_block_passes_through_untouched() {
		$this->bootstrap_content_hooks();

		$block = array( 'blockName' => 'core/paragraph' );
		$html  = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>';

		$filtered = apply_filters( 'render_block', $html, $block );

		$this->assertSame( $html, $filtered, 'A non-embed block should not be filtered.' );
	}

	public function test_filter_embed_html__markup_without_iframe_passes_through_unchanged() {
		$this->bootstrap_content_hooks();

		$html = '<p>No iframe here.</p>';

		$filtered = apply_filters( 'embed_oembed_html', $html );

		$this->assertSame( $html, $filtered, 'Markup with no iframe tag should be returned unchanged.' );
	}

	public function test_filter_embed_html__iframe_without_src_passes_through_unchanged() {
		$this->bootstrap_content_hooks();

		$html = '<iframe width="500" height="281" frameborder="0"></iframe>';

		$filtered = apply_filters( 'embed_oembed_html', $html );

		$this->assertSame( $html, $filtered, 'An iframe with no src attribute should be returned unchanged.' );
	}

	public function test_filter_embed_html__without_bootstrap_leaves_markup_unchanged_and_publishes_no_config() {
		$this->reset_and_register_hooks();

		$html = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>';

		$this->assertSame( $html, apply_filters( 'embed_oembed_html', $html ), 'embed_oembed_html should be untouched without the tag-init bootstrap.' );
		$this->assertSame(
			$html,
			apply_filters( 'render_block', $html, array( 'blockName' => 'core/embed' ) ),
			'render_block should be untouched without the tag-init bootstrap.'
		);

		$vimeo_html = '<iframe src="https://player.vimeo.com/video/12345"></iframe>';
		apply_filters( 'embed_oembed_html', $vimeo_html );

		// wp_footer's publishing closure was never registered without the
		// bootstrap, so this should publish nothing at all.
		do_action( 'wp_footer' );

		$handle = 'googlesitekit-events-provider-' . Content_Events::CONVERSION_EVENT_PROVIDER_SLUG;

		$this->assertEmpty(
			wp_scripts()->get_data( $handle, 'before' ),
			'No inline config should be published without the tag-init bootstrap.'
		);
	}

	public function test_get_eligible_events__lists_every_event_in_order_with_a_description() {
		$this->assertSame(
			self::EXPECTED_ELIGIBLE_EVENTS,
			$this->content_events->get_eligible_events(),
			'Eligible events should list every event, in the documented order, with the page or link it can fire on.'
		);
	}

	public function test_get_debug_data__joins_the_seven_event_names() {
		$this->assertSame(
			'read_article, pagination_click, contact_link_click, outbound_link_click, video_start, video_progress, video_complete',
			$this->content_events->get_debug_data(),
			'Debug data should list the seven event names in one comma-separated list.'
		);
	}

	public function test_get_eligible_events__pagination_click_omits_bbpress_when_inactive() {
		$this->assertFalse( class_exists( 'bbPress' ), 'This test assumes bbPress is not loaded.' );

		$eligible_events = $this->content_events->get_eligible_events();

		$this->assertSame(
			'posts split into pages',
			$eligible_events['pagination_click'],
			'pagination_click should not name bbPress when bbPress is inactive.'
		);
	}

	/**
	 * This test makes the `bbPress` class exist. PHP can't remove a class once
	 * it's added, so it would stay for later tests that expect bbPress to be
	 * inactive. Running in a separate process keeps it to this test only.
	 *
	 * @runInSeparateProcess
	 */
	public function test_get_eligible_events__pagination_click_names_bbpress_when_active() {
		if ( ! class_exists( 'bbPress' ) ) {
			// `class_alias()` requires a user-defined source class, so alias
			// this test case rather than an internal class like `stdClass`.
			class_alias( __CLASS__, 'bbPress' );
		}

		$eligible_events = $this->content_events->get_eligible_events();

		$this->assertSame(
			'posts split into pages, bbPress topics',
			$eligible_events['pagination_click'],
			'pagination_click should name bbPress topics when bbPress is active.'
		);
	}

	/**
	 * Both methods report what the install makes possible, so nothing about the
	 * current request may change them.
	 *
	 * @dataProvider data_requests
	 */
	public function test_eligible_events_and_debug_data__do_not_depend_on_the_request( $go_to_request, $bootstrap_content_hooks ) {
		$expected_events     = $this->content_events->get_eligible_events();
		$expected_debug_data = $this->content_events->get_debug_data();

		$go_to_request( $this );

		if ( $bootstrap_content_hooks ) {
			remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
			remove_all_actions( 'googlesitekit_ads_init_tag' );

			$this->content_events->register_script();
			$this->content_events->register_hooks();

			do_action( 'googlesitekit_analytics-4_init_tag' );
		}

		$this->assertSame( $expected_events, $this->content_events->get_eligible_events(), 'Eligible events should not vary with the request.' );
		$this->assertSame( $expected_debug_data, $this->content_events->get_debug_data(), 'Debug data should not vary with the request.' );
	}

	public function data_requests() {
		return array(
			'an admin request'                  => array(
				function () {
					set_current_screen( 'dashboard' );
				},
				false,
			),
			'a single post'                     => array(
				function ( $test ) {
					$test->go_to( get_permalink( $test->factory()->post->create() ) );
				},
				false,
			),
			'a single post, hooks bootstrapped' => array(
				function ( $test ) {
					$test->go_to( get_permalink( $test->factory()->post->create() ) );
				},
				true,
			),
			'the home page'                     => array(
				function ( $test ) {
					$test->go_to( home_url( '/' ) );
				},
				false,
			),
			'the home page, hooks bootstrapped' => array(
				function ( $test ) {
					$test->go_to( home_url( '/' ) );
				},
				true,
			),
		);
	}

	public function test_eligible_events_and_debug_data__carry_no_site_or_user_identifiers() {
		$user_id = $this->factory()->user->create(
			array(
				'display_name' => 'Debug Data Author',
				'user_login'   => 'debugdataauthor',
			)
		);
		$post_id = $this->factory()->post->create(
			array(
				'post_title'  => 'A Very Distinctive Post Title',
				'post_author' => $user_id,
			)
		);
		$this->go_to( get_permalink( $post_id ) );

		$eligible_events = $this->content_events->get_eligible_events();
		$reported        = implode(
			' ',
			array_merge(
				array( $this->content_events->get_debug_data() ),
				array_keys( $eligible_events ),
				array_values( $eligible_events )
			)
		);

		foreach (
			array(
				'site URL'    => home_url(),
				'post title'  => 'A Very Distinctive Post Title',
				'author name' => 'Debug Data Author',
				'post ID'     => (string) $post_id,
			) as $label => $identifier
		) {
			$this->assertStringNotContainsString( $identifier, $reported, "Reported content events should not carry the $label." );
		}
	}

	public function test_conversion_event_enumerations__report_no_content_events() {
		$conversion_tracking = new Conversion_Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( array(), $this->content_events->get_event_names(), 'Content events should stay out of the provider event names.' );
		$this->assertEquals( array(), $this->content_events->get_site_kit_event_names(), 'Content events should stay out of the Site Kit event names.' );
		$this->assertEquals( array(), $this->content_events->get_enhanced_event_names(), 'Content events should stay out of the enhanced event names.' );
		$this->assertEquals( Conversion_Events_Provider::CATEGORY_CONTENT, $this->content_events->get_category(), 'Content_Events category should remain CATEGORY_CONTENT.' );

		$feature_metrics = $conversion_tracking->get_feature_metrics();

		foreach ( array_keys( $this->content_events->get_eligible_events() ) as $event_key ) {
			foreach ( explode( ', ', $event_key ) as $event_name ) {
				$this->assertNotContains( $event_name, $conversion_tracking->get_supported_conversion_events(), "$event_name should not appear in the supported conversion events." );
				$this->assertNotContains( $event_name, $conversion_tracking->get_site_kit_supported_conversion_events(), "$event_name should not appear in the Site Kit supported conversion events." );
				$this->assertNotContains( $event_name, $feature_metrics['conversion_tracking_events'], "$event_name should not appear in the conversion feature metrics." );
			}
		}
	}
}
