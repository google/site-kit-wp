<?php
/**
 * Site Goals section template.
 *
 * This template renders a card that shows its metric rows in groups.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array    $section            Section configuration including `title`, `icon`, `dashboard_url`, and `section_parts`.
 * @var callable $render_part        Function to render a template part by name.
 * @var callable $render_shared_part Function to render a shared part by name.
 * @var callable $get_asset_url      Function to get asset URLs.
 */

$section_title = $section['title'];
$section_icon  = $section['icon'];
$dashboard_url = $section['dashboard_url'];
$section_parts = $section['section_parts'];

// The card gives every section part the same values, so we read the first one.
$first_part = reset( $section_parts );
$subtitle   = $first_part['data']['change_context'] ?? '';
$prompt     = $first_part['data']['prompt'] ?? array();

// The "Compared to" line and the change badges show only when a metric has a change.
$all_metrics = array();

foreach ( $section_parts as $part_config ) {
	foreach ( $part_config['data']['groups'] as $group ) {
		$all_metrics = array_merge( $all_metrics, $group['metrics'] );
	}
}

$has_any_change = ! empty(
	array_filter(
		$all_metrics,
		static fn( $metric ) => isset( $metric['trend'] )
	)
);
?>
<table role="presentation" width="100%" style="margin-bottom:24px;">
	<tr>
		<td class="card" style="background-color: #FFFFFF; border-radius: 16px; padding: 16px;">
			<?php
			$render_part(
				'section-header',
				array(
					'icon'     => $get_asset_url( 'icon-' . $section_icon ),
					'title'    => $section_title,
					'subtitle' => '',
				)
			);
			?>

			<?php if ( $has_any_change ) : ?>
			<table role="presentation" width="100%" style="margin-bottom:12px;">
				<tr>
					<td>&nbsp;</td>
					<td class="text-secondary subtitle" width="110"
						style="text-align: right; font-size:12px; line-height:16px; font-weight:500; color:#6C726E; width: 110px;">
						<?php echo esc_html( $subtitle ); ?>
					</td>
				</tr>
			</table>
			<?php endif; ?>
			<?php
			foreach ( $section_parts as $part_config ) {
				foreach ( $part_config['data']['groups'] as $group ) {
					$group_label     = $group['label'];
					$group_metrics   = $group['metrics'];
					$last_metric_key = array_key_last( $group_metrics );
					?>
			<table role="presentation" width="100%" style="margin-bottom:16px;">
					<?php if ( '' !== $group_label ) : ?>
				<tr>
					<td class="text-primary" colspan="2" style="font-size:14px; line-height:20px; padding-bottom:4px;">
						<?php echo esc_html( $group_label ); ?>
					</td>
				</tr>
					<?php endif; ?>
					<?php
					foreach ( $group_metrics as $metric_key => $metric ) {
						$border_style = $last_metric_key === $metric_key ? 'none' : '1px solid #EBEEF0';
						?>
				<tr>
					<td class="border"
						style="vertical-align: top; border-bottom: <?php echo esc_attr( $border_style ); ?>; padding: 12px 0;">
						<div class="text-secondary"
							style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E; margin-bottom:4px;">
							<?php echo esc_html( $metric['label'] ); ?>
						</div>
						<div class="text-primary" style="font-size:14px; line-height:20px; font-weight:500;">
							<?php echo esc_html( $metric['value'] ); ?>
						</div>
					</td>
						<?php if ( $has_any_change ) : ?>
					<td class="border"
						style="text-align: right; vertical-align: middle; border-bottom: <?php echo esc_attr( $border_style ); ?>; padding: 12px 0;">
							<?php
							$render_shared_part(
								'change-badge',
								array(
									'value' => $metric['trend'],
								)
							);
							?>
					</td>
					<?php endif; ?>
				</tr>
						<?php
					}
					?>
			</table>
					<?php
				}
			}

			if ( ! empty( $prompt ) ) {
				$prompt_link = sprintf(
					'<a class="link" href="%1$s" style="color:#108080; text-decoration:none;">%2$s</a>',
					esc_url( $dashboard_url ),
					esc_html( $prompt['link_text'] )
				);
				?>
			<table role="presentation" width="100%" style="margin-bottom:16px;">
				<tr>
					<td class="text-primary" style="font-size:12px; line-height:16px;">
						<?php
						echo wp_kses(
							sprintf( $prompt['text'], $prompt_link ),
							array(
								'a' => array(
									'class' => array(),
									'href'  => array(),
									'style' => array(),
								),
							)
						);
						?>
					</td>
				</tr>
			</table>
				<?php
			}

			$render_part(
				'view-more-in-dashboard',
				array(
					'url'           => $dashboard_url,
					'get_asset_url' => $get_asset_url,
				)
			);
			?>
		</td>
	</tr>
</table>
