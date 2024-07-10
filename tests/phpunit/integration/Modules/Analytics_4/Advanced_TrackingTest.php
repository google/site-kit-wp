<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Advanced_TrackingTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Modules\Fixed_Blog_Post_Link_Event_List;
use Google\Site_Kit\Tests\Modules\Dynamic_Blog_Post_Link_Event_List;
use WP_Query;

/**
 * @group Modules
 * @group Analytics
 */
class Advanced_TrackingTest extends TestCase {

	public function test_register() {
		$advanced_tracking = new Advanced_Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		remove_all_actions( 'googlesitekit_analytics-4_init_tag' );
		remove_all_actions( 'googlesitekit_analytics-4_init_tag_amp' );

		$advanced_tracking->register();

		$this->assertTrue( has_action( 'googlesitekit_analytics-4_init_tag' ) );
		$this->assertTrue( has_action( 'googlesitekit_analytics-4_init_tag_amp' ) );

		remove_all_actions( 'wp_footer' );
		do_action( 'googlesitekit_analytics-4_init_tag', 'G-1A2BCD345E' );
		$this->assertTrue( has_action( 'wp_footer' ) );

		remove_all_filters( 'googlesitekit_amp_gtag_opt' );
		do_action( 'googlesitekit_analytics-4_init_tag_amp', 'G-1A2BCD345E' );
		$this->assertTrue( has_filter( 'googlesitekit_amp_gtag_opt' ) );
	}

	public function test_register_event_lists_fixed() {
		$advanced_tracking = new Advanced_Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$advanced_tracking->register();

		// Hook in registration call for Fixed_Blog_Post_Link_Event_List.
		$event_list = new Fixed_Blog_Post_Link_Event_List();
		$this->add_action_register_event_list( $event_list );

		// Triggers Advanced_Tracking::register_event_lists() call.
		do_action( 'googlesitekit_analytics-4_init_tag', 'G-1A2BCD345E' );

		$this->assertCount( 2, $event_list->get_events() ); // The class adds 2 events during registration.
	}

	public function test_register_event_lists_dynamic() {
		global $wp_query;

		$advanced_tracking = new Advanced_Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$advanced_tracking->register();

		// Hook in registration call for Dynamic_Blog_Post_Link_Event_List.
		$event_list = new Dynamic_Blog_Post_Link_Event_List();
		$this->add_action_register_event_list( $event_list );

		// After actual registration below, we'll check for a 'the_post' hook added from
		// Dynamic_Blog_Post_Link_Event_List, which requires `is_home()` to be `true`, so let's fake that here.
		$orig_wp_query     = $wp_query;
		$wp_query          = new WP_Query();
		$wp_query->is_home = true;
		remove_all_actions( 'the_post' );

		// Triggers Advanced_Tracking::register_event_lists() call.
		do_action( 'googlesitekit_analytics-4_init_tag', 'G-1A2BCD345E' );

		// Reset original query after change above and check whether the 'the_post' hook from
		// Dynamic_Blog_Post_Link_Event_List was added.
		$wp_query = $orig_wp_query;
		$this->assertTrue( has_action( 'the_post' ) );
		$this->assertEmpty( $event_list->get_events() ); // Events will only be added on 'the_post'.
	}

	public function test_compile_events() {
		$advanced_tracking = new Advanced_Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$advanced_tracking->register();

		// Hook in registration call for Fixed_Blog_Post_Link_Event_List three times.
		for ( $i = 0; $i < 3; $i++ ) {
			$this->add_action_register_event_list( new Fixed_Blog_Post_Link_Event_List() );
		}

		// Triggers Advanced_Tracking::register_event_lists() call.
		do_action( 'googlesitekit_analytics-4_init_tag_amp', 'G-1A2BCD345E' );

		// Triggers Advanced_Tracking::compile_events() call.
		apply_filters( 'googlesitekit_amp_gtag_opt', array() );

		// The class adds 2 unique events, registered 3 times.
		$this->assertCount( 2, $advanced_tracking->get_events() );
	}

	private function add_action_register_event_list( $event_list ) {
		add_action(
			'googlesitekit_analytics_register_event_lists',
			function ( $event_list_registry ) use ( $event_list ) {
				$event_list_registry->register_list( $event_list );
			}
		);
	}
}
