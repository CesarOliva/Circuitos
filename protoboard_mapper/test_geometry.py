import unittest

import numpy as np

from analyze import (
    Detection,
    box_keypoints,
    is_resistor_group,
    merge_detail_detections,
    order_corners,
    project_points,
    remove_duplicate_boxes,
)


class CoordinateMappingTests(unittest.TestCase):
    def test_orders_skewed_board_corners(self):
        points = np.array([[90, 60], [20, 15], [110, 125], [15, 100]], dtype=np.float32)

        ordered = order_corners(points)

        np.testing.assert_array_equal(
            ordered,
            np.array([[20, 15], [90, 60], [110, 125], [15, 100]], dtype=np.float32),
        )

    def test_maps_component_center_and_corners_to_board_units(self):
        board = np.array([[0, 0], [100, 0], [100, 50], [0, 50]], dtype=np.float32)
        points = box_keypoints((25, 10, 75, 40))

        mapped = project_points(board, points, 400, 200)

        self.assertEqual(mapped["P1"], {"x": -100.0, "y": -60.0})
        self.assertEqual(mapped["P3"], {"x": 100.0, "y": 60.0})
        self.assertEqual(mapped["centro"], {"x": 0.0, "y": 0.0})

    def test_resistor_group_requires_two_distinct_detections(self):
        group = Detection("resistor", 0.34, (0, 0, 100, 120))
        left = Detection("resistor", 0.16, (4, 10, 47, 105))
        duplicate = Detection("resistor", 0.15, (5, 11, 48, 106))
        right = Detection("resistor", 0.16, (51, 10, 96, 105))

        self.assertFalse(is_resistor_group(group, [group, left, duplicate]))
        self.assertTrue(is_resistor_group(group, [group, left, duplicate, right]))
        self.assertEqual(remove_duplicate_boxes([left, duplicate, right]), [left, right])

    def test_overlapping_component_labels_count_once(self):
        chip = Detection("integrated circuit", 0.76, (10, 10, 100, 40))
        transistor = Detection("transistor", 0.25, (11, 11, 99, 39))
        self.assertEqual(remove_duplicate_boxes([chip, transistor]), [chip])

    def test_merges_tiles_without_counting_the_same_part_twice(self):
        first = Detection("resistor", 0.35, (10, 10, 25, 45))
        cropped_first = Detection("capacitor", 0.4, (11, 10, 24, 25))
        second = Detection("resistor", 0.30, (28, 10, 43, 45))
        duplicate_second = Detection("resistor", 0.28, (29, 11, 44, 46))

        self.assertEqual(
            merge_detail_detections([first], [cropped_first, second, duplicate_second]),
            [first, second],
        )


if __name__ == "__main__":
    unittest.main()
