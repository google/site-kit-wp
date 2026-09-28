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
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Content_Events;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Tests\TestCase;

class Content_EventsTest extends TestCase {

	/**
	 * Post type the `a single custom post type entry` data set registers.
	 */
	const TEST_POST_TYPE = 'sitekit_test_cpt';

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

	public function tear_down() {
		// WordPress keeps a registered post type for the rest of the process, so
		// every test after this one sees it.
		unregister_post_type( self::TEST_POST_TYPE );

		parent::tear_down();
	}

	public function test_is_active() {
		$this->assertTrue( $this->content_events->is_active(), 'Content_Events provider should always be active.' );
	}

	public function test_get_category() {
		$this->assertEquals( 'content', $this->content_events->get_category(), 'Content events should report the `content` category.' );
	}

	public function test_get_event_names() {
		$this->assertEquals( array(), $this->content_events->get_event_names(), 'Content_Events provider should return an empty array of event names.' );
	}

	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-content-events';
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

		$config = $this->get_published_config();

		$this->assertSame( $post_id, $config['postID'], 'The published configuration should report the post ID on a single post.' );
		$this->assertTrue( $config['isSinglePost'], '`isSinglePost` should be true on a single post.' );
	}

	public function test_inline_config__home_page() {
		$this->go_to( home_url( '/' ) );

		remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
		remove_all_actions( 'googlesitekit_ads_init_tag' );
		remove_all_actions( 'wp_footer' );

		$this->content_events->register_script();
		$this->content_events->register_hooks();

		do_action( 'googlesitekit_analytics-4_init_tag' );

		$config = $this->get_published_config();

		$this->assertSame( 0, $config['postID'], '`postID` should be 0 on the home page.' );
		$this->assertFalse( $config['isSinglePost'], '`isSinglePost` should be false on the home page.' );
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

		$config = $this->get_published_config();

		$this->assertTrue( $config['hasVimeoEmbed'], '`hasVimeoEmbed` should be true after a Vimeo embed rendered.' );
	}

	public function test_filter_embed_html__no_vimeo_embed_reports_false() {
		$this->bootstrap_content_hooks();

		$html = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>';
		apply_filters( 'embed_oembed_html', $html );

		$config = $this->get_published_config();

		$this->assertFalse( $config['hasVimeoEmbed'], '`hasVimeoEmbed` should be false when no Vimeo iframe rendered.' );
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

		$handle = 'googlesitekit-events-provider-content-events';

		$this->assertEmpty(
			wp_scripts()->get_data( $handle, 'before' ),
			'No inline config should be published without the tag-init bootstrap.'
		);
	}

	public function test_get_eligible_events__lists_every_event_in_order_with_a_description() {
		$this->assertSame(
			array(
				'read_article'        => 'single blog posts',
				'pagination_click'    => 'posts split into pages',
				'contact_link_click'  => 'email, phone, SMS and messaging-app links',
				'outbound_link_click' => 'external links with rel="sponsored", rel="ugc" or rel="nofollow"',
				'video_start, video_progress, video_complete' => 'Vimeo embeds',
			),
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

	public function test_eligible_events_and_debug_data__have_no_site_or_user_identifiers() {
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
			$this->assertStringNotContainsString( $identifier, $reported, "Reported content events should not include the $label." );
		}
	}

	/**
	 * Creates a post and makes it the request being served.
	 *
	 * The post gets no excerpt of its own. `get_the_excerpt()` then builds one
	 * from the content, and runs `the_content` the way it does on a real site.
	 *
	 * @param string $content Post content.
	 * @return int The post ID.
	 */
	private function go_to_new_post( $content ) {
		$post_id = $this->factory()->post->create(
			array(
				'post_content' => $content,
				'post_excerpt' => '',
			)
		);

		$this->go_to( get_permalink( $post_id ) );

		return $post_id;
	}

	/**
	 * Creates a post of three pages and makes one of its pages the request
	 * being served.
	 *
	 * @param int $page Page number to request, from 1 to 3.
	 */
	private function go_to_page_of_paginated_post( $page ) {
		$post_id = $this->factory()->post->create(
			array(
				'post_excerpt' => '',
				'post_content' => 'Page one text.<!--nextpage-->Page two text.<!--nextpage-->Page three text.',
			)
		);

		$this->go_to( add_query_arg( 'page', $page, get_permalink( $post_id ) ) );
	}

	/**
	 * Runs the WordPress loop the way a theme does, and returns what
	 * `the_content` rendered.
	 *
	 * `Content_Events` reads globals that only the loop fills, so the tests run
	 * the loop rather than applying the filter on its own.
	 *
	 * @param string|null $content Content to filter, or `null` for the post's own.
	 * @return string The rendered content.
	 */
	private function apply_the_content( $content = null ) {
		$rendered = '';

		while ( have_posts() ) {
			the_post();

			$rendered = apply_filters( 'the_content', $content ?? get_the_content() );
		}

		wp_reset_postdata();

		return $rendered;
	}

	/**
	 * Publishes the inline configuration and returns it as an array.
	 *
	 * @return array The published content events configuration.
	 */
	private function get_published_config() {
		do_action( 'wp_footer' );

		$handle        = 'googlesitekit-events-provider-content-events';
		$inline_script = join( "\n", (array) wp_scripts()->get_data( $handle, 'before' ) );

		$this->assertSame(
			1,
			preg_match( '/window\._googlesitekit\.contentEvents = (\{.*\});/', $inline_script, $matches ),
			'The inline script should publish a content events configuration object.'
		);

		return json_decode( $matches[1], true );
	}

	/**
	 * Measures a piece of content as the post being read, and returns the
	 * configuration the provider publishes.
	 *
	 * @param string $content Content to measure.
	 * @return array The published content events configuration.
	 */
	private function measure_as_post_content( $content ) {
		$this->go_to_new_post( 'Placeholder content the test replaces.' );

		$this->bootstrap_content_hooks();
		$this->apply_the_content( $content );

		return $this->get_published_config();
	}

	/**
	 * Skips the running test when PHP has no `intl` extension, which provides the
	 * International Components for Unicode (ICU) word splitter.
	 */
	private function skip_without_intl() {
		if ( ! class_exists( 'IntlBreakIterator' ) ) {
			$this->markTestSkipped( 'This test needs the PHP `intl` extension.' );
		}
	}

	public function test_append_end_of_content_marker__appends_the_marker_to_the_post_being_read() {
		$this->go_to_new_post( 'Some post content.' );
		$this->bootstrap_content_hooks();

		$rendered = $this->apply_the_content();

		$this->assertStringContainsString(
			'<span class="googlesitekit-end-of-content" aria-hidden="true" style="display:block;height:1px;margin-bottom:-1px"></span>',
			$rendered,
			'The rendered content should have the marker span.'
		);
		$this->assertSame(
			1,
			substr_count( $rendered, 'googlesitekit-end-of-content' ),
			'The marker should appear exactly once.'
		);
	}

	public function test_append_end_of_content_marker__appends_the_marker_before_markup_added_at_the_default_priority() {
		$this->go_to_new_post( 'Some post content.' );
		$this->bootstrap_content_hooks();

		add_filter(
			'the_content',
			function ( $content ) {
				return $content . '<div class="share-buttons"></div>';
			}
		);

		$rendered = $this->apply_the_content();

		$this->assertStringContainsString(
			'googlesitekit-end-of-content',
			$rendered,
			'The rendered content should include the marker HTML.'
		);

		$this->assertLessThan(
			strpos( $rendered, 'share-buttons' ),
			strpos( $rendered, 'googlesitekit-end-of-content' ),
			"The marker should be placed before the markup added by another, lower-priority plugin's filter."
		);
	}

	public function test_append_end_of_content_marker__appends_the_marker_only_once_per_request() {
		$this->go_to_new_post( 'Some post content.' );
		$this->bootstrap_content_hooks();

		$first  = $this->apply_the_content();
		$second = $this->apply_the_content();

		$this->assertStringContainsString( 'googlesitekit-end-of-content', $first, 'The first run of `the_content` should append the marker.' );
		$this->assertStringNotContainsString( 'googlesitekit-end-of-content', $second, 'A second run of `the_content` in the same request should append nothing.' );
	}

	public function test_append_end_of_content_marker__appends_no_marker_for_another_post_rendered_on_the_page() {
		$this->go_to_new_post( 'The post being read.' );
		$this->bootstrap_content_hooks();

		$other_post = $this->factory()->post->create_and_get( array( 'post_content' => 'Another post shown by a Query Loop.' ) );

		$GLOBALS['post'] = $other_post;
		setup_postdata( $other_post );

		$rendered = apply_filters( 'the_content', $other_post->post_content );

		wp_reset_postdata();

		$this->assertStringNotContainsString(
			'googlesitekit-end-of-content',
			$rendered,
			'A post rendered by a nested loop should not render the marker.'
		);
	}

	public function test_append_end_of_content_marker__appends_no_marker_to_an_excerpt_taken_before_the_content() {
		$post_id = $this->go_to_new_post( 'Some post content the excerpt is built from.' );
		$this->bootstrap_content_hooks();

		$excerpt = get_the_excerpt( $post_id );

		$this->assertStringNotContainsString( 'googlesitekit-end-of-content', $excerpt, 'An excerpt should not render the marker.' );

		$rendered = $this->apply_the_content();

		$this->assertStringContainsString(
			'googlesitekit-end-of-content',
			$rendered,
			'An excerpt taken first should not stop the real content from rendering the marker.'
		);
	}

	public function test_append_end_of_content_marker__appends_no_marker_to_an_excerpt_taken_after_the_content() {
		$post_id = $this->go_to_new_post( 'Some post content the excerpt is built from.' );
		$this->bootstrap_content_hooks();

		$rendered = $this->apply_the_content();
		$excerpt  = get_the_excerpt( $post_id );

		$this->assertStringContainsString( 'googlesitekit-end-of-content', $rendered, 'The real content should render the marker.' );
		$this->assertStringNotContainsString( 'googlesitekit-end-of-content', $excerpt, 'An excerpt taken after the content has rendered should not render the marker.' );
	}

	/**
	 * @dataProvider data_requests_without_a_marker
	 */
	public function test_append_end_of_content_marker__appends_no_marker_outside_a_single_post( $go_to_request, $request_label ) {
		$go_to_request( $this );

		$this->bootstrap_content_hooks();

		$rendered = $this->apply_the_content();

		$this->assertStringNotContainsString(
			'googlesitekit-end-of-content',
			$rendered,
			"Only a single blog post should render the marker, so $request_label should not."
		);
	}

	public function data_requests_without_a_marker() {
		return array(
			'a feed of the post'              => array(
				function ( $test ) {
					$post_id = $test->factory()->post->create( array( 'post_content' => 'Some post content.' ) );

					$test->go_to( add_query_arg( 'feed', 'rss2', get_permalink( $post_id ) ) );

					$test->assertTrue( is_feed(), 'Adding `feed=rss2` to the post permalink should give a feed request.' );
				},
				'a feed of the post',
			),
			'the oEmbed page of the post'     => array(
				function ( $test ) {
					$post_id = $test->factory()->post->create( array( 'post_content' => 'Some post content.' ) );

					$test->go_to( get_post_embed_url( $post_id ) );

					$test->assertTrue( is_embed(), 'The oEmbed URL of a post should give an embed request.' );
				},
				'the oEmbed page of the post',
			),
			'a page'                          => array(
				function ( $test ) {
					$page_id = $test->factory()->post->create(
						array(
							'post_type'    => 'page',
							'post_content' => 'Some page content.',
						)
					);

					$test->go_to( get_permalink( $page_id ) );
				},
				'a page',
			),
			'a single custom post type entry' => array(
				function ( $test ) {
					register_post_type( self::TEST_POST_TYPE, array( 'public' => true ) );

					$custom_post_id = $test->factory()->post->create(
						array(
							'post_type'    => self::TEST_POST_TYPE,
							'post_content' => 'Some custom post type content.',
						)
					);

					$test->go_to( get_permalink( $custom_post_id ) );
				},
				'a single custom post type entry',
			),
			'a category archive'              => array(
				function ( $test ) {
					$category_id = $test->factory()->category->create();
					$test->factory()->post->create(
						array(
							'post_content'  => 'Some post content.',
							'post_category' => array( $category_id ),
						)
					);

					$test->go_to( get_category_link( $category_id ) );
				},
				'a category archive',
			),
			'a search results page'           => array(
				function ( $test ) {
					$test->factory()->post->create(
						array(
							'post_title'   => 'A distinctive searchable title',
							'post_content' => 'Some post content.',
						)
					);

					$test->go_to( home_url( '/?s=distinctive' ) );

					$test->assertTrue( is_search(), 'A request for `/?s=distinctive` should give a search results request.' );
				},
				'a search results page',
			),
			'the home page'                   => array(
				function ( $test ) {
					$test->factory()->post->create( array( 'post_content' => 'Some post content.' ) );

					$test->go_to( home_url( '/' ) );
				},
				'the home page',
			),
		);
	}

	/**
	 * @dataProvider data_paginated_post_pages
	 */
	public function test_append_end_of_content_marker__appends_the_marker_to_the_last_page_of_a_paginated_post_only( $page, $expects_marker ) {
		$this->go_to_page_of_paginated_post( $page );
		$this->bootstrap_content_hooks();

		$rendered = $this->apply_the_content();

		if ( $expects_marker ) {
			$this->assertStringContainsString( 'googlesitekit-end-of-content', $rendered, "Page $page should output the marker, because it is the post's last page." );
		} else {
			$this->assertStringNotContainsString( 'googlesitekit-end-of-content', $rendered, "Page $page should not output the marker, because it is not the post's last page." );
		}
	}

	public function data_paginated_post_pages() {
		return array(
			'page 1 of 3' => array( 1, false ),
			'page 2 of 3' => array( 2, false ),
			'page 3 of 3' => array( 3, true ),
		);
	}

	public function test_measure_content__counts_the_text_alone_without_shortcodes_tags_or_block_delimiters() {
		$config = $this->measure_as_post_content(
			"<!-- wp:paragraph -->\n<p>The quick <strong>brown</strong> fox.</p>\n<!-- /wp:paragraph -->\n[gallery ids=\"1,2,3\"]"
		);

		$this->assertSame( 4, $config['wordCount'], 'The word count should count the text alone, with the markup, the block delimiters, the shortcode, etc. removed.' );
	}

	public function test_measure_content__counts_only_the_requested_page_of_a_paginated_post() {
		$post_id = $this->factory()->post->create(
			array(
				'post_excerpt' => '',
				'post_content' => 'One two three four five.<!--nextpage-->Six seven.',
			)
		);

		$this->go_to( add_query_arg( 'page', 2, get_permalink( $post_id ) ) );
		$this->bootstrap_content_hooks();
		$this->apply_the_content();

		$config = $this->get_published_config();

		$this->assertSame( 2, $config['wordCount'], "The word count should count the requested page's text alone." );
	}

	/**
	 * @dataProvider data_scripts_without_word_spacing
	 */
	public function test_measure_content__counts_the_words_of_a_script_written_without_spaces( $text, $expected_word_count ) {
		$this->skip_without_intl();

		$config = $this->measure_as_post_content( $text );

		$this->assertSame( $expected_word_count, $config['wordCount'], 'ICU should find the words in a script written without spaces between them.' );
	}

	public function data_scripts_without_word_spacing() {
		return array(
			'Chinese'                    => array( '我喜欢写代码。', 4 ),
			'Japanese'                   => array( '私はコードを書くのが好きです。', 9 ),
			'mixed English and Japanese' => array( 'Site Kit by Google の新機能', 7 ),
		);
	}

	public function test_measure_content__splits_a_thai_sentence_into_words() {
		$this->skip_without_intl();

		$config = $this->measure_as_post_content( 'ฉันชอบเขียนโปรแกรมคอมพิวเตอร์' );

		// The exact count depends on the ICU version a server has, because
		// ICU splits Thai with its own dictionary.
		$this->assertGreaterThan( 1, $config['wordCount'], 'A Thai sentence should count as more than the one word a space split returns.' );
	}

	/**
	 * @dataProvider data_scripts_with_word_spacing
	 */
	public function test_measure_content__matches_the_space_split_for_a_script_written_with_spaces( $text, $expected_word_count ) {
		$this->skip_without_intl();

		$config = $this->measure_as_post_content( $text );

		$this->assertSame(
			$expected_word_count,
			$config['wordCount'],
			'A language that separates words with spaces should give the same count as a space split.'
		);
	}

	public function data_scripts_with_word_spacing() {
		return array(
			'English' => array( 'The quick brown fox jumps over the lazy dog.', 9 ),
			'Korean'  => array( '나는 코드 작성을 좋아합니다', 4 ),
			'Arabic'  => array( 'أنا أحب كتابة الشفرة', 4 ),
			'Russian' => array( 'Я люблю писать код', 4 ),
			'Greek'   => array( 'Μου αρέσει να γράφω κώδικα', 5 ),
			'Hebrew'  => array( 'אני אוהב לכתוב קוד', 4 ),
			'Hindi'   => array( 'मुझे कोड लिखना पसंद है', 5 ),
		);
	}

	/**
	 * @dataProvider data_locales
	 */
	public function test_measure_content__counts_the_same_words_for_every_site_language( $locale ) {
		$this->skip_without_intl();

		add_filter(
			'locale',
			function () use ( $locale ) {
				return $locale;
			}
		);

		$config = $this->measure_as_post_content( '私はコードを書くのが好きです。' );

		$this->assertSame( 9, $config['wordCount'], "A Japanese post should count the same on a site running in $locale." );
	}

	public function data_locales() {
		return array(
			'English'  => array( 'en_US' ),
			'Japanese' => array( 'ja_JP' ),
			'Chinese'  => array( 'zh_CN' ),
		);
	}

	/**
	 * @dataProvider data_digits_punctuation_and_emoji
	 */
	public function test_measure_content__counts_digits_but_not_punctuation_or_emoji( $text, $expected_word_count ) {
		$this->skip_without_intl();

		$config = $this->measure_as_post_content( $text );

		$this->assertSame( $expected_word_count, $config['wordCount'], 'Digits should count as words; punctuation and emoji should not.' );
	}

	public function data_digits_punctuation_and_emoji() {
		return array(
			'a version number'     => array( 'Version 3.14', 2 ),
			'Japanese punctuation' => array( '「テスト」、。！？', 1 ),
			'an emoji'             => array( 'Hello 👋 world', 2 ),
		);
	}

	/**
	 * @dataProvider data_estimated_read_times
	 */
	public function test_measure_content__estimates_the_reading_time_at_238_words_a_minute( $word_count, $expected_seconds ) {
		$this->skip_without_intl();

		$config = $this->measure_as_post_content( trim( str_repeat( 'word ', $word_count ) ) );

		$this->assertSame( $word_count, $config['wordCount'], "A post of $word_count words should count $word_count words." );
		$this->assertSame( $expected_seconds, $config['estimatedReadTimeSeconds'], "A post of $word_count words should take $expected_seconds seconds to read." );
	}

	public function data_estimated_read_times() {
		return array(
			'20 words'  => array( 20, 5 ),
			'150 words' => array( 150, 38 ),
			'238 words' => array( 238, 60 ),
			'600 words' => array( 600, 151 ),
		);
	}

	public function test_measure_content__takes_151_seconds_for_a_japanese_post_of_600_words() {
		$this->skip_without_intl();

		$config = $this->measure_as_post_content( str_repeat( 'コードを書く。', 200 ) );

		$this->assertSame( 600, $config['wordCount'], 'A Japanese post of 200 three-word sentences should count 600 words.' );
		$this->assertSame( 151, $config['estimatedReadTimeSeconds'], 'A Japanese post of 600 words should take 151 seconds to read, the same as an English post of 600 words.' );
	}

	public function test_measure_content__counts_the_rest_of_the_text_when_the_content_is_not_valid_utf8() {
		$this->skip_without_intl();

		$config = $this->measure_content_alone( "The quick brown fox \xB1\x80 jumps over the lazy dog" );

		$this->assertSame( 9, $config['wordCount'], 'The ICU count should skip invalid content and count the rest of the text.' );
	}

	public function test_inline_config__reports_the_reading_time_values() {
		$this->go_to_new_post( trim( str_repeat( 'word ', 238 ) ) );
		$this->bootstrap_content_hooks();
		$this->apply_the_content();

		$config = $this->get_published_config();

		$this->assertSame( 238, $config['wordCount'], 'The configuration should report the word count.' );
		$this->assertSame( 60, $config['estimatedReadTimeSeconds'], 'The configuration should report the estimated reading time.' );
		$this->assertSame( 85, $config['readTimeThresholdPercent'], 'The configuration should report the percentage of the estimate a visitor must stay.' );
		$this->assertSame( 5, $config['minimumReadTimeSeconds'], 'The configuration should report the shortest waiting time.' );
		$this->assertTrue( $config['isLastPageOfMultiPagePost'], 'A post that is not split into pages should report itself as the last page.' );
	}

	/**
	 * @dataProvider data_paginated_post_pages
	 */
	public function test_inline_config__reports_the_last_page_of_a_paginated_post( $page, $is_last_page ) {
		$this->go_to_page_of_paginated_post( $page );
		$this->bootstrap_content_hooks();
		$this->apply_the_content();

		$config = $this->get_published_config();

		$this->assertSame(
			$is_last_page,
			$config['isLastPageOfMultiPagePost'],
			"`isLastPageOfMultiPagePost` should say whether page $page is the last of the post's 3 pages."
		);
	}

	public function test_inline_config__falls_back_to_the_queried_post_when_the_content_never_runs() {
		$this->go_to_new_post( trim( str_repeat( 'word ', 238 ) ) );
		$this->bootstrap_content_hooks();

		// A page builder renders the post content without running `the_content`,
		// so this test applies no filter.
		$config = $this->get_published_config();

		$this->assertSame( 238, $config['wordCount'], 'The word count should come from the queried post.' );
		$this->assertSame( 60, $config['estimatedReadTimeSeconds'], 'The "time-to-read" estimate should come from the queried post.' );
		$this->assertTrue( $config['isLastPageOfMultiPagePost'], 'A post that is not split into pages should report itself as the last page.' );
	}

	/**
	 * @dataProvider data_paginated_post_pages
	 */
	public function test_inline_config__falls_back_to_the_queried_page_of_a_paginated_post( $page, $is_last_page ) {
		$this->go_to_page_of_paginated_post( $page );
		$this->bootstrap_content_hooks();

		$config = $this->get_published_config();

		$this->assertSame(
			$is_last_page,
			$config['isLastPageOfMultiPagePost'],
			"`isLastPageOfMultiPagePost` should say whether page $page is the last of the post's 3 pages, even when `the_content` never runs."
		);
		$this->assertSame( 3, $config['wordCount'], "The word count should count page $page's text alone." );
	}

	public function test_inline_config__reports_no_reading_time_outside_a_single_post() {
		$this->factory()->post->create( array( 'post_content' => 'Some post content.' ) );
		$this->go_to( home_url( '/' ) );

		$this->bootstrap_content_hooks();
		$this->apply_the_content();

		$config = $this->get_published_config();

		$this->assertSame( 0, $config['wordCount'], 'The home page should report no word count.' );
		$this->assertSame( 0, $config['estimatedReadTimeSeconds'], 'The home page should report no reading time.' );
		$this->assertFalse( $config['isLastPageOfMultiPagePost'], 'The home page should not report a last page, because it is not a single post.' );
	}

	/**
	 * Replaces the provider under test with one that counts words without ICU.
	 */
	private function use_provider_without_intl() {
		$this->content_events = new Content_Events_Without_Intl( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * Measures a piece of content with the `Content_Events` filter as the only
	 * one on `the_content`.
	 *
	 * The tests that pass invalid UTF-8 bytes call this helper. With the other
	 * filters removed, no warning from one of WordPress's own filters can look
	 * like a warning from `Content_Events`.
	 *
	 * @param string $content Content to measure.
	 * @return array The published content events configuration.
	 */
	private function measure_content_alone( $content ) {
		$this->go_to_new_post( 'Placeholder content the test replaces.' );

		remove_all_filters( 'the_content' );

		$this->bootstrap_content_hooks();
		$this->apply_the_content( $content );

		return $this->get_published_config();
	}

	public function test_measure_content__keeps_the_english_word_count_and_estimate_when_intl_is_missing() {
		$this->use_provider_without_intl();

		$config = $this->measure_as_post_content( 'The quick brown fox jumps over the lazy dog.' );

		$this->assertSame( 9, $config['wordCount'], 'English should count the same without ICU.' );
		$this->assertSame( 2, $config['estimatedReadTimeSeconds'], 'The reading time for an English post should come from its word count without ICU.' );
	}

	public function test_measure_content__estimates_japanese_from_its_characters_when_intl_is_missing() {
		$this->use_provider_without_intl();

		// The sentence holds 14 counted characters, because `。` doesn't count,
		// so 80 sentences give 1,120.
		$config = $this->measure_as_post_content( str_repeat( '私はコードを書くのが好きです。', 80 ) );

		$this->assertSame( 1, $config['wordCount'], 'A Japanese paragraph should count as one word on a space split.' );
		$this->assertSame(
			135,
			$config['estimatedReadTimeSeconds'],
			'A Japanese post of one word and 1,120 counted characters should take 135 seconds.'
		);
	}

	/**
	 * @dataProvider data_characters_without_word_spacing
	 */
	public function test_measure_content__counts_the_characters_of_a_script_written_without_spaces_when_intl_is_missing( $character ) {
		$this->use_provider_without_intl();

		$config = $this->measure_as_post_content( str_repeat( $character, 1000 ) );

		$this->assertSame( 1, $config['wordCount'], 'A paragraph written without spaces should count as one word on a space split.' );
		$this->assertSame(
			120,
			$config['estimatedReadTimeSeconds'],
			'A post of 1,000 counted characters should take 120 seconds at 500 characters a minute.'
		);
	}

	public function data_characters_without_word_spacing() {
		return array(
			'Chinese'           => array( '漢' ),
			'Japanese hiragana' => array( 'あ' ),
			'Japanese katakana' => array( 'ア' ),
			'Thai'              => array( 'ก' ),
			'Lao'               => array( 'ກ' ),
			'Khmer'             => array( 'ក' ),
			'Burmese'           => array( 'က' ),
		);
	}

	public function test_measure_content__counts_nothing_when_the_content_is_not_valid_utf8_and_intl_is_missing() {
		$this->use_provider_without_intl();

		$config = $this->measure_content_alone( "The quick brown fox \xB1\x80 jumps over the lazy dog" );

		$this->assertSame( 0, $config['wordCount'], 'Text that is not valid UTF-8 should count no words on a space split.' );
		$this->assertSame( 0, $config['estimatedReadTimeSeconds'], 'Text that counts no words and no characters should take no time to read.' );
	}

	public function test_conversion_event_enumerations__report_no_content_events() {
		$conversion_tracking = new Conversion_Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( array(), $this->content_events->get_event_names(), 'Content events should stay out of the provider event names.' );
		$this->assertEquals( array(), $this->content_events->get_site_kit_event_names(), 'Content events should stay out of the Site Kit event names.' );
		$this->assertEquals( array(), $this->content_events->get_enhanced_event_names(), 'Content events should stay out of the enhanced event names.' );
		$this->assertEquals( 'content', $this->content_events->get_category(), 'Content events should stay in the `content` category.' );

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
