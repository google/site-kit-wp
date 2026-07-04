<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Dynamic_Blog_Post_Link_Event_List
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking\Event_List;
use Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking\Event;

class Dynamic_Blog_Post_Link_Event_List extends Event_List {

	/**
	 * Registers an event for when someone views or edits a single post from within the blog.
	 *
	 * The events are registered dynamically, i.e. events are per post and include context data.
	 */
	public function register() {
		if ( ! is_home() ) {
			return;
		}

		add_action(
			'the_post',
			function ( $post, $wp_query ) {
				if ( ! $wp_query->is_main_query() ) {
					return;
				}

				$this->add_event(
					new Event(
						array(
							'action'   => 'view_blog_post',
							'selector' => '.blog .post.post-' . $post->ID . ' a[rel="bookmark"]',
							'on'       => 'click',
							'metadata' => array(
								'event_category' => 'engagement',
								'event_label'    => (string) $post->ID,
								// This could be a custom dimension in Google Analytics.
								'post_title'     => $post->post_title,
							),
						)
					)
				);

				$this->add_event(
					new Event(
						array(
							'action'   => 'edit_blog_post',
							'selector' => '.blog .post.post-' . $post->ID . ' a.post-edit-link',
							'on'       => 'click',
							'metadata' => array(
								'event_category' => 'engagement',
								'event_label'    => (string) $post->ID,
								// This could be a custom dimension in Google Analytics.
								'post_title'     => $post->post_title,
							),
						)
					)
				);
			},
			10,
			2
		);
	}
}
