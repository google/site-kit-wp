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
use Google\Site_Kit\Tests\TestCase;

class Content_EventsTest extends TestCase {

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
		$this->assertTrue( $this->content_events->is_active(), 'Content_Events provider should be active on a bare install.' );
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

		$this->content_events->register_script();
		$this->content_events->register_hooks();

		do_action( 'googlesitekit_analytics-4_init_tag' );
		do_action( 'wp_footer' );

		$handle        = 'googlesitekit-events-provider-' . Content_Events::CONVERSION_EVENT_PROVIDER_SLUG;
		$inline_script = join( "\n", (array) wp_scripts()->get_data( $handle, 'before' ) );

		$this->assertStringContainsString( '"postID":0', $inline_script, 'Inline config on home page should have postID 0.' );
		$this->assertStringContainsString( '"isSinglePost":false', $inline_script, 'Inline config on home page should have isSinglePost false.' );
	}
}
