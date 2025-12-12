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

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaListSubpropertyEventFiltersResponse extends \Google\Collection
{
  protected $collection_key = 'subpropertyEventFilters';
  /**
   * @var string
   */
  public $nextPageToken;
  protected $subpropertyEventFiltersType = GoogleAnalyticsAdminV1alphaSubpropertyEventFilter::class;
  protected $subpropertyEventFiltersDataType = 'array';

  /**
   * @param string
   */
  public function setNextPageToken($nextPageToken)
  {
    $this->nextPageToken = $nextPageToken;
  }
  /**
   * @return string
   */
  public function getNextPageToken()
  {
    return $this->nextPageToken;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaSubpropertyEventFilter[]
   */
  public function setSubpropertyEventFilters($subpropertyEventFilters)
  {
    $this->subpropertyEventFilters = $subpropertyEventFilters;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaSubpropertyEventFilter[]
   */
  public function getSubpropertyEventFilters()
  {
    return $this->subpropertyEventFilters;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaListSubpropertyEventFiltersResponse::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListSubpropertyEventFiltersResponse');
