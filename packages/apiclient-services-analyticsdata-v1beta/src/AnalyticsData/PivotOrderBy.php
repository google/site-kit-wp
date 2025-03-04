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

namespace Google\Service\AnalyticsData;

class PivotOrderBy extends \Google\Collection
{
  protected $collection_key = 'pivotSelections';
  /**
   * @var string
   */
  public $metricName;
  protected $pivotSelectionsType = PivotSelection::class;
  protected $pivotSelectionsDataType = 'array';

  /**
   * @param string
   */
  public function setMetricName($metricName)
  {
    $this->metricName = $metricName;
  }
  /**
   * @return string
   */
  public function getMetricName()
  {
    return $this->metricName;
  }
  /**
   * @param PivotSelection[]
   */
  public function setPivotSelections($pivotSelections)
  {
    $this->pivotSelections = $pivotSelections;
  }
  /**
   * @return PivotSelection[]
   */
  public function getPivotSelections()
  {
    return $this->pivotSelections;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PivotOrderBy::class, 'Google_Service_AnalyticsData_PivotOrderBy');
