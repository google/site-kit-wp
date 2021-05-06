
<?php

// causes explosion in plugin.php! *BUT NOT HERE?*
return json_decode(
	'{"buildMode":"production","features":["ga4setup","helpVisibility","ideaHubModule","serviceSetupV2","storeErrorNotifications","userInput","widgets.dashboard","widgets.pageDashboard","widgets.moduleScreens"]}'
);
// return array(
//     'buildMode' => 'production',
//     'features' => array(
// 		"ga4setup",
// 		"helpVisibility",
// 		"ideaHubModule",
// 		"serviceSetupV2",
// 		"storeErrorNotifications",
// 		"userInput",
// 		"widgets.dashboard",
// 		"widgets.pageDashboard",
// 		"widgets.moduleScreens"
// 	)
// );
