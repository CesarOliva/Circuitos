import unittest

import numpy as np

from analyze import (
    Detection,
    box_keypoints,
    detect_board_corners,
    detail_label,
    is_resistor_group,
    merge_detail_detections,
    order_corners,
    project_points,
    rectify_board,
    remove_duplicate_boxes,
    transform_detection,
)


class CoordinateMappingTests(unittest.TestCase):
    def test_suppresses_a_component_at_a_detected_jumper_but_keeps_neighbors(self):
        false_resistor = Detection("resistor", 0.25, (20, 12, 39, 30))
        led = Detection("led", 0.8, (37, 22, 59, 45))
        jumper = Detection("wire", 0.6, (18, 10, 40, 31))

        self.assertEqual(merge_detail_detections([false_resistor, led], [jumper]), [led])

    def test_rectifies_an_oblique_board_and_preserves_component_anchor(self):
        image = np.zeros((220, 320, 3), dtype=np.uint8)
        corners = np.array([[70, 20], [280, 70], [250, 195], [20, 125]], dtype=np.float32)
        rectified, transform = rectify_board(image, corners, 2)
        candidate = Detection("led", 0.9, (105, 68, 135, 92))

        x, y = box_keypoints(transform_detection(candidate, transform).box)["centro"]
        expected = project_points(corners, {"center": [120, 80]}, 400, 200)["center"]
        np.testing.assert_allclose(
            [x / (rectified.width - 1) - 0.5, y / (rectified.height - 1) - 0.5],
            [expected["x"] / 400, expected["y"] / 200],
            atol=0.0001,
        )

    def test_rejects_wire_before_resistor_color_heuristic(self):
        hsv = np.full((200, 200, 3), (20, 180, 180), dtype=np.uint8)
        hsv[44:56, 55:59, 2] = 60
        self.assertIsNone(detail_label("jumper wire", hsv, (40, 40, 80, 60), 0.8, 0.22))

    def test_keeps_chip_and_switch_that_fill_a_detail_crop(self):
        hsv = np.zeros((100, 100, 3), dtype=np.uint8)
        box = (20, 20, 80, 60)
        self.assertEqual(detail_label("microchip", hsv, box, 0.3, 0.22), "integrated circuit")
        hsv[:, :, 1] = 200
        self.assertEqual(detail_label("dip switch", hsv, box, 0.42, 0.22), "switch")

    def test_weak_switch_prediction_on_a_short_red_jumper_is_rejected(self):
        hsv = np.full((266, 464, 3), (0, 210, 200), dtype=np.uint8)
        self.assertIsNone(detail_label("dip switch", hsv, (330, 39, 367, 113), 0.221, 0.22))

    def test_keeps_neighboring_resistors_with_overlapping_boxes(self):
        first = Detection("resistor", 0.8, (0, 0, 30, 35))
        second = Detection("resistor", 0.4, (13, 0, 43, 35))
        duplicate = Detection("resistor", 0.3, (14, 0, 44, 35))

        self.assertEqual(merge_detail_detections([first], [second, duplicate]), [first, second])

    def test_finds_board_corners_against_a_similar_background(self):
        image = np.full((200, 300, 3), 230, dtype=np.uint8)
        image[45:155, 55:245] = 222

        corners = detect_board_corners(image, (55, 45, 245, 155))

        np.testing.assert_allclose(corners, [[55, 45], [244, 45], [244, 154], [55, 154]], atol=2)

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
