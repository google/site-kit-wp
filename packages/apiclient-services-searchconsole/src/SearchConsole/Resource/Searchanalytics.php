<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SearchConsole\Resource;

use Google\Service\SearchConsole\SearchAnalyticsQueryRequest;
use Google\Service\SearchConsole\SearchAnalyticsQueryResponse;

/**
 * The "searchanalytics" collection of methods.
 * Typical usage is:
 *  <code>
 *   $searchconsoleService = new Google\Service\SearchConsole(...);
 *   $searchanalytics = $searchconsoleService->searchanalytics;
 *  </code>
 */
class Searchanalytics extends \Google\Service\Resource
{
  /**
   * Query your data with filters and parameters that you define. Returns zero or
   * more rows grouped by the row keys that you define. You must define a date
   * range of one or more days. When date is one of the group by values, any days
   * without data are omitted from the result list. If you need to know which days
   * have data, issue a broad date range query grouped by date for any metric, and
   * see which day rows are returned. (searchanalytics.query)
   *
   * @param string $siteUrl The site's URL, including protocol. For example:
   * `http://www.example.com/`.
   * @param SearchAnalyticsQueryRequest $postBody
   * @param array $optParams Optional parameters.
   * @return SearchAnalyticsQueryResponse
   * @throws \Google\Service\Exception
   */
  public function query($siteUrl, SearchAnalyticsQueryRequest $postBody, $optParams = [])
  {
    $params = ['siteUrl' => $siteUrl, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('query', [$params], SearchAnalyticsQueryResponse::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Searchanalytics::class, 'Google_Service_SearchConsole_Resource_Searchanalytics');
