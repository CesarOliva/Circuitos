import unittest

import cv2
import numpy as np
from PIL import Image

from analyze import (
    Detection,
    box_keypoints,
    detect_board_corners,
    detect_pin_headers,
    detect_wires,
    detail_label,
    is_board_sized,
    is_resistor_group,
    is_rail_sized_resistor,
    merge_detail_detections,
    order_corners,
    project_points,
    rectify_board,
    remove_duplicate_boxes,
    transform_detection,
)


class CoordinateMappingTests(unittest.TestCase):
    def test_uses_rail_marks_when_board_outline_blends_into_background(self):
        image = np.full((240, 400, 3), 225, dtype=np.uint8)
        cv2.line(image, (49, 55), (350, 55), (235, 20, 25), 3)
        cv2.line(image, (49, 185), (350, 185), (20, 120, 235), 3)

        corners = detect_board_corners(image, (40, 40, 360, 200))

        np.testing.assert_allclose(corners, [[40, 40], [360, 40], [360, 200], [40, 200]], atol=2)

    def test_traces_a_bent_jumper_and_ignores_printed_rails(self):
        image = np.full((460, 800, 3), 225, dtype=np.uint8)
        for y in (28, 422):
            cv2.line(image, (25, y), (775, y + 7), (230, 20, 30), 4)
        self.assertEqual(detect_wires(Image.fromarray(image), []), [])

        cv2.polylines(image, [np.array([[180, 170], [180, 250], [330, 250]])], False, (20, 70, 240), 8)
        wires = detect_wires(Image.fromarray(image), [])

        self.assertEqual(len(wires), 1)
        self.assertEqual(wires[0]["color"], "#1446f0")
        endpoints = sorted((point["x"], point["y"]) for point in (wires[0]["from"], wires[0]["to"]))
        np.testing.assert_allclose(
            endpoints,
            [(180 / 799 - 0.5, 170 / 459 - 0.5), (330 / 799 - 0.5, 250 / 459 - 0.5)],
            atol=0.013,
        )
        self.assertTrue(wires[0]["via"])

    def test_recognizes_one_header_from_its_row_of_contacts(self):
        image = np.full((100, 240, 3), 225, dtype=np.uint8)
        image[40:60, 50:170] = (35, 35, 35)
        for x in range(57, 170, 20):
            image[45:50, x:x + 5] = (220, 180, 90)

        headers = detect_pin_headers(Image.fromarray(image))
        self.assertEqual([(item.label, item.box) for item in headers], [
            ("pin header", (50, 40, 170, 60)),
        ])
        self.assertEqual(detect_wires(Image.fromarray(image), headers), [])
        image[40:60, 50:170] = (35, 35, 35)
        self.assertEqual(detect_pin_headers(Image.fromarray(image)), [])

    def test_rejects_rail_length_resistor_but_keeps_small_one(self):
        self.assertTrue(is_rail_sized_resistor(Detection("resistor", 0.3, (10, 50, 790, 70)), 800, 460))
        self.assertFalse(is_rail_sized_resistor(Detection("resistor", 0.3, (10, 50, 90, 70)), 800, 460))

    def test_rejects_a_component_detection_covering_the_board(self):
        corners = np.array([[40, 206], [291, 154], [526, 322], [235, 408]], dtype=np.float32)

        self.assertTrue(is_board_sized(Detection("resistor", 0.25, (38, 81, 532, 409)), corners))
        self.assertFalse(is_board_sized(Detection("resistor", 0.25, (248, 283, 277, 303)), corners))

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

    def test_finds_cream_board_with_same_brightness_as_background(self):
        image = np.full((240, 320, 3), 225, dtype=np.uint8)
        expected = np.array([[38, 70], [182, 42], [282, 140], [126, 199]], dtype=np.int32)
        cv2.fillConvexPoly(image, expected, (232, 226, 200))

        corners = detect_board_corners(image, (38, 42, 283, 200))

        np.testing.assert_allclose(corners, expected, atol=5)

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
